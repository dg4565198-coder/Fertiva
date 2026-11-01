"""
Fertiva - Motor Agronômico: Interpretação Química do Solo
Classificação determinística por classes de fertilidade (Muito Baixo, Baixo, Médio, Bom/Adequado, Muito Alto)
com base em referências bibliográficas estabelecidas.
"""

from typing import List, Optional
from .models import SoilSampleInput, AttributeInterpretation, DerivedSoilIndices
from .soil_math import calculate_derived_indices


def interpret_soil_sample(sample: SoilSampleInput) -> List[AttributeInterpretation]:
    """
    Interpreta os atributos químicos da análise superficial de solo segundo a 5ª Aproximação CFSEMG / Embrapa.
    """
    derived = calculate_derived_indices(sample)
    results: List[AttributeInterpretation] = []

    # 1. pH em H2O (Acidez ativa)
    if sample.ph_h2o is not None:
        ph = sample.ph_h2o
        if ph < 4.5:
            cls_lbl = "Muito Baixo (Muito Ácido)"
            ref = "< 4,5"
            expl = "Acidez muito elevada com risco severo de toxidez por alumínio e indisponibilidade de fósforo."
        elif ph <= 5.0:
            cls_lbl = "Baixo (Ácido)"
            ref = "4,5 a 5,0"
            expl = "Acidez elevada; a maioria das culturas anuais e exigentes tem produtividade comprometida."
        elif ph <= 6.0:
            cls_lbl = "Médio (Moderadamente Ácido)"
            ref = "5,1 a 6,0"
            expl = "Faixa adequada para diversas culturas tropicais e pastagens tolerantes à acidez moderada."
        elif ph <= 6.8:
            cls_lbl = "Bom (Adequado)"
            ref = "6,1 a 6,8"
            expl = "Faixa ideal para disponibilidade máxima da maioria dos macronutrientes (P, Ca, Mg, N, K, S)."
        else:
            cls_lbl = "Alto (Alcalino)"
            ref = "> 6,8"
            expl = "Solo alcalino ou supercalagem. Risco de fixação/deficiência de micronutrientes catiônicos (Zn, Mn, Fe, Cu)."

        results.append(AttributeInterpretation(
            attribute="ph_h2o",
            attribute_label="pH em Água",
            original_value=ph,
            unit="adimensional",
            class_label=cls_lbl,
            reference_range=ref,
            agronomic_explanation=expl,
            source_name="CFSEMG 5ª Aproximação / Embrapa Solos",
            method_used="Relação Solo:Água 1:2,5"
        ))

    # 2. Fósforo Mehlich-1 (mg/dm3) - Considerando argila se disponível
    if sample.p_mehlich1 is not None:
        p = sample.p_mehlich1
        clay = sample.clay_percent or 30.0  # assume classe média (15-35%) se ausente
        
        # Faixas de P variam com teor de argila (tabela CFSEMG para classe 2: 36-60% argila ou classe 3: 16-35%)
        if clay > 35:
            # Solo argiloso
            if p <= 4.0:
                cls_lbl = "Muito Baixo"
            elif p <= 8.0:
                cls_lbl = "Baixo"
            elif p <= 15.0:
                cls_lbl = "Médio"
            elif p <= 25.0:
                cls_lbl = "Bom"
            else:
                cls_lbl = "Muito Alto"
            ref = "Bom: 15,1 a 25,0 (Argiloso)"
        else:
            # Solo textura média
            if p <= 6.0:
                cls_lbl = "Muito Baixo"
            elif p <= 12.0:
                cls_lbl = "Baixo"
            elif p <= 20.0:
                cls_lbl = "Médio"
            elif p <= 30.0:
                cls_lbl = "Bom"
            else:
                cls_lbl = "Muito Alto"
            ref = "Bom: 20,1 a 30,0 (Média)"

        results.append(AttributeInterpretation(
            attribute="p_mehlich1",
            attribute_label="Fósforo (P)",
            original_value=p,
            unit="mg/dm³",
            class_label=cls_lbl,
            reference_range=ref,
            agronomic_explanation="Nutriente essencial para formação do sistema radicular e florescimento. Solos tropicais possuem alta capacidade de fixação de fósforo.",
            source_name="CFSEMG 5ª Aproximação",
            method_used="Extrator Mehlich-1"
        ))

    # 3. Potássio (cmol_c/dm3)
    if sample.k_cmolc is not None:
        k = sample.k_cmolc
        if k <= 0.08:
            cls_lbl = "Muito Baixo"
        elif k <= 0.15:
            cls_lbl = "Baixo"
        elif k <= 0.25:
            cls_lbl = "Médio"
        elif k <= 0.40:
            cls_lbl = "Bom"
        else:
            cls_lbl = "Muito Alto"

        results.append(AttributeInterpretation(
            attribute="k_cmolc",
            attribute_label="Potássio Trocável (K)",
            original_value=k,
            unit="cmol_c/dm³",
            class_label=cls_lbl,
            reference_range="Bom: 0,26 a 0,40",
            agronomic_explanation="Atua na regulação osmótica, enchimento de grãos/frutos e resistência à seca e pragas.",
            source_name="CFSEMG 5ª Aproximação",
            method_used="Extrator Mehlich-1"
        ))

    # 4. Cálcio (cmol_c/dm3)
    if sample.ca_cmolc is not None:
        ca = sample.ca_cmolc
        if ca <= 1.2:
            cls_lbl = "Muito Baixo"
        elif ca <= 2.4:
            cls_lbl = "Baixo"
        elif ca <= 4.0:
            cls_lbl = "Médio"
        elif ca <= 7.0:
            cls_lbl = "Bom"
        else:
            cls_lbl = "Muito Alto"

        results.append(AttributeInterpretation(
            attribute="ca_cmolc",
            attribute_label="Cálcio Trocável (Ca)",
            original_value=ca,
            unit="cmol_c/dm³",
            class_label=cls_lbl,
            reference_range="Bom: 4,01 a 7,00",
            agronomic_explanation="Nutriente estrutural das paredes celulares e crucial para crescimento radicular apical.",
            source_name="CFSEMG 5ª Aproximação",
            method_used="Extrator KCl 1 mol/L"
        ))

    # 5. Magnésio (cmol_c/dm3)
    if sample.mg_cmolc is not None:
        mg = sample.mg_cmolc
        if mg <= 0.4:
            cls_lbl = "Muito Baixo"
        elif mg <= 0.8:
            cls_lbl = "Baixo"
        elif mg <= 1.5:
            cls_lbl = "Médio"
        elif mg <= 2.5:
            cls_lbl = "Bom"
        else:
            cls_lbl = "Muito Alto"

        results.append(AttributeInterpretation(
            attribute="mg_cmolc",
            attribute_label="Magnésio Trocável (Mg)",
            original_value=mg,
            unit="cmol_c/dm³",
            class_label=cls_lbl,
            reference_range="Bom: 1,51 a 2,50",
            agronomic_explanation="Átomo central da molécula de clorofila, essencial para o processo fotossintético.",
            source_name="CFSEMG 5ª Aproximação",
            method_used="Extrator KCl 1 mol/L"
        ))

    # 6. Saturação por Bases (V%)
    if derived.v_percent is not None:
        v = derived.v_percent
        if v <= 20.0:
            cls_lbl = "Muito Baixo"
        elif v <= 40.0:
            cls_lbl = "Baixo"
        elif v <= 60.0:
            cls_lbl = "Médio"
        elif v <= 80.0:
            cls_lbl = "Bom"
        else:
            cls_lbl = "Muito Alto"

        results.append(AttributeInterpretation(
            attribute="v_percent",
            attribute_label="Saturação por Bases (V%)",
            original_value=v,
            unit="%",
            class_label=cls_lbl,
            reference_range="Bom: 60,1 a 80,0%",
            agronomic_explanation="Percentual da capacidade de troca de cátions ocupada por bases nutricionais (Ca, Mg, K). Guia primordial para a recomendação de calagem.",
            source_name="CFSEMG / Boletim 100 IAC",
            method_used="Cálculo: (SB / T) × 100"
        ))

    # 7. Saturação por Alumínio (m%)
    if derived.m_percent is not None:
        m = derived.m_percent
        if m == 0.0:
            cls_lbl = "Nulo (Sem Alumínio)"
            ref = "0%"
        elif m <= 15.0:
            cls_lbl = "Baixo"
            ref = "<= 15%"
        elif m <= 30.0:
            cls_lbl = "Médio"
            ref = "15,1 a 30%"
        elif m <= 50.0:
            cls_lbl = "Alto (Tóxico)"
            ref = "30,1 a 50%"
        else:
            cls_lbl = "Muito Alto (Crítico)"
            ref = "> 50%"

        results.append(AttributeInterpretation(
            attribute="m_percent",
            attribute_label="Saturação por Alumínio (m%)",
            original_value=m,
            unit="%",
            class_label=cls_lbl,
            reference_range="Tolerável: <= 15%",
            agronomic_explanation="Índice de toxicidade radicular provocada pelo alumínio trocável livre na solução do solo.",
            source_name="CFSEMG 5ª Aproximação",
            method_used="Cálculo: (Al / t) × 100"
        ))

    return results
