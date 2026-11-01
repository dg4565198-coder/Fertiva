"""
Fertiva - Motor Agronômico: Módulo de Adubação e Conversão de Fertilizantes
Recomendações técnicas para culturas prioritárias (Milho, Café, Mandioca, Cacau, Pastagens, Eucalipto)
baseadas em publicações regionais validadas (CFSEMG 5ª Aproximação, Embrapa, CEPLAC/Bahia).
"""

from typing import Dict, List, Optional, Literal
from pydantic import BaseModel, Field
from .models import SoilSampleInput
from .soil_math import calculate_derived_indices


class FertilizationRequirement(BaseModel):
    n_kg_ha: float
    p2o5_kg_ha: float
    k2o_kg_ha: float
    planting_n_kg_ha: float
    planting_p2o5_kg_ha: float
    planting_k2o_kg_ha: float
    topdressing_n_kg_ha: float
    topdressing_k2o_kg_ha: float
    source_reference: str
    culture_name: str
    expected_yield: str
    notes: List[str] = Field(default_factory=list)


class CommercialFertilizerPlan(BaseModel):
    fertilizer_name: str
    guarantee: str
    dose_kg_ha: float
    total_dose_kg: float
    timing: Literal["plantio", "cobertura_1", "cobertura_2"]
    explanation: str


class FertilizationPlanResult(BaseModel):
    crop: str
    expected_yield: str
    plot_area_ha: float
    requirements: FertilizationRequirement
    commercial_plan: List[CommercialFertilizerPlan]
    calculation_memory: List[str]


