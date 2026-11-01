"""
Fertiva - Motor Agronômico Determinístico
Modelos de dados, validação estrita e controle de qualidade agronômica.
Em conformidade com a Especificação Técnica Fertiva v1.0.
"""

from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, model_validator


class SoilSampleInput(BaseModel):
    """
    Entrada de dados laboratoriais de análise de solo.
    Validação de faixas plausíveis e unidades agronômicas padrão.
    """
    sample_id: Optional[str] = None
    plot_name: Optional[str] = None
    depth_start_cm: int = Field(default=0, ge=0, le=100)
    depth_end_cm: int = Field(default=20, ge=10, le=200)
    
    # pH
    ph_h2o: Optional[float] = Field(None, ge=3.0, le=10.0, description="pH em H2O")
    ph_cacl2: Optional[float] = Field(None, ge=3.0, le=9.5, description="pH em CaCl2")
    
    # Macronutrientes e Cátions Trocáveis
    # Unidade padrão: cmol_c/dm3 para cátions, mg/dm3 para fósforo e micronutrientes
    p_mehlich1: Optional[float] = Field(None, ge=0.0, le=1000.0, description="Fósforo Mehlich-1 em mg/dm3")
    p_resina: Optional[float] = Field(None, ge=0.0, le=1000.0, description="Fósforo Resina em mg/dm3")
    k_cmolc: Optional[float] = Field(None, ge=0.0, le=20.0, description="Potássio trocável em cmol_c/dm3")
    k_mg_dm3: Optional[float] = Field(None, ge=0.0, le=8000.0, description="Potássio em mg/dm3")
    ca_cmolc: Optional[float] = Field(None, ge=0.0, le=50.0, description="Cálcio trocável em cmol_c/dm3")
    mg_cmolc: Optional[float] = Field(None, ge=0.0, le=30.0, description="Magnésio trocável em cmol_c/dm3")
    al_cmolc: Optional[float] = Field(None, ge=0.0, le=20.0, description="Alumínio trocável (Acidez trocável) em cmol_c/dm3")
    h_al_cmolc: Optional[float] = Field(None, ge=0.0, le=50.0, description="Acidez potencial H+Al em cmol_c/dm3")
    
    # Matéria orgânica e Enxofre
    mo_g_kg: Optional[float] = Field(None, ge=0.0, le=200.0, description="Matéria Orgânica em g/kg")
    mo_percent: Optional[float] = Field(None, ge=0.0, le=20.0, description="Matéria Orgânica em %")
    s_mg_dm3: Optional[float] = Field(None, ge=0.0, le=200.0, description="Enxofre em mg/dm3")
    
    # Granulometria / Textura
    clay_percent: Optional[float] = Field(None, ge=0.0, le=100.0, description="Teor de argila em %")
    silt_percent: Optional[float] = Field(None, ge=0.0, le=100.0, description="Teor de silte em %")
    sand_percent: Optional[float] = Field(None, ge=0.0, le=100.0, description="Teor de areia em %")
    
    # Micronutrientes (mg/dm3)
    b_mg_dm3: Optional[float] = Field(None, ge=0.0, le=50.0, description="Boro em mg/dm3")
    cu_mg_dm3: Optional[float] = Field(None, ge=0.0, le=100.0, description="Cobre em mg/dm3")
    fe_mg_dm3: Optional[float] = Field(None, ge=0.0, le=500.0, description="Ferro em mg/dm3")
    mn_mg_dm3: Optional[float] = Field(None, ge=0.0, le=500.0, description="Manganês em mg/dm3")
    zn_mg_dm3: Optional[float] = Field(None, ge=0.0, le=100.0, description="Zinco em mg/dm3")

    @model_validator(mode="after")
    def unify_potassium(self) -> "SoilSampleInput":
        """Harmoniza K entre mg/dm3 e cmol_c/dm3 (1 cmol_c/dm3 = 391 mg/dm3)"""
        if self.k_cmolc is None and self.k_mg_dm3 is not None:
            self.k_cmolc = round(self.k_mg_dm3 / 391.0, 4)
        elif self.k_mg_dm3 is None and self.k_cmolc is not None:
            self.k_mg_dm3 = round(self.k_cmolc * 391.0, 2)
        return self


class DerivedSoilIndices(BaseModel):
    """
    Índices calculados pelo motor agronômico com rastreabilidade total.
    """
    sb: float = Field(..., description="Soma de Bases (Ca + Mg + K) em cmol_c/dm3")
    ctc_effective: float = Field(..., description="CTC Efetiva t = SB + Al em cmol_c/dm3")
    ctc_ph7: Optional[float] = Field(None, description="CTC a pH 7.0 T = SB + (H+Al) em cmol_c/dm3")
    v_percent: Optional[float] = Field(None, description="Saturação por Bases V% = (SB / T) * 100")
    m_percent: Optional[float] = Field(None, description="Saturação por Alumínio m% = (Al / t) * 100")
    ca_mg_ratio: Optional[float] = Field(None, description="Relação Ca/Mg")
    ca_k_ratio: Optional[float] = Field(None, description="Relação Ca/K")
    mg_k_ratio: Optional[float] = Field(None, description="Relação Mg/K")
    is_consistent: bool = True
    consistency_warnings: List[str] = Field(default_factory=list)


class AttributeInterpretation(BaseModel):
    attribute: str
    attribute_label: str
    original_value: float
    unit: str
    class_label: str  # 'Muito Baixo', 'Baixo', 'Médio', 'Bom', 'Muito Alto'
    reference_range: str
    agronomic_explanation: str
    source_name: str
    method_used: str


class LimingCalculationRequest(BaseModel):
    """
    Requisição de cálculo de calagem.
    """
    plot_area_ha: float = Field(..., gt=0.0, description="Área do talhão em hectares")
    target_v_percent: float = Field(..., ge=20.0, le=90.0, description="Saturação por bases desejada da cultura (V2%)")
    prnt_percent: float = Field(default=80.0, ge=40.0, le=150.0, description="PRNT do corretivo (%)")
    incorporation_depth_cm: int = Field(default=20, ge=10, le=40, description="Profundidade de incorporação (cm)")
    application_factor: float = Field(default=1.0, ge=0.5, le=2.0, description="Fator de área coberta ou aplicação")
    method: Literal["base_saturation", "aluminum_neutralization"] = "base_saturation"


class LimingResult(BaseModel):
    dose_ton_per_ha: float
    total_ton: float
    target_v_percent: float
    current_v_percent: float
    prnt_used: float
    method: str
    formula: str
    calculation_steps: List[str]
    source_reference: str
    is_blocked: bool = False
    block_reason: Optional[str] = None


class GypsumCalculationRequest(BaseModel):
    """
    Requisição de cálculo de gessagem com verificação rigorosa de subsuperfície.
    """
    plot_area_ha: float = Field(..., gt=0.0)
    has_subsurface_sample: bool = False
    subsurface_sample: Optional[SoilSampleInput] = None
    crop_type: Literal["anual", "perene"] = "anual"
    subsurface_clay_percent: Optional[float] = Field(None, ge=0.0, le=100.0)


class GypsumResult(BaseModel):
    is_recommended: bool
    dose_ton_per_ha: float
    total_ton: float
    met_criteria: List[str]
    unmet_criteria: List[str]
    limitations: List[str]
    formula: str
    source_reference: str
