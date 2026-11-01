"""
Fertiva - Motor Agronômico: Módulo de Calagem
Cálculo de Necessidade de Calagem (NC) com rastreabilidade e memória de cálculo.
"""

from typing import Tuple, List, Optional
from .models import SoilSampleInput, DerivedSoilIndices, LimingCalculationRequest, LimingResult
from .soil_math import calculate_derived_indices


def calculate_liming(sample: SoilSampleInput, request: LimingCalculationRequest) -> LimingResult:
    """
    Calcula a necessidade de calagem (NC) de forma determinística e emite a memória de cálculo.
    """
    derived = calculate_derived_indices(sample)

    # Verificação de pré-requisitos agronômicos
    if derived.ctc_ph7 is None or derived.v_percent is None:
        return LimingResult(
            dose_ton_per_ha=0.0,
            total_ton=0.0,
            target_v_percent=request.target_v_percent,
            current_v_percent=0.0,
            prnt_used=request.prnt_percent,
            method="Saturação por Bases",
            formula="NC = [CTC * (V2 - V1)] / (100 * (PRNT/100))",
            calculation_steps=["Bloqueio agronômico: Laudo sem teor de Acidez Potencial (H+Al). Não é possível calcular CTC a pH 7.0 nem V1%."],
            source_reference="CFSEMG / Boletim Técnico IAC / Embrapa",
            is_blocked=True,
            block_reason="Dados insuficientes no laudo laboratorial: H+Al ausente."
        )

    t = derived.ctc_ph7
    v1 = derived.v_percent
    v2 = request.target_v_percent
    prnt = request.prnt_percent
    depth = request.incorporation_depth_cm
    f_incorp = request.application_factor

    steps: List[str] = []
    steps.append(f"1. CTC a pH 7,0 (T): {t:.2f} cmol_c/dm³ [Fórmula: SB + (H+Al) = {derived.sb:.2f} + {sample.h_al_cmolc:.2f}]")
    steps.append(f"2. Saturação por Bases Atual (V1): {v1:.1f}% [Fórmula: (SB / T) * 100 = ({derived.sb:.2f} / {t:.2f}) * 100]")
    steps.append(f"3. Saturação por Bases Alvo (V2): {v2:.1f}% (específica da cultura)")
    steps.append(f"4. PRNT do Calcário informado: {prnt:.1f}%")
    steps.append(f"5. Profundidade de incorporação: {depth} cm (Fator profundidade: {depth}/20 = {depth/20:.2f})")

    if v1 >= v2:
        steps.append(f"6. Conclusão: A saturação por bases atual ({v1:.1f}%) é maior ou igual à recomendada ({v2:.1f}%). Não há necessidade de calagem.")
        return LimingResult(
            dose_ton_per_ha=0.0,
            total_ton=0.0,
            target_v_percent=v2,
            current_v_percent=v1,
            prnt_used=prnt,
            method="Saturação por Bases (V%)",
            formula="NC (t/ha) = [T * (V2 - V1) / 100] * (100 / PRNT) * (prof / 20) * f",
            calculation_steps=steps,
            source_reference="Manual de Calagem e Adubação (Bahia / 5ª Aproximação CFSEMG)",
            is_blocked=False,
            block_reason=None
        )

    # Fórmula: NC (t/ha) = [T * (V2 - V1) / 100] * (100 / PRNT) * (prof / 20) * f
    delta_v = v2 - v1
    base_nc = (t * delta_v) / 100.0
    nc_adjusted = base_nc * (100.0 / prnt) * (depth / 20.0) * f_incorp
    nc_final = round(max(0.0, nc_adjusted), 2)
    total_ton = round(nc_final * request.plot_area_ha, 2)

    steps.append(f"6. Diferença de Saturação (ΔV = V2 - V1): {v2:.1f}% - {v1:.1f}% = {delta_v:.1f}%")
    steps.append(f"7. Necessidade Base de Calcário (PRNT 100% a 20 cm): [{t:.2f} * {delta_v:.1f}] / 100 = {base_nc:.2f} t/ha")
    steps.append(f"8. Ajuste para PRNT ({prnt}%), Profundidade ({depth} cm) e Fator ({f_incorp}): {base_nc:.2f} * (100 / {prnt}) * ({depth} / 20) * {f_incorp} = {nc_final:.2f} t/ha")
    steps.append(f"9. Quantidade Total para o talhão ({request.plot_area_ha} ha): {nc_final:.2f} t/ha * {request.plot_area_ha} ha = {total_ton:.2f} toneladas de calcário")

    formula_str = "NC (t/ha) = [T × (V₂ - V₁) / 100] × (100 / PRNT) × (prof / 20) × f"

    return LimingResult(
        dose_ton_per_ha=nc_final,
        total_ton=total_ton,
        target_v_percent=v2,
        current_v_percent=v1,
        prnt_used=prnt,
        method="Saturação por Bases (V%)",
        formula=formula_str,
        calculation_steps=steps,
        source_reference="Manual de Calagem e Adubação (5ª Aproximação CFSEMG / Embrapa)",
        is_blocked=False,
        block_reason=None
    )
