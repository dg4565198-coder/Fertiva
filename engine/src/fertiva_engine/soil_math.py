"""
Fertiva - Fórmulas Matemáticas e Índices de Solo
Cálculos determinísticos de SB, CTC efetiva (t), CTC a pH 7 (T), V%, m% e relações catiônicas.
"""

from typing import Tuple, List
from .models import SoilSampleInput, DerivedSoilIndices


def calculate_derived_indices(sample: SoilSampleInput) -> DerivedSoilIndices:
    """
    Calcula os índices derivados do laudo de análise química do solo.
    Fórmulas consagradas na fertilidade do solo:
    - SB = Ca + Mg + K
    - t (CTC efetiva) = SB + Al
    - T (CTC a pH 7) = SB + (H+Al)
    - V% = (SB / T) * 100
    - m% = (Al / t) * 100
    """
    ca = sample.ca_cmolc or 0.0
    mg = sample.mg_cmolc or 0.0
    k = sample.k_cmolc or 0.0
    al = sample.al_cmolc or 0.0
    h_al = sample.h_al_cmolc

    # Soma de bases
    sb = round(ca + mg + k, 4)

    # CTC efetiva (t)
    ctc_effective = round(sb + al, 4)

    # CTC a pH 7 (T)
    ctc_ph7 = None
    v_percent = None
    warnings: List[str] = []

    if h_al is not None:
        ctc_ph7 = round(sb + h_al, 4)
        if ctc_ph7 > 0:
            v_percent = round((sb / ctc_ph7) * 100.0, 2)
        else:
            warnings.append("CTC a pH 7.0 calculada como zero; não é possível calcular V%.")
    else:
        warnings.append("Acidez potencial (H+Al) ausente no laudo; CTC a pH 7.0 e V% não puderam ser calculados.")

    # Saturação por alumínio (m%)
    m_percent = None
    if ctc_effective > 0:
        m_percent = round((al / ctc_effective) * 100.0, 2)
    elif al > 0:
        m_percent = 100.0
    else:
        m_percent = 0.0

    # Relações de equilíbrio catiônico
    ca_mg_ratio = round(ca / mg, 2) if mg > 0 else None
    ca_k_ratio = round(ca / k, 2) if k > 0 else None
    mg_k_ratio = round(mg / k, 2) if k > 0 else None

    # Validações de consistência agronômica
    if ctc_ph7 is not None and ctc_effective > ctc_ph7 + 0.1:
        warnings.append(f"Inconsistência detectada: CTC efetiva ({ctc_effective}) maior que CTC a pH 7 ({ctc_ph7}).")

    if sample.ph_h2o is not None and sample.ph_cacl2 is not None:
        delta_ph = sample.ph_h2o - sample.ph_cacl2
        if delta_ph < 0.2 or delta_ph > 1.2:
            warnings.append(f"Diferença atípica entre pH em água e pH em CaCl2 (ΔpH = {round(delta_ph, 2)}). Normalmente varia de 0.4 a 0.9.")

    return DerivedSoilIndices(
        sb=sb,
        ctc_effective=ctc_effective,
        ctc_ph7=ctc_ph7,
        v_percent=v_percent,
        m_percent=m_percent,
        ca_mg_ratio=ca_mg_ratio,
        ca_k_ratio=ca_k_ratio,
        mg_k_ratio=mg_k_ratio,
        is_consistent=len(warnings) == 0,
        consistency_warnings=warnings
    )
