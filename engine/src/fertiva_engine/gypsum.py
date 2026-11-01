"""
Fertiva - Motor Agronômico: Módulo de Gessagem
Aplicação estrita dos critérios de subsuperfície (20-40 cm), verificação e dosagem.
"""

from typing import List
from .models import SoilSampleInput, GypsumCalculationRequest, GypsumResult
from .soil_math import calculate_derived_indices


def calculate_gypsum(request: GypsumCalculationRequest) -> GypsumResult:
    """
    Avalia a necessidade de gessagem baseada exclusivamente em dados da camada subsuperficial (20-40 cm).
    Nunca recomenda gesso com base em análise exclusiva de 0-20 cm (atendendo ao item 6.6 da especificação).
    """
    met_criteria: List[str] = []
    unmet_criteria: List[str] = []
    limitations: List[str] = []

    # Verificação mandatória: análise de subsuperfície
    if not request.has_subsurface_sample or request.subsurface_sample is None:
        limitations.append(
            "Análise da camada subsuperficial (20 a 40 cm) NÃO informada. "
            "Pelas diretrizes agronômicas técnicas, o gesso agrícola NÃO deve ser recomendado com base apenas na análise superficial (0-20 cm). "
            "Colete e cadastre a amostragem de 20-40 cm para viabilizar este diagnóstico."
        )
        return GypsumResult(
            is_recommended=False,
            dose_ton_per_ha=0.0,
            total_ton=0.0,
            met_criteria=[],
            unmet_criteria=["Amostragem de 20-40 cm presente"],
            limitations=limitations,
            formula="NG (kg/ha) = 50 * Argila(%) [Anual] ou 60 * Argila(%) [Perene]",
            source_reference="Embrapa Cerrados / Sousa & Lobato (2004) / CFSEMG 5ª Aprox."
        )

    sub_sample = request.subsurface_sample
    sub_derived = calculate_derived_indices(sub_sample)

    ca_sub = sub_sample.ca_cmolc or 0.0
    al_sub = sub_sample.al_cmolc or 0.0
    m_sub = sub_derived.m_percent or 0.0

    # Critérios agronômicos de subsuperfície (Sousa & Lobato / CFSEMG)
    # 1. Cálcio baixo na subsuperfície (< 0.4 cmol_c/dm3)
    if ca_sub < 0.4:
        met_criteria.append(f"Cálcio trocável subsuperficial baixo: {ca_sub:.2f} cmol_c/dm³ (critério: < 0,40 cmol_c/dm³)")
    else:
        unmet_criteria.append(f"Cálcio trocável subsuperficial adequado: {ca_sub:.2f} cmol_c/dm³ (limite: >= 0,40 cmol_c/dm³)")

    # 2. Alumínio tóxico na subsuperfície (> 0.5 cmol_c/dm3)
    if al_sub > 0.5:
        met_criteria.append(f"Alumínio trocável subsuperficial elevado: {al_sub:.2f} cmol_c/dm³ (critério: > 0,50 cmol_c/dm³)")
    else:
        unmet_criteria.append(f"Alumínio trocável subsuperficial baixo ou moderado: {al_sub:.2f} cmol_c/dm³ (limite: <= 0,50 cmol_c/dm³)")

    # 3. Saturação por Alumínio (m%) na subsuperfície (> 20%)
    if m_sub > 20.0:
        met_criteria.append(f"Saturação por alumínio subsuperficial crítica: {m_sub:.1f}% (critério: > 20,0%)")
    else:
        unmet_criteria.append(f"Saturação por alumínio subsuperficial tolerável: {m_sub:.1f}% (limite: <= 20,0%)")

    is_recommended = len(met_criteria) > 0

    if not is_recommended:
        limitations.append("Nenhum critério limitante de subsuperfície foi atendido. As raízes têm ambiente favorável no perfil; gessagem não indicada.")
        return GypsumResult(
            is_recommended=False,
            dose_ton_per_ha=0.0,
            total_ton=0.0,
            met_criteria=met_criteria,
            unmet_criteria=unmet_criteria,
            limitations=limitations,
            formula="NG = Fator * Argila(%)",
            source_reference="Embrapa Cerrados (Sousa & Lobato, 2004)"
        )

    # Cálculo da dose pela argila
    clay = request.subsurface_clay_percent or sub_sample.clay_percent
    if clay is None:
        limitations.append("Aviso: Teor de argila da subsuperfície não informado. Utilizando valor padrão de referência textural média (30% de argila). Recomendável obter laudo granulométrico.")
        clay = 30.0

    # Fator: 50 para culturas anuais, 60 para culturas perenes (ex: café, cacau, eucalipto)
    factor = 60.0 if request.crop_type == "perene" else 50.0
    dose_kg_ha = factor * clay
    dose_ton_ha = round(dose_kg_ha / 1000.0, 2)
    total_ton = round(dose_ton_ha * request.plot_area_ha, 2)

    return GypsumResult(
        is_recommended=True,
        dose_ton_per_ha=dose_ton_ha,
        total_ton=total_ton,
        met_criteria=met_criteria,
        unmet_criteria=unmet_criteria,
        limitations=limitations,
        formula=f"NG (kg/ha) = {int(factor)} × Argila(%) [Cultura {request.crop_type}]",
        source_reference="Manual de Adubação e Calagem / Sousa & Lobato (Embrapa)"
    )
