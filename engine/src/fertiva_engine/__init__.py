"""
Fertiva Agronomic Engine - Pacote Principal
"""

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

__all__ = [
    "SoilSampleInput",
    "DerivedSoilIndices",
    "LimingCalculationRequest",
    "LimingResult",
    "GypsumCalculationRequest",
    "GypsumResult",
    "AttributeInterpretation",
    "calculate_derived_indices",
    "calculate_liming",
    "calculate_gypsum",
    "interpret_soil_sample",
    "calculate_crop_fertilization",
    "FertilizationPlanResult",
]
