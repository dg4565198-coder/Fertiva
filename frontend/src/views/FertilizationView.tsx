import React, { useState, useMemo } from 'react';
import { SoilSample, Plot, TechnicalReference } from '../types';
import { getAllActiveCrops, getCropAgronomicRule } from '../lib/agronomicEngine';
import { OFFICIAL_FERTILIZERS, OfficialFertilizer } from '../data/fertilizerCatalog';
import {
  Wheat,
  TrendingUp,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  Calendar,
  PackageCheck,
  ArrowRight,
  Sprout,
  BookOpen,
  Search,
  Filter,
  Sparkles,
  Sliders,
  Scale,
  Boxes,
  ExternalLink,
  X,
  FileText,
  Ruler,
  Trees,
  Calculator,
  Gauge
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface FertilizationViewProps {
  sample: SoilSample | null;
  plot: Plot | null;
  references?: TechnicalReference[];
  onNavigate: (tab: NavTab) => void;
}

// Configurações agronômicas de espaçamento e população típica por cultura
export interface CropSpacingConfig {
  rowSpacing: number; // metros entre linhas / entrelinhas
  plantSpacing: number; // metros entre plantas na linha
  defaultMode: 'hectare' | 'linear' | 'planta';
  description: string;
}

export const CROP_SPACING_CONFIGS: Record<string, CropSpacingConfig> = {
  'Soja': {
    rowSpacing: 0.45,
    plantSpacing: 0.08,
    defaultMode: 'linear',
    description: 'Semeadura mecanizada padrão (0,45m a 0,50m entre linhas).'
  },
  'Milho': {
    rowSpacing: 0.50,
    plantSpacing: 0.28,
    defaultMode: 'linear',
    description: 'População de ~68.000 a 72.000 plantas/ha no espaçamento de 0,50m.'
  },
  'Café': {
    rowSpacing: 3.00,
    plantSpacing: 1.00,
    defaultMode: 'planta',
    description: 'Plantio adensado com ~3.333 plantas/ha para colheita semi-mecanizada.'
  },
  'Café Conilon': {
    rowSpacing: 3.00,
    plantSpacing: 1.00,
    defaultMode: 'planta',
    description: 'Plantio adensado com ~3.333 plantas/ha para manejo semi-mecanizado.'
  },
  'Cacau': {
    rowSpacing: 3.00,
    plantSpacing: 3.00,
    defaultMode: 'planta',
    description: 'Espaçamento tradicional 3x3m (~1.111 plantas/ha) em cabruca ou sol pleno.'
  },
  'Feijão': {
    rowSpacing: 0.45,
    plantSpacing: 0.10,
    defaultMode: 'linear',
    description: 'Semeadura em linhas de 0,45m (~220.000 plantas/ha).'
  },
  'Mandioca': {
    rowSpacing: 1.00,
    plantSpacing: 0.80,
    defaultMode: 'planta',
    description: 'Fileira simples 1,0m x 0,8m (~12.500 covas/ha).'
  },
  'Banana': {
    rowSpacing: 3.00,
    plantSpacing: 2.00,
    defaultMode: 'planta',
    description: 'Espaçamento padrão 3x2m (~1.667 touceiras/ha).'
  },
  'Cana-de-Açúcar': {
    rowSpacing: 1.40,
    plantSpacing: 0.25,
    defaultMode: 'linear',
    description: 'Plantio mecanizado em sulcos simples de 1,40m a 1,50m.'
  },
  'Algodão': {
    rowSpacing: 0.76,
    plantSpacing: 0.12,
    defaultMode: 'linear',
    description: 'Espaçamento estreito de 0,76m a 0,90m no Cerrado.'
  },
  'Citros': {
    rowSpacing: 6.00,
    plantSpacing: 4.00,
    defaultMode: 'planta',
    description: 'Pomar comercial (~416 plantas/ha).'
  },
  'Eucalipto': {
    rowSpacing: 3.00,
    plantSpacing: 2.00,
    defaultMode: 'planta',
    description: 'Plantio florestal 3x2m (~1.666 árvores/ha).'
  },
  'Pastagem': {
    rowSpacing: 0.40,
    plantSpacing: 0.10,
    defaultMode: 'hectare',
    description: 'Formação ou recuperação de pasto por hectare.'
  },
  'Pimenta-do-Reino': {
    rowSpacing: 2.50,
    plantSpacing: 2.00,
    defaultMode: 'planta',
    description: 'Cultivo em tutores (~2.000 plantas/ha).'
  },
  'Seringueira': {
    rowSpacing: 7.00,
    plantSpacing: 3.00,
    defaultMode: 'planta',
    description: 'Seringal de cultivo (~476 plantas/ha).'
  },
  'Frutíferas Tropicais': {
    rowSpacing: 4.00,
    plantSpacing: 3.00,
    defaultMode: 'planta',
    description: 'Pomar de fruticultura diversificada.'
  },
  'Tomate': {
    rowSpacing: 1.00,
    plantSpacing: 0.50,
    defaultMode: 'planta',
    description: 'Horticultura tutorada (~20.000 plantas/ha).'
  }
};

// Metas reais de produtividade por cultura
const CROP_YIELD_TARGETS: Record<string, { label: string; key: string; multiplier: number }[]> = {
  'Soja': [
    { label: '50 sc/ha (Média / Sequeiro)', key: '50_sc', multiplier: 0.85 },
    { label: '65 sc/ha (Bom Manejo Regional)', key: '65_sc', multiplier: 1.0 },
    { label: '80 sc/ha (Alta Tecnologia)', key: '80_sc', multiplier: 1.25 },
    { label: '95+ sc/ha (Pivô / Campeã CESB)', key: '95_sc', multiplier: 1.45 }
  ],
  'Milho': [
    { label: '90 sc/ha (Safrinha)', key: '90_sc', multiplier: 0.8 },
    { label: '130 sc/ha (Safra Verão / Bom Manejo)', key: '130_sc', multiplier: 1.0 },
    { label: '170 sc/ha (Alta Produtividade)', key: '170_sc', multiplier: 1.3 },
    { label: '210+ sc/ha (Irrigado Alta Densidade)', key: '210_sc', multiplier: 1.55 }
  ],
  'Café': [
    { label: '40 sc beneficiadas/ha', key: '40_sc', multiplier: 0.8 },
    { label: '70 sc beneficiadas/ha (Padrão Regional)', key: '70_sc', multiplier: 1.0 },
    { label: '110+ sc beneficiadas/ha (Irrigado Alta Carga)', key: '110_sc', multiplier: 1.4 }
  ],
  'Café Conilon': [
    { label: '40 sc beneficiadas/ha', key: '40_sc', multiplier: 0.8 },
    { label: '70 sc beneficiadas/ha (Padrão Extremo Sul BA)', key: '70_sc', multiplier: 1.0 },
    { label: '110+ sc beneficiadas/ha (Gotejo / Alta Carga)', key: '110_sc', multiplier: 1.4 }
  ],
  'Cacau': [
    { label: '45 @/ha (Cabruca Tradicional)', key: '45_at', multiplier: 0.8 },
    { label: '90 @/ha (Clonado / Manejo Técnico)', key: '90_at', multiplier: 1.15 },
    { label: '140+ @/ha (Pleno Sol / Alta Produtividade)', key: '140_at', multiplier: 1.5 }
  ],
  'Feijão': [
    { label: '30 sc/ha (Sequeiro)', key: '30_sc', multiplier: 0.85 },
    { label: '45 sc/ha (Safra das Águas)', key: '45_sc', multiplier: 1.0 },
    { label: '60+ sc/ha (Terceira Safra Irrigada)', key: '60_sc', multiplier: 1.3 }
  ],
  'Mandioca': [
    { label: '20 t raízes/ha (Subsistência / Mesa)', key: '20_ton', multiplier: 0.85 },
    { label: '35 t raízes/ha (Farinha Comercial)', key: '35_ton', multiplier: 1.0 },
    { label: '50+ t raízes/ha (Amido / Alta Tecnologia)', key: '50_ton', multiplier: 1.35 }
  ],
  'Banana': [
    { label: '25 t/ha (Média Regional)', key: '25_ton', multiplier: 0.85 },
    { label: '40 t/ha (Climatizada / Comercial)', key: '40_ton', multiplier: 1.1 },
    { label: '60+ t/ha (Irrigada Alta Densidade)', key: '60_ton', multiplier: 1.4 }
  ],
  'Cana-de-Açúcar': [
    { label: '80 t colmos/ha', key: '80_ton', multiplier: 0.85 },
    { label: '110 t colmos/ha (Cana Planta/Socas)', key: '110_ton', multiplier: 1.1 },
    { label: '145+ t colmos/ha (Manejo Máximo)', key: '145_ton', multiplier: 1.4 }
  ],
  'Algodão': [
    { label: '220 @/ha', key: '220_at', multiplier: 0.85 },
    { label: '300 @/ha (Cerrado Alta Tecnologia)', key: '300_at', multiplier: 1.15 },
    { label: '380+ @/ha (Irrigado)', key: '380_at', multiplier: 1.45 }
  ],
  'Citros': [
    { label: '25 t/ha (Média Regional)', key: '25_ton', multiplier: 0.85 },
    { label: '40 t/ha (Boa Gestão Pomar)', key: '40_ton', multiplier: 1.1 },
    { label: '60+ t/ha (Alta Tecnologia / Irrigado)', key: '60_ton', multiplier: 1.4 }
  ],
  'Eucalipto': [
    { label: '35 m³/ha/ano (Média Nacional)', key: '35_m3', multiplier: 0.9 },
    { label: '45 m³/ha/ano (Boa Silvicultura)', key: '45_m3', multiplier: 1.1 },
    { label: '55+ m³/ha/ano (Clone Alta Produtividade)', key: '55_m3', multiplier: 1.35 }
  ],
  'Pastagem': [
    { label: '1.2 UA/ha (Média Extensiva)', key: '1_2_ua', multiplier: 0.85 },
    { label: '2.5 UA/ha (Manejo Rotacionado)', key: '2_5_ua', multiplier: 1.1 },
    { label: '4.0+ UA/ha (Adubada Intensiva)', key: '4_0_ua', multiplier: 1.4 }
  ],
  'Pimenta-do-Reino': [
    { label: '3.0 t pimenta seca/ha', key: '3_ton', multiplier: 0.85 },
    { label: '5.0 t pimenta seca/ha (Padrão)', key: '5_ton', multiplier: 1.1 },
    { label: '7.5+ t pimenta seca/ha (Irrigada)', key: '7_5_ton', multiplier: 1.4 }
  ],
  'Seringueira': [
    { label: '1.2 t borracha seca/ha', key: '1_2_ton', multiplier: 0.9 },
    { label: '1.8 t borracha seca/ha', key: '1_8_ton', multiplier: 1.1 },
    { label: '2.5+ t borracha seca/ha', key: '2_5_ton', multiplier: 1.35 }
  ],
  'Frutíferas Tropicais': [
    { label: 'Produtividade Média Regional', key: 'med', multiplier: 1.0 },
    { label: 'Alta Produtividade (+25% NPK)', key: 'alta', multiplier: 1.25 },
    { label: 'Baixa Produtividade (-30% NPK)', key: 'baixa', multiplier: 0.7 }
  ],
  'Tomate': [
    { label: '60 t/ha (Média)', key: '60_ton', multiplier: 0.85 },
    { label: '90 t/ha (Comercial Tutorado)', key: '90_ton', multiplier: 1.1 },
    { label: '120+ t/ha (Alta Tecnologia)', key: '120_ton', multiplier: 1.4 }
  ]
};

// Funções seguras de resolução de configuração agronômica
export function getCropSpacingConfig(cropName: string): CropSpacingConfig {
  if (!cropName) {
    return { rowSpacing: 0.50, plantSpacing: 0.25, defaultMode: 'hectare', description: 'Padrão.' };
  }
  const exact = CROP_SPACING_CONFIGS[cropName];
  if (exact) return exact;

  const norm = cropName.toLowerCase().trim();
  for (const [key, cfg] of Object.entries(CROP_SPACING_CONFIGS)) {
    if (norm.includes(key.toLowerCase()) || key.toLowerCase().includes(norm)) {
      return cfg;
    }
  }

  // Fallbacks inteligentes por classe vegetal
  if (norm.includes('caf') || norm.includes('cacau') || norm.includes('banana') || norm.includes('citros') || norm.includes('frut') || norm.includes('pimenta') || norm.includes('mandioca') || norm.includes('tomat')) {
    return {
      rowSpacing: 3.00,
      plantSpacing: 1.50,
      defaultMode: 'planta',
      description: 'Espaçamento para cultura perene / hortifrúti.'
    };
  }

  if (norm.includes('eucalipto') || norm.includes('pinus') || norm.includes('seringa') || norm.includes('florest')) {
    return {
      rowSpacing: 3.00,
      plantSpacing: 2.00,
      defaultMode: 'planta',
      description: 'Espaçamento florestal.'
    };
  }

  if (norm.includes('soja') || norm.includes('milho') || norm.includes('feij') || norm.includes('algod') || norm.includes('trigo') || norm.includes('arroz') || norm.includes('cana')) {
    return {
      rowSpacing: 0.50,
      plantSpacing: 0.20,
      defaultMode: 'linear',
      description: 'Espaçamento em linhas de semeadura.'
    };
  }

  return {
    rowSpacing: 0.50,
    plantSpacing: 0.25,
    defaultMode: 'hectare',
    description: 'Espaçamento padrão agronômico.'
  };
}

export function getCropYieldOptions(cropName: string) {
  if (!cropName) {
    return [
      { label: 'Produtividade Média Regional', key: 'med', multiplier: 1.0 },
      { label: 'Alta Produtividade (+25% NPK)', key: 'alta', multiplier: 1.25 },
      { label: 'Baixa Produtividade (-30% NPK)', key: 'baixa', multiplier: 0.7 }
    ];
  }
  const exact = CROP_YIELD_TARGETS[cropName];
  if (exact) return exact;

  const norm = cropName.toLowerCase().trim();
  for (const [key, opts] of Object.entries(CROP_YIELD_TARGETS)) {
    if (norm.includes(key.toLowerCase()) || key.toLowerCase().includes(norm)) {
      return opts;
    }
  }

  return [
    { label: 'Produtividade Média Regional', key: 'med', multiplier: 1.0 },
    { label: 'Alta Produtividade (+25% NPK)', key: 'alta', multiplier: 1.25 },
    { label: 'Baixa Produtividade (-30% NPK)', key: 'baixa', multiplier: 0.7 }
  ];
}

export const FertilizationView: React.FC<FertilizationViewProps> = ({
  sample,
  plot,
  references,
  onNavigate
}) => {
  const availableCrops = getAllActiveCrops(references);
  const initialCrop = plot?.currentCrop || availableCrops[0] || 'Milho';
  const [crop, setCrop] = useState<string>(initialCrop);

  const initialSpacingConfig = getCropSpacingConfig(initialCrop);

  // Modo de Aplicação: 'hectare' | 'linear' | 'planta'
  const [applicationMode, setApplicationMode] = useState<'hectare' | 'linear' | 'planta'>(
    initialSpacingConfig.defaultMode
  );

  // Espaçamentos da cultura (em metros) e parcelamentos
  const [spacingRow, setSpacingRow] = useState<number>(initialSpacingConfig.rowSpacing);
  const [spacingPlant, setSpacingPlant] = useState<number>(initialSpacingConfig.plantSpacing);
  const [splitApplications, setSplitApplications] = useState<number>(
    initialSpacingConfig.defaultMode === 'planta' ? 3 : 2
  );

  // Metas de produtividade disponíveis para a cultura
  const yieldOptions = useMemo(() => {
    return getCropYieldOptions(crop);
  }, [crop]);

  const [selectedYieldKey, setSelectedYieldKey] = useState<string>(
    yieldOptions[1]?.key || yieldOptions[0]?.key || 'med'
  );

  // Atualização sincronizada e segura ao trocar de cultura
  const handleCropChange = (newCrop: string) => {
    setCrop(newCrop);
    const opts = getCropYieldOptions(newCrop);
    if (opts && opts[1]) setSelectedYieldKey(opts[1].key);
    else if (opts && opts[0]) setSelectedYieldKey(opts[0].key);
    else setSelectedYieldKey('med');

    const cfg = getCropSpacingConfig(newCrop);
    setSpacingRow(cfg.rowSpacing);
    setSpacingPlant(cfg.plantSpacing);
    setApplicationMode(cfg.defaultMode);
    if (cfg.defaultMode === 'planta') {
      setSplitApplications(3);
    }
  };

  // Restaura o espaçamento padrão agronômico da cultura atual
  const handleResetCropSpacing = () => {
    const cfg = getCropSpacingConfig(crop);
    setSpacingRow(cfg.rowSpacing);
    setSpacingPlant(cfg.plantSpacing);
    setApplicationMode(cfg.defaultMode);
  };

  // Estratégia de Escolha dos Adubos (Formulados NPK vs Matérias-Primas Simples vs Personalizado)
  const [strategy, setStrategy] = useState<'formulado' | 'simples' | 'custom'>('formulado');

  // Seleções na estratégia "Formulados NPK":
  const [selectedPlantingNpkId, setSelectedPlantingNpkId] = useState<string>('fert-npk-04-14-08');
  const [selectedTopNId, setSelectedTopNId] = useState<string>('fert-ureia');
  const [selectedTopKId, setSelectedTopKId] = useState<string>('fert-kcl');

  // Seleções na estratégia "Matérias-Primas Simples":
  const [selectedSimplePId, setSelectedSimplePId] = useState<string>('fert-map');
  const [selectedSimpleNId, setSelectedSimpleNId] = useState<string>('fert-ureia');
  const [selectedSimpleKId, setSelectedSimpleKId] = useState<string>('fert-kcl');

  // Modal de Consulta ao Catálogo Oficial IAC 208 / MAPA
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('all');

  const plotArea = plot?.areaHa || 25.0;

  if (!sample) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
        <Wheat className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900">Selecione uma análise de solo</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Para recomendar adubação de plantio e cobertura com as garantias do MAPA, selecione um talhão com laudo cadastrado.
        </p>
      </div>
    );
  }

  // Multiplicador da meta de produtividade
  const currentYieldOption = yieldOptions.find((y) => y.key === selectedYieldKey) || yieldOptions[0];
  const yieldMultiplier = currentYieldOption?.multiplier ?? 1.0;

  // 1. Demanda teórica de nutrientes com base na literatura da cultura
  const { rule, sourceTitle } = getCropAgronomicRule(crop, references);

  const pSolo = sample.pMehlich1 ?? 8;
  const kSolo = sample.kCmolc ?? 0.12;
  const pStatus = pSolo < 10 ? 'baixo' : (pSolo <= 20 ? 'medio' : 'bom');
  const kStatus = kSolo < 0.15 ? 'baixo' : (kSolo <= 0.30 ? 'medio' : 'bom');

  // Ajuste fino por teor do solo e meta de produtividade
  let nDemanda = Math.round(rule.nDemandKgHa * yieldMultiplier);
  let pDemanda = rule.pDemandKgHa;
  if (pStatus === 'baixo') pDemanda = Math.round(pDemanda * 1.25);
  else if (pStatus === 'bom') pDemanda = Math.round(pDemanda * 0.7);
  pDemanda = Math.round(pDemanda * yieldMultiplier);

  let kDemanda = rule.kDemandKgHa;
  if (kStatus === 'baixo') kDemanda = Math.round(kDemanda * 1.3);
  else if (kStatus === 'bom') kDemanda = Math.round(kDemanda * 0.75);
  kDemanda = Math.round(kDemanda * yieldMultiplier);

  // Parcelamento agronômico (Plantio vs Cobertura)
  const isPerennial = rule.category === 'perene' || rule.category === 'pastagem';
  const isSoybean = crop.toLowerCase().includes('soja');

  // Soja fixa Nitrogênio via FBN, demanda externa mínima de arranque
  const nPlantioAlvo = isSoybean ? 10 : (isPerennial ? 0 : Math.round(nDemanda * 0.2));
  const nCobAlvo = isSoybean ? 0 : (nDemanda - nPlantioAlvo);
  const pPlantioAlvo = pDemanda;
  const kPlantioAlvo = isPerennial ? 0 : Math.min(30, Math.round(kDemanda * 0.3));
  const kCobAlvo = kDemanda - kPlantioAlvo;

  // 2. Cálculos Operacionais de Espaçamento e População de Plantas
  const safeRow = spacingRow > 0 ? spacingRow : 0.50;
  const safePlant = spacingPlant > 0 ? spacingPlant : 0.25;

  // Metros lineares totais
  const linearMetersPerHa = Math.round(10000 / safeRow);
  const totalLinearMetersPlot = Math.round(linearMetersPerHa * plotArea);

  // População de plantas (plantas/ha e total talhão)
  const areaPerPlant = Number((safeRow * safePlant).toFixed(3));
  const plantsPerHa = Math.round(10000 / (areaPerPlant > 0 ? areaPerPlant : 0.125));
  const totalPlantsPlot = Math.round(plantsPerHa * plotArea);

  // Helper para criar item comercial com todas as métricas: hectare, linear e por planta
  const createCommercialItem = (params: {
    timing: 'Plantio' | 'Cobertura';
    name: string;
    chemicalFormula: string;
    guaranteeText: string;
    doseKgHa: number;
    nSupplied: number;
    pSupplied: number;
    kSupplied: number;
    caSupplied: number;
    sSupplied: number;
    explanation: string;
  }) => {
    const doseKgHa = params.doseKgHa;
    const bags50kgHa = Number((doseKgHa / 50).toFixed(1));
    const totalKg = Math.round(doseKgHa * plotArea);
    const totalBags50kg = Math.ceil(totalKg / 50);
    const bigBags1000kg = Number((totalKg / 1000).toFixed(1));

    // Cálculos por Metro Linear:
    // Dose (g/m) = (kg/ha * 1000) / (10000 / safeRow) = (kg/ha * safeRow) / 10
    const doseGramsPerMeter = Number(((doseKgHa * safeRow) / 10).toFixed(1));
    // Teste prático de 10 metros para calibração com saquinho plástico na plantadeira
    const doseGramsPer10Meters = Number((doseGramsPerMeter * 10).toFixed(1));

    // Cálculos por Planta / Cova:
    // Dose (g/planta) = (kg/ha * 1000) / plantsPerHa
    const doseGramsPerPlant = Number(((doseKgHa * 1000) / (plantsPerHa || 1)).toFixed(1));
    const doseGramsPerSplit = Number((doseGramsPerPlant / (splitApplications || 1)).toFixed(1));

    return {
      ...params,
      bags50kgHa,
      totalKg,
      totalBags50kg,
      bigBags1000kg,
      doseGramsPerMeter,
      doseGramsPer10Meters,
      doseGramsPerPlant,
      doseGramsPerSplit
    };
  };

  // 3. Montagem dos Adubos Selecionados conforme as Garantias Oficiais do MAPA (IAC 208)
  type CommercialItem = ReturnType<typeof createCommercialItem>;
  const commercialItems: CommercialItem[] = [];

  if (strategy === 'formulado') {
    // A) Formulação NPK no sulco de plantio
    const npkFert = OFFICIAL_FERTILIZERS.find((f) => f.id === selectedPlantingNpkId) || OFFICIAL_FERTILIZERS.find((f) => f.id === 'fert-npk-04-14-08')!;
    
    // A dose do formulado de plantio é balizada pelo Fósforo (P2O5)
    const pPercent = npkFert.p2o5Percent / 100 || 0.14;
    const doseNpkHa = Math.round(pPlantioAlvo / pPercent);
    const nFromNpk = Math.round(doseNpkHa * (npkFert.nPercent / 100));
    const pFromNpk = Math.round(doseNpkHa * pPercent);
    const kFromNpk = Math.round(doseNpkHa * (npkFert.k2oPercent / 100));
    const caFromNpk = Math.round(doseNpkHa * ((npkFert.caPercent || 0) / 100));
    const sFromNpk = Math.round(doseNpkHa * ((npkFert.sPercent || 0) / 100));

    commercialItems.push(
      createCommercialItem({
        timing: 'Plantio',
        name: npkFert.name,
        chemicalFormula: npkFert.formulaChemical,
        guaranteeText: `${npkFert.nPercent}-${npkFert.p2o5Percent}-${npkFert.k2oPercent}${npkFert.sPercent ? ` + ${npkFert.sPercent}%S` : ''}${npkFert.caPercent ? ` + ${npkFert.caPercent}%Ca` : ''}`,
        doseKgHa: doseNpkHa,
        nSupplied: nFromNpk,
        pSupplied: pFromNpk,
        kSupplied: kFromNpk,
        caSupplied: caFromNpk,
        sSupplied: sFromNpk,
        explanation: `Atende 100% do Fósforo (${pFromNpk} kg/ha P₂O₅) e supre o arranque inicial de N e K.`
      })
    );

    // B) Nitrogênio em Cobertura (descontando o que já veio do NPK de plantio)
    const nFaltaCob = Math.max(0, nDemanda - nFromNpk);
    if (nFaltaCob > 0) {
      const nFert = OFFICIAL_FERTILIZERS.find((f) => f.id === selectedTopNId) || OFFICIAL_FERTILIZERS.find((f) => f.id === 'fert-ureia')!;
      const nPercent = nFert.nPercent / 100 || 0.45;
      const doseNHa = Math.round(nFaltaCob / nPercent);
      const sFromN = Math.round(doseNHa * ((nFert.sPercent || 0) / 100));

      commercialItems.push(
        createCommercialItem({
          timing: 'Cobertura',
          name: nFert.name,
          chemicalFormula: nFert.formulaChemical,
          guaranteeText: `${nFert.nPercent}% N${nFert.sPercent ? ` + ${nFert.sPercent}% S` : ''}`,
          doseKgHa: doseNHa,
          nSupplied: nFaltaCob,
          pSupplied: 0,
          kSupplied: 0,
          caSupplied: 0,
          sSupplied: sFromN,
          explanation: `Complementa a exigência vegetativa de Nitrogênio (${nFaltaCob} kg/ha de N).`
        })
      );
    }

    // C) Potássio em Cobertura (descontando o que veio do NPK de plantio)
    const kFaltaCob = Math.max(0, kDemanda - kFromNpk);
    if (kFaltaCob > 5) {
      const kFert = OFFICIAL_FERTILIZERS.find((f) => f.id === selectedTopKId) || OFFICIAL_FERTILIZERS.find((f) => f.id === 'fert-kcl')!;
      const kPercent = kFert.k2oPercent / 100 || 0.60;
      const doseKHa = Math.round(kFaltaCob / kPercent);
      const sFromK = Math.round(doseKHa * ((kFert.sPercent || 0) / 100));

      commercialItems.push(
        createCommercialItem({
          timing: 'Cobertura',
          name: kFert.name,
          chemicalFormula: kFert.formulaChemical,
          guaranteeText: `${kFert.k2oPercent}% K₂O${kFert.sPercent ? ` + ${kFert.sPercent}% S` : ''}`,
          doseKgHa: doseKHa,
          nSupplied: 0,
          pSupplied: 0,
          kSupplied: kFaltaCob,
          caSupplied: 0,
          sSupplied: sFromK,
          explanation: `Suprimento potássico para enchimento de grãos/frutos (${kFaltaCob} kg/ha de K₂O).`
        })
      );
    }
  } else {
    // ESTRATÉGIA MATÉRIAS-PRIMAS SIMPLES (MAP / Super Simples + KCl + Ureia)
    // A) Fósforo no Plantio
    const pFert = OFFICIAL_FERTILIZERS.find((f) => f.id === selectedSimplePId) || OFFICIAL_FERTILIZERS.find((f) => f.id === 'fert-map')!;
    const pPerc = pFert.p2o5Percent / 100 || 0.52;
    const dosePHa = Math.round(pPlantioAlvo / pPerc);
    const nFromP = Math.round(dosePHa * (pFert.nPercent / 100));
    const pFromP = Math.round(dosePHa * pPerc);
    const caFromP = Math.round(dosePHa * ((pFert.caPercent || 0) / 100));
    const sFromP = Math.round(dosePHa * ((pFert.sPercent || 0) / 100));

    commercialItems.push(
      createCommercialItem({
        timing: 'Plantio',
        name: pFert.name,
        chemicalFormula: pFert.formulaChemical,
        guaranteeText: `${pFert.p2o5Percent}% P₂O₅${pFert.nPercent ? ` + ${pFert.nPercent}% N` : ''}${pFert.sPercent ? ` + ${pFert.sPercent}% S` : ''}${pFert.caPercent ? ` + ${pFert.caPercent}% Ca` : ''}`,
        doseKgHa: dosePHa,
        nSupplied: nFromP,
        pSupplied: pFromP,
        kSupplied: 0,
        caSupplied: caFromP,
        sSupplied: sFromP,
        explanation: `Fornece ${pFromP} kg/ha de P₂O₅ solúvel no sulco de plantio.`
      })
    );

    // B) Nitrogênio Total (descontando o que veio do MAP/DAP se houver)
    const nFalta = Math.max(0, nDemanda - nFromP);
    if (nFalta > 0) {
      const nFert = OFFICIAL_FERTILIZERS.find((f) => f.id === selectedSimpleNId) || OFFICIAL_FERTILIZERS.find((f) => f.id === 'fert-ureia')!;
      const nPerc = nFert.nPercent / 100 || 0.45;
      const doseNHa = Math.round(nFalta / nPerc);
      const sFromN = Math.round(doseNHa * ((nFert.sPercent || 0) / 100));

      commercialItems.push(
        createCommercialItem({
          timing: 'Cobertura',
          name: nFert.name,
          chemicalFormula: nFert.formulaChemical,
          guaranteeText: `${nFert.nPercent}% N${nFert.sPercent ? ` + ${nFert.sPercent}% S` : ''}`,
          doseKgHa: doseNHa,
          nSupplied: nFalta,
          pSupplied: 0,
          kSupplied: 0,
          caSupplied: 0,
          sSupplied: sFromN,
          explanation: `Aplicação parcelada em estádios de maior absorção foliar.`
        })
      );
    }

    // C) Potássio Total
    if (kDemanda > 0) {
      const kFert = OFFICIAL_FERTILIZERS.find((f) => f.id === selectedSimpleKId) || OFFICIAL_FERTILIZERS.find((f) => f.id === 'fert-kcl')!;
      const kPerc = kFert.k2oPercent / 100 || 0.60;
      const doseKHa = Math.round(kDemanda / kPerc);
      const sFromK = Math.round(doseKHa * ((kFert.sPercent || 0) / 100));

      commercialItems.push(
        createCommercialItem({
          timing: kCobAlvo > 0 ? 'Cobertura' : 'Plantio',
          name: kFert.name,
          chemicalFormula: kFert.formulaChemical,
          guaranteeText: `${kFert.k2oPercent}% K₂O${kFert.sPercent ? ` + ${kFert.sPercent}% S` : ''}`,
          doseKgHa: doseKHa,
          nSupplied: 0,
          pSupplied: 0,
          kSupplied: kDemanda,
          caSupplied: 0,
          sSupplied: sFromK,
          explanation: `Atende os ${kDemanda} kg/ha de K₂O exigidos pela cultura.`
        })
      );
    }
  }

  // Totais Fornecidos pela Mistura Escolhida
  const totalNFornecido = commercialItems.reduce((acc, curr) => acc + curr.nSupplied, 0);
  const totalPFornecido = commercialItems.reduce((acc, curr) => acc + curr.pSupplied, 0);
  const totalKFornecido = commercialItems.reduce((acc, curr) => acc + curr.kSupplied, 0);
  const totalCaFornecido = commercialItems.reduce((acc, curr) => acc + curr.caSupplied, 0);
  const totalSFornecido = commercialItems.reduce((acc, curr) => acc + curr.sSupplied, 0);

  // Filtro da tabela do Catálogo Oficial
  const filteredCatalog = OFFICIAL_FERTILIZERS.filter((fert) => {
    const matchesSearch =
      fert.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      fert.formulaChemical.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (fert.notes && fert.notes.toLowerCase().includes(catalogSearch.toLowerCase()));

    if (catalogCategoryFilter === 'all') return matchesSearch;
    return matchesSearch && fert.category === catalogCategoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Topo com Título, Seletor de Cultura e Meta Numérica de Produtividade */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#173F2B] flex items-center justify-center border border-emerald-200">
              <Wheat className="w-5 h-5 text-[#2F7D32]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Planejamento Nutricional & Adubos Comerciais
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Talhão: <strong>{plot?.name || sample.plotName}</strong> ({plotArea} ha) • Calibrado pelas garantias oficiais do MAPA.
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-[#2F7D32]" />
              <span>Base Teórica: <strong>{sourceTitle}</strong></span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
              <Scale className="w-3.5 h-3.5 text-amber-700" />
              <span>Tabela Oficial: <strong>Boletim 208 IAC / MAPA (Trani & Trani)</strong></span>
            </div>
          </div>
        </div>

        {/* Seletores de Cultura e Meta Real de Produtividade */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Cultura Alvo ({availableCrops.length})
            </label>
            <select
              value={crop}
              onChange={(e) => handleCropChange(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2F7D32]/20 focus:border-[#2F7D32] bg-white text-gray-900 shadow-2xs cursor-pointer"
            >
              {availableCrops.map((c) => (
                <option key={c} value={c}>
                  🌱 {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Meta Real de Produtividade
            </label>
            <select
              value={selectedYieldKey}
              onChange={(e) => setSelectedYieldKey(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2F7D32]/20 focus:border-[#2F7D32] bg-white text-gray-900 shadow-2xs cursor-pointer"
            >
              {yieldOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  🎯 {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 lg:pt-0">
            <button
              onClick={() => setIsCatalogModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer mt-0 sm:mt-4"
              title="Abrir Tabela 2 do Boletim 208 IAC com composição e solubilidade"
            >
              <FileText className="w-3.5 h-3.5 text-[#8BC34A]" />
              <span>Garantias MAPA (IAC 208)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resumo da Demanda Pura da Cultura vs Status do Solo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nitrogênio (N)</span>
            <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full">
              Plantio + Cobertura
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-gray-900">{nDemanda}</span>
            <span className="text-xs text-gray-500 font-semibold">kg/ha de N</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-600 flex justify-between">
            <span>Plantio: {nPlantioAlvo} kg/ha</span>
            <span className="font-bold text-blue-700">Cobertura: {nCobAlvo} kg/ha</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fósforo (P₂O₅)</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              pStatus === 'baixo' ? 'bg-red-100 text-red-900' : 'bg-emerald-100 text-emerald-900'
            }`}>
              Solo: {pSolo} mg/dm³ ({pStatus})
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-gray-900">{pDemanda}</span>
            <span className="text-xs text-gray-500 font-semibold">kg/ha de P₂O₅</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-600 flex justify-between">
            <span>Sulco de Plantio: 100%</span>
            <span>Meta Produtividade: {currentYieldOption?.label ? currentYieldOption.label.split('(')[0] : 'Regional Padrão'}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Potássio (K₂O)</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              kStatus === 'baixo' ? 'bg-red-100 text-red-900' : 'bg-emerald-100 text-emerald-900'
            }`}>
              Solo: {kSolo} cmol/dm³ ({kStatus})
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-gray-900">{kDemanda}</span>
            <span className="text-xs text-gray-500 font-semibold">kg/ha de K₂O</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-600 flex justify-between">
            <span>Plantio: {kPlantioAlvo} kg/ha</span>
            <span className="font-bold text-emerald-700">Cobertura: {kCobAlvo} kg/ha</span>
          </div>
        </div>
      </div>

      {/* MODO DE APLICAÇÃO & REGULAGEM DE CAMPO (METRO LINEAR, PLANTA/COVA, HECTARE) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-[#173F2B]">
                <Calculator className="w-4 h-4 text-[#2F7D32]" />
              </span>
              <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                Modo de Aplicação & Regulagem da Lavoura
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Defina o espaçamento do plantio para calcular automaticamente a população de plantas, metros de sulco e a dose por metro linear ou por cova.
            </p>
          </div>

          {/* Seletor de Modo de Aplicação */}
          <div className="grid grid-cols-3 p-1 bg-gray-100 rounded-xl gap-1 shrink-0">
            <button
              onClick={() => setApplicationMode('hectare')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                applicationMode === 'hectare'
                  ? 'bg-white text-[#173F2B] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Wheat className="w-3.5 h-3.5" />
              <span>Por Hectare (kg/ha)</span>
            </button>

            <button
              onClick={() => setApplicationMode('linear')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                applicationMode === 'linear'
                  ? 'bg-white text-[#173F2B] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Metro Linear (g/m)</span>
            </button>

            <button
              onClick={() => setApplicationMode('planta')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                applicationMode === 'planta'
                  ? 'bg-white text-[#173F2B] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Trees className="w-3.5 h-3.5" />
              <span>Por Planta (g/planta)</span>
            </button>
          </div>
        </div>

        {/* Configuração de Espaçamento e População de Plantas */}
        <div className="bg-[#F8FAF8] rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-5">
              {/* Espaçamento entre Linhas / Ruas */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-[#2F7D32]" />
                  <span>Espaçamento entre Linhas / Ruas (E₁)</span>
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      min="0.10"
                      max="15.0"
                      value={spacingRow || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setSpacingRow(isNaN(val) ? 0 : val);
                      }}
                      onBlur={() => {
                        if (!spacingRow || spacingRow <= 0) setSpacingRow(0.50);
                      }}
                      className="w-24 text-xs font-bold px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 shadow-2xs focus:ring-2 focus:ring-[#2F7D32]/20"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-gray-400">m</span>
                  </div>
                  {/* Atalhos Rápidos */}
                  <div className="flex items-center gap-1">
                    {[0.45, 0.50, 0.76, 0.90, 1.40, 3.00].map((val) => (
                      <button
                        key={val}
                        onClick={() => setSpacingRow(val)}
                        className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          spacingRow === val
                            ? 'bg-[#173F2B] text-white border-[#173F2B]'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {val}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Espaçamento entre Plantas */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Trees className="w-3.5 h-3.5 text-[#2F7D32]" />
                  <span>Espaçamento entre Plantas na Linha (E₂)</span>
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.02"
                      min="0.02"
                      max="15.0"
                      value={spacingPlant || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setSpacingPlant(isNaN(val) ? 0 : val);
                      }}
                      onBlur={() => {
                        if (!spacingPlant || spacingPlant <= 0) setSpacingPlant(0.25);
                      }}
                      className="w-24 text-xs font-bold px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 shadow-2xs focus:ring-2 focus:ring-[#2F7D32]/20"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-gray-400">m</span>
                  </div>
                  {/* Atalhos Rápidos */}
                  <div className="flex items-center gap-1">
                    {[0.08, 0.10, 0.28, 0.80, 1.00, 2.00, 3.00].map((val) => (
                      <button
                        key={val}
                        onClick={() => setSpacingPlant(val)}
                        className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          spacingPlant === val
                            ? 'bg-[#173F2B] text-white border-[#173F2B]'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {val}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Parcelamentos para aplicação por planta */}
              {applicationMode === 'planta' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nº de Aplicações / Parcelas</span>
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        onClick={() => setSplitApplications(num)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                          splitApplications === num
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {num}x {num === 1 ? 'única' : 'vezes'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botão de Restaurar Padrão da Cultura */}
            <div className="flex items-center shrink-0">
              <button
                onClick={handleResetCropSpacing}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                title="Redefinir espaçamento recomendado para esta cultura"
              >
                <span>Restaurar Padrão de {crop}</span>
              </button>
            </div>
          </div>

          {/* Cards de Métricas de Campo em Tempo Real */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-200/70">
            <div className={`p-3 rounded-xl border shadow-2xs transition-all ${
              applicationMode === 'linear' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Metros Lineares / ha</span>
                {applicationMode === 'linear' && <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">Ativo</span>}
              </div>
              <span className="text-base font-black text-gray-900 block mt-0.5">{linearMetersPerHa.toLocaleString('pt-BR')} m</span>
              <span className="text-[10px] text-gray-500 block">10.000m² / {safeRow}m de entrelinha</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Total de Sulco no Talhão</span>
              <span className="text-base font-black text-emerald-800 block mt-0.5">{totalLinearMetersPlot.toLocaleString('pt-BR')} m</span>
              <span className="text-[10px] text-gray-500 block">em {plotArea} hectares</span>
            </div>

            <div className={`p-3 rounded-xl border shadow-2xs transition-all ${
              applicationMode === 'planta' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">População Calculada</span>
                {applicationMode === 'planta' && <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded">Ativo</span>}
              </div>
              <span className="text-base font-black text-gray-900 block mt-0.5">{plantsPerHa.toLocaleString('pt-BR')}</span>
              <span className="text-[10px] text-gray-500 block">plantas/ha ({areaPerPlant} m²/planta)</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Total de Plantas / Covas</span>
              <span className="text-base font-black text-blue-700 block mt-0.5">{totalPlantsPlot.toLocaleString('pt-BR')}</span>
              <span className="text-[10px] text-gray-500 block">plantas em {plotArea} ha</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seletor de Estratégia de Adubação e Fontes do MAPA */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#2F7D32]" />
              <span>Escolha dos Adubos Comerciais & Estratégia de Aplicação</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Escolha os adubos que você tem na revenda ou no barracão da fazenda com base nas garantias do MAPA (IAC Boletim 208).
            </p>
          </div>

          {/* Abas de Estratégia: Formulado NPK vs Matérias-Primas Simples */}
          <div className="flex items-center p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setStrategy('formulado')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                strategy === 'formulado'
                  ? 'bg-white text-[#173F2B] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Fórmulas NPK Comerciais
            </button>
            <button
              onClick={() => setStrategy('simples')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                strategy === 'simples'
                  ? 'bg-white text-[#173F2B] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Matérias-Primas Simples (MAP / Ureia / KCl)
            </button>
          </div>
        </div>

        {/* Controles de Seleção de Produtos */}
        {strategy === 'formulado' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Adubo Formulado no Plantio (Sulco)
              </label>
              <select
                value={selectedPlantingNpkId}
                onChange={(e) => setSelectedPlantingNpkId(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#2F7D32]/20"
              >
                {OFFICIAL_FERTILIZERS.filter((f) => f.category === 'formulado').map((f) => (
                  <option key={f.id} value={f.id}>
                    📦 {f.name} ({f.nPercent}-{f.p2o5Percent}-{f.k2oPercent})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Fonte de Nitrogênio em Cobertura
              </label>
              <select
                value={selectedTopNId}
                onChange={(e) => setSelectedTopNId(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#2F7D32]/20"
              >
                {OFFICIAL_FERTILIZERS.filter((f) => f.category === 'nitrogenado').map((f) => (
                  <option key={f.id} value={f.id}>
                    🌱 {f.name} ({f.nPercent}% N {f.sPercent ? `+ ${f.sPercent}% S` : ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Fonte de Potássio em Cobertura
              </label>
              <select
                value={selectedTopKId}
                onChange={(e) => setSelectedTopKId(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#2F7D32]/20"
              >
                {OFFICIAL_FERTILIZERS.filter((f) => f.category === 'potassico').map((f) => (
                  <option key={f.id} value={f.id}>
                    ⚡ {f.name} ({f.k2oPercent}% K₂O {f.sPercent ? `+ ${f.sPercent}% S` : ''})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Fonte Fosfatada no Plantio
              </label>
              <select
                value={selectedSimplePId}
                onChange={(e) => setSelectedSimplePId(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#2F7D32]/20"
              >
                {OFFICIAL_FERTILIZERS.filter((f) => f.category === 'fosfatado' || f.id === 'fert-map' || f.id === 'fert-dap').map((f) => (
                  <option key={f.id} value={f.id}>
                    💎 {f.name} ({f.p2o5Percent}% P₂O₅ {f.nPercent ? `+ ${f.nPercent}% N` : ''} {f.sPercent ? `+ ${f.sPercent}% S` : ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Fonte Nitrogenada (Arranque / Cobertura)
              </label>
              <select
                value={selectedSimpleNId}
                onChange={(e) => setSelectedSimpleNId(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#2F7D32]/20"
              >
                {OFFICIAL_FERTILIZERS.filter((f) => f.category === 'nitrogenado').map((f) => (
                  <option key={f.id} value={f.id}>
                    🌱 {f.name} ({f.nPercent}% N {f.sPercent ? `+ ${f.sPercent}% S` : ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Fonte Potássica (KCl / Sulfato)
              </label>
              <select
                value={selectedSimpleKId}
                onChange={(e) => setSelectedSimpleKId(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#2F7D32]/20"
              >
                {OFFICIAL_FERTILIZERS.filter((f) => f.category === 'potassico').map((f) => (
                  <option key={f.id} value={f.id}>
                    ⚡ {f.name} ({f.k2oPercent}% K₂O {f.sPercent ? `+ ${f.sPercent}% S` : ''})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Cabeçalho de Controle da Tabela e Alternância Rápida de Visão */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Exibição dos Dados na Tabela:
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              applicationMode === 'linear'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : applicationMode === 'planta'
                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                : 'bg-gray-100 text-gray-800 border border-gray-300'
            }`}>
              {applicationMode === 'linear' && `📏 Metro Linear (${safeRow}m de entrelinha)`}
              {applicationMode === 'planta' && `🌳 Por Planta (${plantsPerHa.toLocaleString('pt-BR')} pl/ha • ${splitApplications}x)`}
              {applicationMode === 'hectare' && `🌾 Área Total (Dose por Hectare & Big Bags)`}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setApplicationMode('hectare')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                applicationMode === 'hectare'
                  ? 'bg-white text-[#173F2B] shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Hectare
            </button>
            <button
              onClick={() => setApplicationMode('linear')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                applicationMode === 'linear'
                  ? 'bg-white text-[#173F2B] shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Metro Linear
            </button>
            <button
              onClick={() => setApplicationMode('planta')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                applicationMode === 'planta'
                  ? 'bg-white text-[#173F2B] shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Por Planta
            </button>
          </div>
        </div>

        {/* Tabela de Produtos Comerciais e Quantidades Calculadas */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
              {applicationMode === 'hectare' && (
                <tr>
                  <th className="p-3">Momento</th>
                  <th className="p-3">Adubo Comercial (MAPA)</th>
                  <th className="p-3">Fórmula Química</th>
                  <th className="p-3">Garantia Oficial</th>
                  <th className="p-3">Dose (kg/ha)</th>
                  <th className="p-3">Sacos 50kg / ha</th>
                  <th className="p-3">Total Talhão ({plotArea} ha)</th>
                  <th className="p-3">Big Bags (1.000 kg)</th>
                </tr>
              )}

              {applicationMode === 'linear' && (
                <tr>
                  <th className="p-3">Momento</th>
                  <th className="p-3">Adubo Comercial (MAPA)</th>
                  <th className="p-3">Garantia Oficial</th>
                  <th className="p-3">Dose Base (kg/ha)</th>
                  <th className="p-3 bg-emerald-100/60 text-emerald-950 font-black">Dose Linear (g/m)</th>
                  <th className="p-3 bg-emerald-200/70 text-emerald-950 font-black">Teste Calibração 10m (g)</th>
                  <th className="p-3">Total Talhão ({plotArea} ha)</th>
                  <th className="p-3">Regulagem da Máquina</th>
                </tr>
              )}

              {applicationMode === 'planta' && (
                <tr>
                  <th className="p-3">Momento</th>
                  <th className="p-3">Adubo Comercial (MAPA)</th>
                  <th className="p-3">Garantia Oficial</th>
                  <th className="p-3">Dose Base (kg/ha)</th>
                  <th className="p-3 bg-blue-50 text-blue-950 font-black">Dose Total (g/planta)</th>
                  <th className="p-3">Parcelamento</th>
                  <th className="p-3 bg-blue-100 text-blue-950 font-black">Dose / Aplicação (g/planta)</th>
                  <th className="p-3">Total Talhão ({plotArea} ha)</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {commercialItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.timing === 'Plantio' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-blue-100 text-blue-900 border border-blue-200'
                    }`}>
                      {item.timing}
                    </span>
                  </td>
                  <td className="p-3 font-extrabold text-gray-900">{item.name}</td>

                  {applicationMode === 'hectare' && (
                    <>
                      <td className="p-3 font-mono text-[11px] text-gray-500">{item.chemicalFormula}</td>
                      <td className="p-3 font-mono font-bold text-emerald-800">{item.guaranteeText}</td>
                      <td className="p-3 font-extrabold text-gray-900">{item.doseKgHa} kg/ha</td>
                      <td className="p-3 text-gray-600 font-semibold">{item.bags50kgHa} sc/ha</td>
                      <td className="p-3 font-extrabold text-[#173F2B]">
                        {item.totalKg.toLocaleString('pt-BR')} kg ({item.totalBags50kg} sc)
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-800">
                        {item.bigBags1000kg} BB
                      </td>
                    </>
                  )}

                  {applicationMode === 'linear' && (
                    <>
                      <td className="p-3 font-mono font-bold text-emerald-800">{item.guaranteeText}</td>
                      <td className="p-3 text-gray-600">{item.doseKgHa} kg/ha</td>
                      <td className="p-3 bg-emerald-50/50 font-black text-emerald-900 text-sm">
                        {item.doseGramsPerMeter} g/m
                      </td>
                      <td className="p-3 bg-emerald-100/60 font-black text-emerald-950 text-sm">
                        <span className="inline-flex items-center gap-1">
                          <span>{item.doseGramsPer10Meters} g</span>
                          <span className="text-[10px] text-emerald-700 font-normal">/ 10 metros</span>
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-[#173F2B]">
                        {item.totalKg.toLocaleString('pt-BR')} kg ({item.totalBags50kg} sc)
                      </td>
                      <td className="p-3 text-[11px] text-gray-600">
                        {item.timing === 'Plantio' ? 'Rosca no sulco sob semente' : 'Adubador lateral em entrelinha'}
                      </td>
                    </>
                  )}

                  {applicationMode === 'planta' && (
                    <>
                      <td className="p-3 font-mono font-bold text-emerald-800">{item.guaranteeText}</td>
                      <td className="p-3 text-gray-600">{item.doseKgHa} kg/ha</td>
                      <td className="p-3 bg-blue-50 font-black text-blue-900 text-sm">
                        {item.doseGramsPerPlant} g/planta
                      </td>
                      <td className="p-3 font-bold text-gray-700">
                        {splitApplications}x no ciclo
                      </td>
                      <td className="p-3 bg-blue-100 font-black text-blue-950 text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-white text-blue-900 border border-blue-300 font-black">
                            {item.doseGramsPerSplit} g
                          </span>
                          <span className="text-[10px] text-blue-800 font-semibold">copo dosador</span>
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-[#173F2B]">
                        {item.totalKg.toLocaleString('pt-BR')} kg ({item.totalBags50kg} sc)
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card Operacional de Orientação Prática de Campo */}
        {applicationMode === 'linear' && (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Ruler className="w-5 h-5 text-emerald-100" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-emerald-950 flex items-center gap-2">
                  <span>Procedimento de Calibração da Plantadeira (Teste de 10 Metros)</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">Instrução Agronômica</span>
                </h4>
                <p className="text-emerald-800 leading-relaxed text-[11px]">
                  <strong>1.</strong> Amarre um saquinho plástico em uma ou mais bicas de adubo da plantadeira. • <strong>2.</strong> Percorra com o trator na velocidade e rotação reais de trabalho exatamente <strong>10 metros lineares</strong>. • <strong>3.</strong> Pese na balança digital: a quantidade recolhida deve ser exatamente <strong>{commercialItems[0]?.doseGramsPer10Meters || 0} g</strong> para adubo de plantio. • <strong>4.</strong> Ajuste a abertura da rosca ou carretel até conferir a dosagem em todas as linhas.
                </p>
              </div>
            </div>
          </div>
        )}

        {applicationMode === 'planta' && (
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Trees className="w-5 h-5 text-blue-100" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-blue-950 flex items-center gap-2">
                  <span>Procedimento de Adubação por Planta / Cova (Copo Dosador)</span>
                  <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-bold">Instrução Agronômica</span>
                </h4>
                <p className="text-blue-800 leading-relaxed text-[11px]">
                  <strong>1.</strong> Corte ou regule um copo plástico com a marcação exata da dose por aplicação (ex: <strong>{commercialItems[0]?.doseGramsPerSplit || 0} g/planta</strong>). • <strong>2.</strong> Aplique em círculo ou meia-lua sob a projeção da copa (saia da planta), onde ficam as raízes que absorvem nutrientes. • <strong>3.</strong> Nunca jogue encostado no tronco ou colo da planta para evitar queima química. • <strong>4.</strong> Realize as {splitApplications} aplicações distribuídas nos períodos de chuva ou irrigação.
                </p>
              </div>
            </div>
          </div>
        )}

        {applicationMode === 'hectare' && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#173F2B] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Boxes className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-gray-900 flex items-center gap-2">
                  <span>Logística, Compra & Armazenamento ({plotArea} ha)</span>
                  <span className="text-[10px] bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full font-bold">Planejamento da Fazenda</span>
                </h4>
                <p className="text-gray-600 leading-relaxed text-[11px]">
                  Para o talhão de {plotArea} ha, a compra em <strong>Big Bags de 1.000 kg</strong> reduz perdas por rompimento de sacos e agiliza o abastecimento com guincho bagzeiro. Em caso de aplicação manual, priorize <strong>sacos de 50 kg</strong>. Mantenha os adubos armazenados em galpão coberto e sobre paletes de madeira para evitar empedramento por umidade do solo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Balanço Nutricional e Aporte de Nutrientes Secundários */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Card de Balanço NPK */}
          <div className="bg-[#F8FAF8] p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
            <h4 className="font-bold text-[#173F2B] uppercase text-[11px] flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-[#2F7D32]" />
              <span>Balanço de Nutrientes (Exigido vs Fornecido)</span>
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Nitrogênio (N)</span>
                <span className="text-xs font-bold text-gray-700">{totalNFornecido} / {nDemanda}</span>
                <span className="text-[10px] block text-emerald-700 font-bold">kg/ha</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Fósforo (P₂O₅)</span>
                <span className="text-xs font-bold text-gray-700">{totalPFornecido} / {pDemanda}</span>
                <span className="text-[10px] block text-emerald-700 font-bold">kg/ha</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Potássio (K₂O)</span>
                <span className="text-xs font-bold text-gray-700">{totalKFornecido} / {kDemanda}</span>
                <span className="text-[10px] block text-emerald-700 font-bold">kg/ha</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 pt-1">
              Eficiência equilibrada: evita gastos desnecessários com adubo e previne salinização no sulco de plantio.
            </p>
          </div>

          {/* Card de Nutrientes Secundários Fornecidos (Enxofre e Cálcio) */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2 text-xs">
            <h4 className="font-bold text-emerald-950 uppercase text-[11px] flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Bônus de Nutrientes Secundários (Cálcio & Enxofre)</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="bg-white p-2 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Cálcio (Ca) Extra</span>
                <span className="text-sm font-black text-emerald-900">{totalCaFornecido} kg/ha</span>
                <span className="text-[10px] block text-emerald-600">fornecido via adubação</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Enxofre (S) Extra</span>
                <span className="text-sm font-black text-emerald-900">{totalSFornecido} kg/ha</span>
                <span className="text-[10px] block text-emerald-600">fornecido via adubação</span>
              </div>
            </div>
            <p className="text-[10px] text-emerald-800 pt-1">
              {totalSFornecido > 0
                ? '✅ Excelente: as fontes escolhidas já suprem a demanda de Enxofre da lavoura sem necessidade de compra extra de adubo sulfatado!'
                : '💡 Dica agronômica: considere utilizar Superfosfato Simples ou Sulfato de Amônio caso o solo apresente teor de Enxofre baixo.'}
            </p>
          </div>
        </div>
      </div>

      {/* Próximo Passo: Emissão do Relatório Técnico */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div>
          <h4 className="text-sm font-bold text-gray-900">Planejamento Nutricional Completo & Auditável</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Gere o laudo técnico em PDF com o receituário agronômico, memorial de cálculo e doses para compra.
          </p>
        </div>
        <button
          onClick={() => onNavigate('reports')}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] flex items-center space-x-2 transition-all shadow-md shrink-0 cursor-pointer"
        >
          <span>Emitir Laudo Técnico em PDF</span>
          <ArrowRight className="w-4 h-4 text-[#8BC34A]" />
        </button>
      </div>

      {/* MODAL: TABELA OFICIAL DE ADUBOS DO IAC 208 / MAPA */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            {/* Topo do Modal */}
            <div className="p-5 bg-gradient-to-r from-[#173F2B] to-[#2F7D32] text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <BookOpen className="w-5 h-5 text-[#8BC34A]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Tabela Oficial: Composição, Teores de Garantia e Solubilidade de Adubos
                  </h3>
                  <p className="text-xs text-emerald-200">
                    Boletim Técnico 208, Instituto Agronômico de Campinas (IAC / Legislação MAPA, 2011)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCatalogModalOpen(false)}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Busca e Filtro de Categoria */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Filtrar:</span>
                {[
                  { id: 'all', label: 'Todos os Adubos' },
                  { id: 'nitrogenado', label: 'Nitrogenados' },
                  { id: 'fosfatado', label: 'Fosfatados' },
                  { id: 'potassico', label: 'Potássicos' },
                  { id: 'misto', label: 'Mistos (MAP/DAP/KNO₃)' },
                  { id: 'calcico_magnesiano', label: 'Cálcicos & Magnesianos' },
                  { id: 'micronutriente', label: 'Micronutrientes' },
                  { id: 'formulado', label: 'Formulados NPK' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCatalogCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      catalogCategoryFilter === cat.id
                        ? 'bg-[#173F2B] text-white shadow-xs'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar adubo, fórmula ou nutriente..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-gray-300 bg-white shadow-2xs focus:ring-2 focus:ring-[#2F7D32]/20"
                />
              </div>
            </div>

            {/* Tabela do Catálogo */}
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 border-y border-gray-200 text-gray-700 font-bold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="p-3">Fertilizante</th>
                    <th className="p-3">Fórmula Química</th>
                    <th className="p-3">Teor de Nutriente (% Garantia)</th>
                    <th className="p-3">Solubilidade a 20°C (g/L)</th>
                    <th className="p-3">Solubilidade a 25°C (g/L)</th>
                    <th className="p-3">Observações Técnicas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {filteredCatalog.map((fert) => (
                    <tr key={fert.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="p-3 font-bold text-gray-900">{fert.name}</td>
                      <td className="p-3 font-mono text-[11px] text-gray-600">{fert.formulaChemical}</td>
                      <td className="p-3 font-mono font-bold text-emerald-800">
                        {fert.nPercent > 0 && `${fert.nPercent}% N `}
                        {fert.p2o5Percent > 0 && `${fert.p2o5Percent}% P₂O₅ `}
                        {fert.k2oPercent > 0 && `${fert.k2oPercent}% K₂O `}
                        {fert.caPercent && `${fert.caPercent}% Ca `}
                        {fert.mgPercent && `${fert.mgPercent}% Mg `}
                        {fert.sPercent && `${fert.sPercent}% S `}
                        {fert.otherNutrients && fert.otherNutrients}
                      </td>
                      <td className="p-3 font-mono text-gray-700">{fert.solubility20C ?? '-'}</td>
                      <td className="p-3 font-mono text-gray-700">{fert.solubility25C ?? '-'}</td>
                      <td className="p-3 text-[11px] text-gray-500 max-w-xs">{fert.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-3.5 bg-gray-50 border-t border-gray-200 px-6 flex items-center justify-between text-xs text-gray-500 shrink-0">
              <span className="font-semibold">
                Mostrando {filteredCatalog.length} fertilizantes com garantias registradas no MAPA.
              </span>
              <button
                onClick={() => setIsCatalogModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32]"
              >
                Fechar Consulta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