def calculate_crop_fertilization(
    crop: Literal["milho", "cafe", "mandioca", "cacau", "pastagem", "eucalipto"],
    expected_yield_level: str,  # "baixa", "media", "alta"
    sample: SoilSampleInput,
    plot_area_ha: float
) -> FertilizationPlanResult:
    """
    Calcula determinística e rastreavelmente as necessidades de N, P2O5 e K2O para a cultura informada,
    e gera a formulação comercial correspondente.
    """
    p = sample.p_mehlich1 or 5.0
    k = sample.k_cmolc or 0.10
    clay = sample.clay_percent or 30.0

    memory: List[str] = []
    notes: List[str] = []
    
    # Classificação do teor de P disponível no solo
    p_status = "baixo" if p < 10.0 else ("medio" if p <= 20.0 else "bom")
    # Classificação do teor de K trocável
    k_status = "baixo" if k < 0.15 else ("medio" if k <= 0.30 else "bom")

    memory.append(f"1. Diagnóstico de Fósforo disponível (Mehlich-1): {p:.1f} mg/dm³ -> Status: {p_status.upper()}")
    memory.append(f"2. Diagnóstico de Potássio trocável: {k:.2f} cmol_c/dm³ -> Status: {k_status.upper()}")

    # Matrizes de recomendação por cultura baseadas na 5ª Aproximação CFSEMG / Embrapa
    if crop == "milho":
        # Grãos: Meta de produtividade Alta (> 8 t/ha), Média (5-8 t/ha), Baixa (< 5 t/ha)
        if expected_yield_level == "alta":
            n_total = 140.0
            p2o5_total = 110.0 if p_status == "baixo" else (80.0 if p_status == "medio" else 50.0)
            k2o_total = 100.0 if k_status == "baixo" else (70.0 if k_status == "medio" else 40.0)
            yield_desc = "Alta produtividade (> 8 t/ha)"
        elif expected_yield_level == "media":
            n_total = 90.0
            p2o5_total = 90.0 if p_status == "baixo" else (60.0 if p_status == "medio" else 40.0)
            k2o_total = 80.0 if k_status == "baixo" else (50.0 if k_status == "medio" else 30.0)
            yield_desc = "Média produtividade (5 a 8 t/ha)"
        else:
            n_total = 50.0
            p2o5_total = 70.0 if p_status == "baixo" else (40.0 if p_status == "medio" else 20.0)
            k2o_total = 60.0 if k_status == "baixo" else (40.0 if k_status == "medio" else 20.0)
            yield_desc = "Baixa produtividade (< 5 t/ha)"

        # Parcelamento clássico de milho: 20-30 kg/ha N no plantio, restante em cobertura (V4 a V6)
        n_plantio = 25.0
        n_cobertura = n_total - n_plantio
        p2o5_plantio = p2o5_total
        p2o5_cobertura = 0.0
        k2o_plantio = min(40.0, k2o_total)
        k2o_cobertura = k2o_total - k2o_plantio
        ref = "CFSEMG 5ª Aproximação (Milho para Grãos)"
        notes.append("Aplicar N e K em cobertura quando o milho estiver no estádio V4 a V6 (4 a 6 folhas completamente expandidas).")

    elif crop == "cafe":
        # Café Arábica/Conilon em produção (sacas/ha)
        yield_desc = f"Produção esperada: nível {expected_yield_level.upper()}"
        if expected_yield_level == "alta":
            n_total, p2o5_total, k2o_total = 280.0, 70.0, 260.0
        elif expected_yield_level == "media":
            n_total, p2o5_total, k2o_total = 180.0, 50.0, 180.0
        else:
            n_total, p2o5_total, k2o_total = 100.0, 30.0, 100.0
        
        n_plantio = 0.0
        p2o5_plantio = p2o5_total
        n_cobertura = n_total
        k2o_plantio = 0.0
        k2o_cobertura = k2o_total
        ref = "Incaper / CFSEMG 5ª Aprox. (Café em Produção)"
        notes.append("Para cafeeiros em produção, parcelar o Nitrogênio e o Potássio em 3 a 4 aplicações no período chuvoso (outubro a março).")

    elif crop == "cacau":
        # Cacauicultura no Sul da Bahia (CEPLAC)
        yield_desc = f"Cacau em produção: nível {expected_yield_level.upper()}"
        n_total = 80.0 if expected_yield_level == "alta" else 50.0
        p2o5_total = 60.0 if p_status == "baixo" else 30.0
        k2o_total = 90.0 if k_status == "baixo" else 40.0
        n_plantio, p2o5_plantio, k2o_plantio = 0.0, p2o5_total, 0.0
        n_cobertura, k2o_cobertura = n_total, k2o_total
        ref = "CEPLAC / Boletim Técnico Cacau Bahia"
        notes.append("Distribuir em faixa sob a projeção da copa das árvores após a desfolha ou início da brotação.")

    elif crop == "mandioca":
        yield_desc = f"Mandioca de mesa/indústria: nível {expected_yield_level.upper()}"
        n_total = 40.0
        p2o5_total = 60.0 if p_status == "baixo" else 30.0
        k2o_total = 60.0 if k_status == "baixo" else 30.0
        n_plantio, p2o5_plantio, k2o_plantio = 10.0, p2o5_total, 20.0
        n_cobertura = n_total - n_plantio
        k2o_cobertura = k2o_total - k2o_plantio
        ref = "Embrapa Mandioca e Fruticultura (Cruz das Almas - BA)"
        notes.append("Aplicar a cobertura de N e K aos 60 dias após a brotação das manivas em solo úmido.")

    elif crop == "pastagem":
        yield_desc = f"Formação/Recuperação de Pastagens: nível {expected_yield_level.upper()}"
        n_total = 50.0
        p2o5_total = 70.0 if p_status == "baixo" else (40.0 if p_status == "medio" else 20.0)
        k2o_total = 50.0 if k_status == "baixo" else 20.0
        n_plantio, p2o5_plantio, k2o_plantio = 0.0, p2o5_total, 0.0
        n_cobertura, k2o_cobertura = n_total, k2o_total
        ref = "Embrapa Gado de Corte / CFSEMG 5ª Aprox."
        notes.append("Aplicar fósforo incorporado ou no sulco de plantio. Nitrogênio e Potássio em cobertura após o estabelecimento do capim.")

    else:  # eucalipto
        yield_desc = f"Eucalipto implantação/manutenção: nível {expected_yield_level.upper()}"
        n_total = 40.0
        p2o5_total = 80.0 if p_status == "baixo" else 40.0
        k2o_total = 60.0 if k_status == "baixo" else 30.0
        n_plantio, p2o5_plantio, k2o_plantio = 15.0, p2o5_total, 20.0
        n_cobertura, k2o_cobertura = n_total - n_plantio, k2o_total - k2o_plantio
        ref = "Recomendações de Adubação para Eucalipto (SBS / CFSEMG)"
        notes.append("Adubação fosfatada localizada no sulco ou covas; N e K parcelados em adubação de arranque e manutenção.")

    req = FertilizationRequirement(
        n_kg_ha=n_total,
        p2o5_kg_ha=p2o5_total,
        k2o_kg_ha=k2o_total,
        planting_n_kg_ha=n_plantio,
        planting_p2o5_kg_ha=p2o5_plantio,
        planting_k2o_kg_ha=k2o_plantio,
        topdressing_n_kg_ha=n_cobertura,
        topdressing_k2o_kg_ha=k2o_cobertura,
        source_reference=ref,
        culture_name=crop.capitalize(),
        expected_yield=yield_desc,
        notes=notes
    )

    # Conversão para adubos comerciais padronizados
    commercial_plan: List[CommercialFertilizerPlan] = []
    
    # Adubação de Plantio (Ex: Superfosfato Simples para P e Ureia / Cloreto se houver)
    if p2o5_plantio > 0:
        # Superfosfato Simples (18% P2O5 + 10% S + 18% Ca)
        dose_sfs = round(p2o5_plantio / 0.18, 1)
        commercial_plan.append(CommercialFertilizerPlan(
            fertilizer_name="Superfosfato Simples",
            guarantee="18% P2O5, 10% S, 18% Ca",
            dose_kg_ha=dose_sfs,
            total_dose_kg=round(dose_sfs * plot_area_ha, 1),
            timing="plantio",
            explanation=f"Fornece os {p2o5_plantio:.1f} kg/ha de P₂O₅ necessários no sulco de plantio, além de enxofre e cálcio."
        ))

    if n_plantio > 0:
        # Ureia no plantio (45% N)
        dose_ureia_p = round(n_plantio / 0.45, 1)
        commercial_plan.append(CommercialFertilizerPlan(
            fertilizer_name="Ureia Agrícola",
            guarantee="45% N",
            dose_kg_ha=dose_ureia_p,
            total_dose_kg=round(dose_ureia_p * plot_area_ha, 1),
            timing="plantio",
            explanation=f"Adubação de arranque nitrogenada: {n_plantio:.1f} kg/ha de N no plantio."
        ))

    # Adubação de Cobertura (Ureia 45% N e Cloreto de Potássio 60% K2O)
    if n_cobertura > 0:
        dose_ureia_cob = round(n_cobertura / 0.45, 1)
        commercial_plan.append(CommercialFertilizerPlan(
            fertilizer_name="Ureia Agrícola (Cobertura)",
            guarantee="45% N",
            dose_kg_ha=dose_ureia_cob,
            total_dose_kg=round(dose_ureia_cob * plot_area_ha, 1),
            timing="cobertura_1",
            explanation=f"Fornece {n_cobertura:.1f} kg/ha de N em cobertura para rápido desenvolvimento vegetativo."
        ))

    if k2o_cobertura > 0 or k2o_total > 0:
        k_target = k2o_cobertura if k2o_cobertura > 0 else k2o_total
        dose_kcl = round(k_target / 0.60, 1)
        commercial_plan.append(CommercialFertilizerPlan(
            fertilizer_name="Cloreto de Potássio (KCl)",
            guarantee="60% K2O",
            dose_kg_ha=dose_kcl,
            total_dose_kg=round(dose_kcl * plot_area_ha, 1),
            timing="cobertura_1" if k2o_cobertura > 0 else "plantio",
            explanation=f"Fornece {k_target:.1f} kg/ha de K₂O."
        ))

    memory.append(f"3. Necessidade Total Nutrientes: N={n_total:.1f} kg/ha | P₂O₅={p2o5_total:.1f} kg/ha | K₂O={k2o_total:.1f} kg/ha")
    memory.append(f"4. Conversão comercial calculada para a área total de {plot_area_ha:.2f} ha.")

    return FertilizationPlanResult(
        crop=crop.capitalize(),
        expected_yield=yield_desc,
        plot_area_ha=plot_area_ha,
        requirements=req,
        commercial_plan=commercial_plan,
        calculation_memory=memory
    )
