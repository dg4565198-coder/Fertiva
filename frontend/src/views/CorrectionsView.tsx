import React, { useState } from 'react';
import { SoilSample, Plot, TechnicalReference } from '../types';
import { calculateLiming, calculateGypsum, calculateIndices, getAllActiveCrops, getCropAgronomicRule } from '../lib/agronomicEngine';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  Calculator,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowRight,
  Sprout
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface CorrectionsViewProps {
  sample: SoilSample | null;
  subsurfaceSample: SoilSample | null;
  plot: Plot | null;
  references?: TechnicalReference[];
  onNavigate: (tab: NavTab) => void;
}

export const CorrectionsView: React.FC<CorrectionsViewProps> = ({
  sample,
  subsurfaceSample,
  plot,
  references,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'calagem' | 'gessagem'>('calagem');

  const availableCrops = getAllActiveCrops(references);
  const initialCrop = plot?.currentCrop || availableCrops[0] || 'Milho';
  const initialRule = getCropAgronomicRule(initialCrop, references).rule;

  // Parâmetros de Calagem
  const [selectedCropPreset, setSelectedCropPreset] = useState<string>(initialCrop);
  const [targetV, setTargetV] = useState<number>(initialRule.targetV || 60);
  const [prnt, setPrnt] = useState<number>(80);
  const [depthCm, setDepthCm] = useState<number>(20);
  const [applicationFactor, setApplicationFactor] = useState<number>(1.0);
  const [showMemory, setShowMemory] = useState<boolean>(true);

  const handleSelectCropPreset = (cropName: string) => {
    setSelectedCropPreset(cropName);
    const { rule } = getCropAgronomicRule(cropName, references);
    setTargetV(rule.targetV);
  };

  // Parâmetros de Gessagem
  const [cropType, setCropType] = useState<'anual' | 'perene'>('anual');
  const [clayPercent, setClayPercent] = useState<number>(sample?.clayPercent || 35);

  const plotArea = plot?.areaHa || 25.0;

  if (!sample) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
        <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900">Selecione uma análise de solo</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Para realizar os cálculos agronômicos de calagem e gessagem, selecione um talhão com análise cadastrada.
        </p>
      </div>
    );
  }

  // Execução determinística dos cálculos
  const limingResult = calculateLiming(sample, plotArea, targetV, prnt, depthCm, applicationFactor);
  const gypsumResult = calculateGypsum(!!subsurfaceSample, subsurfaceSample, plotArea, cropType, clayPercent);

  return (
    <div className="space-y-6">
      {/* Topo com Alternância entre Calagem e Gessagem */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-gray-900">Correção do Solo: Calagem & Gessagem</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Talhão: {plot?.name || sample.plotName} ({plotArea} ha) • Método 100% determinístico e auditável
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('calagem')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'calagem'
                ? 'bg-[#173F2B] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Calagem (Calcário)
          </button>
          <button
            onClick={() => setActiveTab('gessagem')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'gessagem'
                ? 'bg-[#173F2B] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Gessagem (Gesso Agrícola)
          </button>
        </div>
      </div>

      {/* ===================== ABA 1: CALAGEM ===================== */}
      {activeTab === 'calagem' && (
        <div className="space-y-6">
          {limingResult.isBlocked ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <h4 className="text-sm font-bold text-red-900">Cálculo de Calagem Bloqueado</h4>
              </div>
              <p className="text-xs text-red-800 mt-1">{limingResult.blockReason}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Painel Esquerdo: Parâmetros Configuráveis */}
              <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b pb-3">
                  <Sliders className="w-4 h-4 text-[#2F7D32]" />
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Parâmetros Agronômicos
                  </h3>
                </div>
                {/* Seletor Rápido de Cultura da Biblioteca */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center space-x-1">
                    <Sprout className="w-3.5 h-3.5 text-[#2F7D32]" />
                    <span>Cultura Meta (Regra dos Livros da Biblioteca)</span>
                  </label>
                  <select
                    value={selectedCropPreset}
                    onChange={(e) => handleSelectCropPreset(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-emerald-50/30 font-bold text-gray-900 focus:ring-1 focus:ring-[#2F7D32]"
                  >
                    {availableCrops.map((c) => (
                      <option key={c} value={c}>
                        🌱 {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Saturação por Bases Desejada (V2%) */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>Saturação Desejada (V₂%):</span>
                    <span className="text-[#2F7D32] font-bold">{targetV}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="80"
                    step="5"
                    value={targetV}
                    onChange={(e) => setTargetV(parseInt(e.target.value))}
                    className="w-full accent-[#2F7D32] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>Pastagens (45-50%)</span>
                    <span>Milho (60%)</span>
                    <span>Café/Cacau (70%)</span>
                  </div>
                </div>

                {/* PRNT do Corretivo */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>PRNT do Calcário:</span>
                    <span className="text-[#2F7D32] font-bold">{prnt}%</span>
                  </div>
                  <select
                    value={prnt}
                    onChange={(e) => setPrnt(parseInt(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#2F7D32]"
                  >
                    <option value="65">Calcário Padrão (PRNT 65%)</option>
                    <option value="75">Calcário Padrão (PRNT 75%)</option>
                    <option value="80">Calcário Intermediário (PRNT 80%)</option>
                    <option value="90">Calcário de Alta Reatividade (PRNT 90%)</option>
                    <option value="100">Calcário Fino / Filler (PRNT 100%)</option>
                  </select>
                </div>

                {/* Profundidade de Incorporação */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Profundidade de Incorporação
                  </label>
                  <select
                    value={depthCm}
                    onChange={(e) => setDepthCm(parseInt(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#2F7D32]"
                  >
                    <option value="20">0 a 20 cm (incorporação convencional com grade/arado)</option>
                    <option value="10">0 a 10 cm (plantio direto consolidado sem incorporação)</option>
                    <option value="30">0 a 30 cm (preparo profundo com subsolador)</option>
                  </select>
                </div>

                {/* Fator de Aplicação */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Modo de Distribuição
                  </label>
                  <select
                    value={applicationFactor}
                    onChange={(e) => setApplicationFactor(parseFloat(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#2F7D32]"
                  >
                    <option value="1.0">Área Total (f = 1,0)</option>
                    <option value="0.5">Em faixas na linha de plantio (f = 0,5)</option>
                    <option value="0.33">Em covas / coroamento perene (f = 0,33)</option>
                  </select>
                </div>
              </div>

              {/* Painel Direito: Resultados e Memória de Cálculo */}
              <div className="lg:col-span-8 space-y-4">
                {/* Cartão de Resultado da Dose */}
                <div className="bg-gradient-to-br from-[#173F2B] to-[#2F7D32] text-white rounded-xl p-6 shadow-sm">
                  <span className="text-xs font-semibold text-[#8BC34A] uppercase tracking-wider block">
                    Recomendação de Calagem (Método da Saturação por Bases)
                  </span>
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                    <div>
                      <span className="text-4xl font-extrabold">{limingResult.doseTonHa}</span>
                      <span className="text-lg font-normal ml-2">toneladas / hectare</span>
                      <p className="text-xs text-gray-200 mt-1">
                        Dose calculada para elevar a saturação de {limingResult.currentV.toFixed(1)}% para {targetV}%
                      </p>
                    </div>

                    <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/20 text-right">
                      <span className="text-[11px] text-gray-300 uppercase block">Total do Talhão ({plotArea} ha)</span>
                      <span className="text-2xl font-bold text-white">{limingResult.totalTon}</span>
                      <span className="text-xs text-gray-200 block">toneladas de calcário</span>
                    </div>
                  </div>
                </div>

                {/* Memória de Cálculo Transparente e Rastreável (Requisito 6.5 e 7) */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
                  <button
                    onClick={() => setShowMemory(!showMemory)}
                    className="w-full px-5 py-3.5 bg-gray-50 flex items-center justify-between text-left hover:bg-gray-100/80 transition-all"
                  >
                    <div className="flex items-center space-x-2">
                      <Calculator className="w-4 h-4 text-[#2F7D32]" />
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                        Memória de Cálculo Agronômico Passo a Passo
                      </span>
                    </div>
                    {showMemory ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>

                  {showMemory && (
                    <div className="p-5 space-y-3 font-mono text-xs text-gray-700 bg-white">
                      <div className="p-2.5 bg-gray-100 rounded text-gray-900 font-bold">
                        Fórmula: {limingResult.formula}
                      </div>
                      <div className="space-y-1.5 pl-1">
                        {limingResult.steps.map((st, idx) => (
                          <div key={idx} className="leading-relaxed">
                            {st}
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t text-[11px] text-gray-400 font-sans">
                        Fonte da Regra: {limingResult.source} • Versão da regra: 1.0 (CFSEMG / Embrapa)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== ABA 2: GESSAGEM ===================== */}
      {activeTab === 'gessagem' && (
        <div className="space-y-6">
          {/* Validação Mandatória de Subsuperfície (Requisito 6.6 da especificação) */}
          {!subsurfaceSample ? (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-6 space-y-3">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-amber-900 uppercase">
                    Análise da Camada Subsuperficial (20 a 40 cm) Obrigatória
                  </h3>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Em estrita conformidade com o <strong>Princípio Central e Requisito 6.6 da Especificação Fertiva</strong>, o gesso agrícola NÃO pode ser recomendado com base apenas na análise superficial (0-20 cm).
                  </p>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    O gesso atua como condicionador de subsuperfície, fornecendo cálcio e neutralizando o alumínio tóxico nas camadas profundas para permitir o enraizamento. Para liberar este cálculo, cadastre a amostra coletada entre 20 e 40 cm.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Coluna Esquerda: Critérios Avaliados */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-2">
                  Critérios de Subsuperfície (20-40 cm)
                </h3>
                <p className="text-xs text-gray-500">
                  Referência: Embrapa Cerrados (Sousa & Lobato) e CFSEMG. Se pelo menos um critério for atendido, há indicação técnica de gessagem.
                </p>

                <div className="space-y-2">
                  {gypsumResult.metCriteria.map((c, idx) => (
                    <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </div>
                  ))}

                  {gypsumResult.unmetCriteria.map((c, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Cultura</label>
                    <select
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value as any)}
                      className="w-full text-xs p-2 rounded-lg border border-gray-300"
                    >
                      <option value="anual">Cultura Anual (Milho, Soja, etc. - Fator 50)</option>
                      <option value="perene">Cultura Perene (Café, Cacau, Eucalipto - Fator 60)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Coluna Direita: Recomendação */}
              <div className="lg:col-span-7 space-y-4">
                <div className={`p-6 rounded-xl border shadow-sm ${
                  gypsumResult.isRecommended
                    ? 'bg-gradient-to-br from-[#8A5A22] to-[#B07632] text-white border-[#8A5A22]'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                }`}>
                  <span className="text-xs font-semibold uppercase tracking-wider block">
                    {gypsumResult.isRecommended ? 'Gessagem Recomendada' : 'Gessagem Dispensada'}
                  </span>

                  <div className="mt-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                    <div>
                      <span className="text-4xl font-extrabold">{gypsumResult.doseTonHa}</span>
                      <span className="text-lg font-normal ml-2">toneladas / hectare</span>
                      <p className="text-xs mt-1 opacity-90">
                        {gypsumResult.isRecommended
                          ? `Fórmula: NG (kg/ha) = ${cropType === 'perene' ? 60 : 50} × Argila(%)`
                          : 'Camada subsuperficial sem fatores limitantes ao enraizamento.'}
                      </p>
                    </div>

                    {gypsumResult.isRecommended && (
                      <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/20 text-right">
                        <span className="text-[11px] uppercase block">Total do Talhão ({plotArea} ha)</span>
                        <span className="text-2xl font-bold">{gypsumResult.totalTon}</span>
                        <span className="text-xs block">toneladas de gesso</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 text-xs space-y-2">
                  <h4 className="font-bold text-gray-800 uppercase text-[11px]">Observações Agronômicas</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {gypsumResult.limitations.map((lim, idx) => (
                      <li key={idx}>{lim}</li>
                    ))}
                    <li>Aplicar o gesso a lanço em área total. Não há necessidade de incorporação mecânica (o sulfato de cálcio possui alta solubilidade e mobilidade no perfil do solo).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Próximo Passo: Adubação e Nutrição */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
        <span className="text-xs text-gray-600 font-medium">
          Correção de acidez concluída. Prossiga para o cálculo de adubação e formulação de NPK.
        </span>
        <button
          onClick={() => onNavigate('fertilization')}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#2F7D32] text-white hover:bg-[#173F2B] flex items-center space-x-1.5 transition-all"
        >
          <span>Ir para Adubação & Nutrição</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
