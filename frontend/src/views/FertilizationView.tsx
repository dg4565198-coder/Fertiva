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
  FileText
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface FertilizationViewProps {
  sample: SoilSample | null;
  plot: Plot | null;
  references?: TechnicalReference[];
  onNavigate: (tab: NavTab) => void;
}

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
  ]
};

export const FertilizationView: React.FC<FertilizationViewProps> = ({
  sample,
  plot,
  references,
  onNavigate
}) => {
  const availableCrops = getAllActiveCrops(references);
  const [crop, setCrop] = useState<string>(plot?.currentCrop || availableCrops[0] || 'Milho');

  // Metas de produtividade disponíveis para a cultura
  const yieldOptions = useMemo(() => {
    return (
      CROP_YIELD_TARGETS[crop] || [
        { label: 'Produtividade Média Regional', key: 'med', multiplier: 1.0 },
        { label: 'Alta Produtividade (+25% NPK)', key: 'alta', multiplier: 1.25 },
        { label: 'Baixa Produtividade (-30% NPK)', key: 'baixa', multiplier: 0.7 }
      ]
    );
  }, [crop]);

  const [selectedYieldKey, setSelectedYieldKey] = useState<string>(
    yieldOptions[1]?.key || yieldOptions[0]?.key || 'med'
  );

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

  // 2. Cálculo dos Adubos Selecionados conforme as Garantias Oficiais do MAPA (IAC 208)
  const commercialItems: {
    timing: 'Plantio' | 'Cobertura';
    name: string;
    chemicalFormula: string;
    guaranteeText: string;
    doseKgHa: number;
    bags50kgHa: number;
    totalKg: number;
    totalBags50kg: number;
    bigBags1000kg: number;
    nSupplied: number;
    pSupplied: number;
    kSupplied: number;
    caSupplied: number;
    sSupplied: number;
    explanation: string;
  }[] = [];

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

    commercialItems.push({
      timing: 'Plantio',
      name: npkFert.name,
      chemicalFormula: npkFert.formulaChemical,
      guaranteeText: `${npkFert.nPercent}-${npkFert.p2o5Percent}-${npkFert.k2oPercent}${npkFert.sPercent ? ` + ${npkFert.sPercent}%S` : ''}${npkFert.caPercent ? ` + ${npkFert.caPercent}%Ca` : ''}`,
      doseKgHa: doseNpkHa,
      bags50kgHa: Number((doseNpkHa / 50).toFixed(1)),
      totalKg: Math.round(doseNpkHa * plotArea),
      totalBags50kg: Math.ceil((doseNpkHa * plotArea) / 50),
      bigBags1000kg: Number(((doseNpkHa * plotArea) / 1000).toFixed(1)),
      nSupplied: nFromNpk,
      pSupplied: pFromNpk,
      kSupplied: kFromNpk,
      caSupplied: caFromNpk,
      sSupplied: sFromNpk,
      explanation: `Atende 100% do Fósforo (${pFromNpk} kg/ha P₂O₅) e supre o arranque inicial de N e K.`
    });

    // B) Nitrogênio em Cobertura (descontando o que já veio do NPK de plantio)
    const nFaltaCob = Math.max(0, nDemanda - nFromNpk);
    if (nFaltaCob > 0) {
      const nFert = OFFICIAL_FERTILIZERS.find((f) => f.id === selectedTopNId) || OFFICIAL_FERTILIZERS.find((f) => f.id === 'fert-ureia')!;
      const nPercent = nFert.nPercent / 100 || 0.45;
      const doseNHa = Math.round(nFaltaCob / nPercent);
      const sFromN = Math.round(doseNHa * ((nFert.sPercent || 0) / 100));

      commercialItems.push({
        timing: 'Cobertura',
        name: nFert.name,
        chemicalFormula: nFert.formulaChemical,
        guaranteeText: `${nFert.nPercent}% N${nFert.sPercent ? ` + ${nFert.sPercent}% S` : ''}`,
        doseKgHa: doseNHa,
        bags50kgHa: Number((doseNHa / 50).toFixed(1)),
        totalKg: Math.round(doseNHa * plotArea),
        totalBags50kg: Math.ceil((doseNHa * plotArea) / 50),
        bigBags1000kg: Number(((doseNHa * plotArea) / 1000).toFixed(1)),
        nSupplied: nFaltaCob,
        pSupplied: 0,
        kSupplied: 0,
        caSupplied: 0,
        sSupplied: sFromN,
        explanation: `Complementa a exigência vegetativa de Nitrogênio (${nFaltaCob} kg/ha de N).`
      });
    }

    // C) Potássio em Cobertura (descontando o que veio do NPK de plantio)
    const kFaltaCob = Math.max(0, kDemanda - kFromNpk);
    if (kFaltaCob > 5) {
      const kFert = OFFICIAL_FERTILIZERS.find((f) => f.id === selectedTopKId) || OFFICIAL_FERTILIZERS.find((f) => f.id === 'fert-kcl')!;
      const kPercent = kFert.k2oPercent / 100 || 0.60;
      const doseKHa = Math.round(kFaltaCob / kPercent);
      const sFromK = Math.round(doseKHa * ((kFert.sPercent || 0) / 100));

      commercialItems.push({
        timing: 'Cobertura',
        name: kFert.name,
        chemicalFormula: kFert.formulaChemical,
        guaranteeText: `${kFert.k2oPercent}% K₂O${kFert.sPercent ? ` + ${kFert.sPercent}% S` : ''}`,
        doseKgHa: doseKHa,
        bags50kgHa: Number((doseKHa / 50).toFixed(1)),
        totalKg: Math.round(doseKHa * plotArea),
        totalBags50kg: Math.ceil((doseKHa * plotArea) / 50),
        bigBags1000kg: Number(((doseKHa * plotArea) / 1000).toFixed(1)),
        nSupplied: 0,
        pSupplied: 0,
        kSupplied: kFaltaCob,
        caSupplied: 0,
        sSupplied: sFromK,
        explanation: `Suprimento potássico para enchimento de grãos/frutos (${kFaltaCob} kg/ha de K₂O).`
      });
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

    commercialItems.push({
      timing: 'Plantio',
      name: pFert.name,
      chemicalFormula: pFert.formulaChemical,
      guaranteeText: `${pFert.p2o5Percent}% P₂O₅${pFert.nPercent ? ` + ${pFert.nPercent}% N` : ''}${pFert.sPercent ? ` + ${pFert.sPercent}% S` : ''}${pFert.caPercent ? ` + ${pFert.caPercent}% Ca` : ''}`,
      doseKgHa: dosePHa,
      bags50kgHa: Number((dosePHa / 50).toFixed(1)),
      totalKg: Math.round(dosePHa * plotArea),
      totalBags50kg: Math.ceil((dosePHa * plotArea) / 50),
      bigBags1000kg: Number(((dosePHa * plotArea) / 1000).toFixed(1)),
      nSupplied: nFromP,
      pSupplied: pFromP,
      kSupplied: 0,
      caSupplied: caFromP,
      sSupplied: sFromP,
      explanation: `Fornece ${pFromP} kg/ha de P₂O₅ solúvel no sulco de plantio.`
    });

    // B) Nitrogênio Total (descontando o que veio do MAP/DAP se houver)
    const nFalta = Math.max(0, nDemanda - nFromP);
    if (nFalta > 0) {
      const nFert = OFFICIAL_FERTILIZERS.find((f) => f.id === selectedSimpleNId) || OFFICIAL_FERTILIZERS.find((f) => f.id === 'fert-ureia')!;
      const nPerc = nFert.nPercent / 100 || 0.45;
      const doseNHa = Math.round(nFalta / nPerc);
      const sFromN = Math.round(doseNHa * ((nFert.sPercent || 0) / 100));

      commercialItems.push({
        timing: 'Cobertura',
        name: nFert.name,
        chemicalFormula: nFert.formulaChemical,
        guaranteeText: `${nFert.nPercent}% N${nFert.sPercent ? ` + ${nFert.sPercent}% S` : ''}`,
        doseKgHa: doseNHa,
        bags50kgHa: Number((doseNHa / 50).toFixed(1)),
        totalKg: Math.round(doseNHa * plotArea),
        totalBags50kg: Math.ceil((doseNHa * plotArea) / 50),
        bigBags1000kg: Number(((doseNHa * plotArea) / 1000).toFixed(1)),
        nSupplied: nFalta,
        pSupplied: 0,
        kSupplied: 0,
        caSupplied: 0,
        sSupplied: sFromN,
        explanation: `Aplicação parcelada em estádios de maior absorção foliar.`
      });
    }

    // C) Potássio Total
    if (kDemanda > 0) {
      const kFert = OFFICIAL_FERTILIZERS.find((f) => f.id === selectedSimpleKId) || OFFICIAL_FERTILIZERS.find((f) => f.id === 'fert-kcl')!;
      const kPerc = kFert.k2oPercent / 100 || 0.60;
      const doseKHa = Math.round(kDemanda / kPerc);
      const sFromK = Math.round(doseKHa * ((kFert.sPercent || 0) / 100));

      commercialItems.push({
        timing: kCobAlvo > 0 ? 'Cobertura' : 'Plantio',
        name: kFert.name,
        chemicalFormula: kFert.formulaChemical,
        guaranteeText: `${kFert.k2oPercent}% K₂O${kFert.sPercent ? ` + ${kFert.sPercent}% S` : ''}`,
        doseKgHa: doseKHa,
        bags50kgHa: Number((doseKHa / 50).toFixed(1)),
        totalKg: Math.round(doseKHa * plotArea),
        totalBags50kg: Math.ceil((doseKHa * plotArea) / 50),
        bigBags1000kg: Number(((doseKHa * plotArea) / 1000).toFixed(1)),
        nSupplied: 0,
        pSupplied: 0,
        kSupplied: kDemanda,
        caSupplied: 0,
        sSupplied: sFromK,
        explanation: `Atende os ${kDemanda} kg/ha de K₂O exigidos pela cultura.`
      });
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
              onChange={(e) => {
                setCrop(e.target.value);
                const opts = CROP_YIELD_TARGETS[e.target.value];
                if (opts && opts[1]) setSelectedYieldKey(opts[1].key);
                else if (opts && opts[0]) setSelectedYieldKey(opts[0].key);
              }}
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
            <span>Meta Produtividade: {currentYieldOption?.label.split('(')[0]}</span>
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

        {/* Tabela de Produtos Comerciais e Quantidades Calculadas */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
