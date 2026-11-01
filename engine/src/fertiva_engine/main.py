"""
Fertiva Agronomic Engine - Servidor FastAPI / API REST
Serviço independente para execução determinística de diagnósticos e recomendações agronômicas.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Literal

from .models import (
    SoilSampleInput,
    DerivedSoilIndices,
    LimingCalculationRequest,
    LimingResult,
    GypsumCalculationRequest,
    GypsumResult,
    AttributeInterpretation
)
from .soil_math import calculate_derived_indices
from .liming import calculate_liming
from .gypsum import calculate_gypsum
from .interpretation import interpret_soil_sample
from .fertilization import calculate_crop_fertilization, FertilizationPlanResult

app = FastAPI(
    title="Fertiva Agronomic Engine",
    description="Motor determinístico de cálculo de fertilidade do solo, calagem, gessagem e adubação.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "fertiva-agronomic-engine",
        "version": "1.0.0",
        "principles": "deterministic-only, no-ai-dosing, audit-ready"
    }


@app.post("/indices", response_model=DerivedSoilIndices)
def get_derived_indices(sample: SoilSampleInput):
    """Calcula SB, CTC efetiva, CTC a pH 7, V% e m% com checagem de consistência."""
    return calculate_derived_indices(sample)


@app.post("/interpretation", response_model=List[AttributeInterpretation])
def get_interpretation(sample: SoilSampleInput):
    """Enquadra os atributos nas classes agronômicas da 5ª Aproximação / Embrapa."""
    return interpret_soil_sample(sample)


@app.post("/liming", response_model=LimingResult)
def get_liming(sample: SoilSampleInput, request: LimingCalculationRequest):
    """Calcula a necessidade de calagem com memória de cálculo passo a passo."""
    return calculate_liming(sample, request)


@app.post("/gypsum", response_model=GypsumResult)
def get_gypsum(request: GypsumCalculationRequest):
    """Avalia necessidade de gessagem exclusivamente com dados de subsuperfície (20-40 cm)."""
    return calculate_gypsum(request)


@app.post("/fertilization", response_model=FertilizationPlanResult)
def get_fertilization(
    crop: Literal["milho", "cafe", "mandioca", "cacau", "pastagem", "eucalipto"],
    expected_yield_level: Literal["baixa", "media", "alta"],
    sample: SoilSampleInput,
    plot_area_ha: float
):
    """Gera recomendação de adubação e formulação de fertilizantes comerciais."""
    return calculate_crop_fertilization(crop, expected_yield_level, sample, plot_area_ha)
