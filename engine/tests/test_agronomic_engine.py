"""
Bateria de Testes Automatizados para o Motor Agronômico Fertiva
Verifica a conformidade com a Seção 11 (Critérios de Aceite e Testes) da Especificação Técnica.
"""

import pytest
from fertiva_engine.models import (
    SoilSampleInput,
    LimingCalculationRequest,
    GypsumCalculationRequest
)
from fertiva_engine.soil_math import calculate_derived_indices
from fertiva_engine.liming import calculate_liming
from fertiva_engine.gypsum import calculate_gypsum
from fertiva_engine.interpretation import interpret_soil_sample
from fertiva_engine.fertilization import calculate_crop_fertilization


def test_derived_indices_calculation():
    """Testa cálculo clássico de SB, CTC e saturação por bases V%"""
    sample = SoilSampleInput(
        ca_cmolc=2.5,
        mg_cmolc=0.8,
        k_cmolc=0.2,   # SB = 2.5 + 0.8 + 0.2 = 3.5
        al_cmolc=0.3,   # t = 3.5 + 0.3 = 3.8
        h_al_cmolc=4.5  # T = 3.5 + 4.5 = 8.0
    )
    derived = calculate_derived_indices(sample)
    
    assert derived.sb == 3.5
    assert derived.ctc_effective == 3.8
    assert derived.ctc_ph7 == 8.0
    # V% = (3.5 / 8.0) * 100 = 43.75%
    assert derived.v_percent == 43.75
    # m% = (0.3 / 3.8) * 100 = 7.89%
    assert derived.m_percent == 7.89
    assert derived.is_consistent is True


def test_consistency_warning_on_anomalous_data():
    """Sinaliza inconsistência se CTC efetiva for maior que CTC a pH 7"""
    sample = SoilSampleInput(
        ca_cmolc=2.0,
        mg_cmolc=1.0,
        k_cmolc=0.5,
        al_cmolc=3.0,   # t = 6.5
        h_al_cmolc=1.0  # T = 4.5 (impossível em solos reais: t > T)
    )
    derived = calculate_derived_indices(sample)
    assert derived.is_consistent is False
    assert any("Inconsistência detectada" in w for w in derived.consistency_warnings)


def test_liming_calculation_deterministic():
    """Testa o cálculo da necessidade de calagem pelo método da saturação por bases"""
    # T = 8.0 cmol_c/dm3, V1 = 43.75%, V2 = 60%, PRNT = 80%, 10 ha
    sample = SoilSampleInput(
        ca_cmolc=2.5,
        mg_cmolc=0.8,
        k_cmolc=0.2,
        h_al_cmolc=4.5
    )
    req = LimingCalculationRequest(
        plot_area_ha=10.0,
        target_v_percent=60.0,
        prnt_percent=80.0,
        incorporation_depth_cm=20
    )
    res = calculate_liming(sample, req)
    
    assert res.is_blocked is False
    # NC = [8.0 * (60 - 43.75) / 100] * (100 / 80)
    # NC = [8.0 * 16.25 / 100] * 1.25 = 1.30 * 1.25 = 1.625 -> 1.63 t/ha
    assert res.dose_ton_per_ha in (1.62, 1.63)
    assert res.total_ton in (16.2, 16.3)
    assert len(res.calculation_steps) > 5


def test_liming_blocks_when_missing_h_al():
    """Bloqueia o cálculo e aponta dados insuficientes se H+Al faltar no laudo"""
    sample = SoilSampleInput(
        ca_cmolc=2.5,
        mg_cmolc=0.8,
        k_cmolc=0.2,
        h_al_cmolc=None  # Ausente
    )
    req = LimingCalculationRequest(
        plot_area_ha=5.0,
        target_v_percent=60.0
    )
    res = calculate_liming(sample, req)
    assert res.is_blocked is True
    assert "H+Al ausente" in (res.block_reason or "")


def test_gypsum_requires_subsurface_sample():
    """Atende ao requisito 6.6: Bloqueia gessagem sem análise de 20-40 cm"""
    req = GypsumCalculationRequest(
        plot_area_ha=15.0,
        has_subsurface_sample=False,
        subsurface_sample=None
    )
    res = calculate_gypsum(req)
    assert res.is_recommended is False
    assert any("20 a 40 cm" in lim for lim in res.limitations)


def test_gypsum_recommends_when_subsurface_criteria_met():
    """Recomenda gesso quando Ca < 0.4 ou m% > 20% na subsuperfície"""
    sub_sample = SoilSampleInput(
        depth_start_cm=20,
        depth_end_cm=40,
        ca_cmolc=0.25,   # Crítico (< 0.4)
        mg_cmolc=0.10,
        k_cmolc=0.05,
        al_cmolc=0.80,   # Crítico (> 0.5)
        h_al_cmolc=2.0,
        clay_percent=40.0
    )
    req = GypsumCalculationRequest(
        plot_area_ha=20.0,
        has_subsurface_sample=True,
        subsurface_sample=sub_sample,
        crop_type="anual"
    )
    res = calculate_gypsum(req)
    assert res.is_recommended is True
    # NG (kg/ha) = 50 * 40 = 2000 kg/ha = 2.0 t/ha
    assert res.dose_ton_per_ha == 2.0
    assert res.total_ton == 40.0
    assert len(res.met_criteria) >= 2


def test_crop_fertilization_corn():
    """Verifica recomendação determinística para milho alta produtividade"""
    sample = SoilSampleInput(
        p_mehlich1=6.0,  # Baixo
        k_cmolc=0.10,    # Baixo
        clay_percent=35.0
    )
    plan = calculate_crop_fertilization("milho", "alta", sample, plot_area_ha=10.0)
    assert plan.crop == "Milho"
    assert plan.requirements.n_kg_ha == 140.0
    assert plan.requirements.p2o5_kg_ha == 110.0
    assert plan.requirements.k2o_kg_ha == 100.0
    # Verifica adubos comerciais
    assert any(p.fertilizer_name == "Superfosfato Simples" for p in plan.commercial_plan)
    assert any("Ureia" in p.fertilizer_name for p in plan.commercial_plan)
