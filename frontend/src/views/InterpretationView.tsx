import React, { useState } from 'react';
import { SoilSample, UserRole } from '../types';
import { calculateIndices, diagnoseAttributes } from '../lib/agronomicEngine';
import {
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Eye,
  Info,
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface InterpretationViewProps {
  sample: SoilSample | null;
  samplesList: SoilSample[];
  currentRole: UserRole;
  onSelectSample: (s: SoilSample) => void;
  onNavigate: (tab: NavTab) => void;
}

export const InterpretationView: React.FC<InterpretationViewProps> = ({
  sample,
  samplesList,
  currentRole,
  onSelectSample,
  onNavigate
}) => {
  // Controle de alternância entre Visão Produtor e Visão Profissional (Agrônomo)
  const [viewMode, setViewMode] = useState<'produtor' | 'profissional'>(
    currentRole === 'produtor' ? 'produtor' : 'profissional'
  );

  if (!sample) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900">Nenhum laudo selecionado</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Selecione uma análise de solo para visualizar o diagnóstico químico determinístico e os limites agronômicos.
        </p>
      </div>
    );
  }

  const derived = calculateIndices(sample);
  const diagnostics = diagnoseAttributes(sample);

  const currentIndex = samplesList.findIndex((s) => s.id === sample.id);
  const nextSample = currentIndex >= 0 && currentIndex < samplesList.length - 1 ? samplesList[currentIndex + 1] : null;

  // Verifica se há amostra de subsuperfície correspondente (20-40 cm) para o mesmo talhão
  const pairedSubsurface = sample.depthStartCm === 0
    ? samplesList.find((s) => s.plotId === sample.plotId && s.depthStartCm >= 20 && s.id !== sample.id)
    : null;

  return (
    <div className="space-y-6">
      {/* Topo com Seletor de Amostra e Alternador de Visão */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-gray-900">Diagnóstico & Interpretação da Fertilidade</h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              {sample.depthStartCm >= 20 ? 'Subsuperfície (20-40 cm)' : 'Camada Arável (0-20 cm)'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {sample.plotName} ({sample.depthStartCm}-{sample.depthEndCm} cm) • Laudo: {sample.labReportNumber} • Fonte: CFSEMG 5ª Aproximação / Embrapa
          </p>
        </div>

        {/* Alternância Dual (Produtor x Técnico) */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('produtor')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                viewMode === 'produtor'
                  ? 'bg-[#173F2B] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Visão Produtor</span>
            </button>
            <button
              onClick={() => setViewMode('profissional')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                viewMode === 'profissional'
                  ? 'bg-[#173F2B] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Visão Profissional (Agrônomo)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Fluxo Guiado entre Múltiplos Talhões / Profundidades */}
      {samplesList.length > 1 && (
        <div className="bg-gradient-to-r from-[#173F2B] to-[#24543B] text-white p-5 rounded-2xl shadow-sm space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base">🧭</span>
                <span className="text-xs font-black uppercase tracking-wider text-[#8BC34A]">
                  Fluxo Guiado por Talhão ({currentIndex + 1} de {samplesList.length})
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">
                Interpretando agora: <span className="text-[#8BC34A]">{sample.plotName}</span> ({sample.depthStartCm}-{sample.depthEndCm} cm)
              </h3>
            </div>

            {nextSample && (
              <button
                type="button"
                onClick={() => onSelectSample(nextSample)}
                className="px-4 py-2 rounded-xl text-xs font-black bg-[#8BC34A] text-[#173F2B] hover:bg-white transition-all shadow-md flex items-center space-x-1.5 self-start sm:self-auto shrink-0"
              >
                <span>Avançar para {nextSample.plotName} ({nextSample.depthStartCm}-{nextSample.depthEndCm} cm)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Seletores rápidos em pílula para todos os talhões/amostras do laudo */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
            {samplesList.map((s) => {
              const isActive = s.id === sample.id;
              const isSub = s.depthStartCm >= 20;

              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSample(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-white text-[#173F2B] shadow-sm ring-2 ring-[#8BC34A]'
                      : 'bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#2F7D32]' : 'bg-gray-400'}`}></span>
                  <span>{s.plotName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      isSub ? 'bg-blue-900/50 text-blue-200' : 'bg-emerald-900/50 text-emerald-200'
                    }`}
                  >
                    {s.depthStartCm}-{s.depthEndCm} cm
                  </span>
                </button>
              );
            })}
          </div>

          {pairedSubsurface && (
            <div className="text-[11px] text-emerald-100/90 flex items-center space-x-1.5 bg-black/20 p-2.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-[#8BC34A] shrink-0" />
              <span>
                Camada de subsuperfície <strong>20-40 cm</strong> detectada e vinculada a este talhão. Ela será usada automaticamente na aba de <strong>Calagem & Gessagem</strong>.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Avisos de consistência agronômica se houver */}
      {!derived.isConsistent && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <h4 className="text-xs font-bold text-red-900 uppercase">Alertas de Inconsistência Laboratorial</h4>
          </div>
          <ul className="text-xs text-red-800 list-disc list-inside mt-1 space-y-0.5">
            {derived.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Métricas Principais / Cátions e Capacidade de Troca (CTC) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <span className="text-[11px] font-semibold text-gray-500 uppercase block">Soma de Bases (SB)</span>
          <span className="text-xl font-bold text-gray-900">{derived.sb.toFixed(2)}</span>
          <span className="text-xs text-gray-400 block mt-0.5">cmol_c/dm³ (Ca+Mg+K)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <span className="text-[11px] font-semibold text-gray-500 uppercase block">CTC Efetiva (t)</span>
          <span className="text-xl font-bold text-gray-900">{derived.ctcEffective.toFixed(2)}</span>
          <span className="text-xs text-gray-400 block mt-0.5">cmol_c/dm³ (SB+Al)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <span className="text-[11px] font-semibold text-gray-500 uppercase block">CTC a pH 7,0 (T)</span>
          <span className="text-xl font-bold text-gray-900">{derived.ctcPh7 ? derived.ctcPh7.toFixed(2) : 'N/A'}</span>
          <span className="text-xs text-gray-400 block mt-0.5">cmol_c/dm³ [SB+(H+Al)]</span>
        </div>

        <div className={`p-4 rounded-xl border ${
          (derived.vPercent ?? 100) < 50
            ? 'bg-amber-50/70 border-amber-300'
            : 'bg-emerald-50/70 border-emerald-300'
        }`}>
          <span className="text-[11px] font-semibold text-gray-700 uppercase block">Saturação Bases (V%)</span>
          <span className={`text-xl font-bold ${
            (derived.vPercent ?? 100) < 50 ? 'text-amber-800' : 'text-emerald-800'
          }`}>
            {derived.vPercent !== undefined ? `${derived.vPercent.toFixed(1)}%` : 'N/A'}
          </span>
          <span className="text-xs text-gray-600 block mt-0.5">
            {(derived.vPercent ?? 100) < 50 ? 'Calagem recomendada' : 'Nível adequado'}
          </span>
        </div>
      </div>

      {/* VISÃO PRODUTOR: Semáforos e Cartões Acessíveis */}
      {viewMode === 'produtor' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Diagnóstico Simplificado de Fertilidade (Semáforo do Solo)
            </h3>
            <span className="text-xs text-gray-400">Verde: Ideal • Amarelo: Atenção • Vermelho: Crítico</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {diagnostics.map((diag) => {
              const badgeColors = {
                red: 'bg-red-100 text-red-800 border-red-300',
                amber: 'bg-amber-100 text-amber-800 border-amber-300',
                yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                green: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                blue: 'bg-blue-100 text-blue-800 border-blue-300'
              };

              return (
                <div key={diag.attribute} className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{diag.label}</h4>
                      <p className="text-lg font-extrabold text-gray-900 mt-1">
                        {diag.value} {diag.unit}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badgeColors[diag.color]}`}>
                      {diag.classLabel}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {diag.explanation}
                  </p>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Faixa ideal: {diag.referenceRange}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VISÃO TÉCNICA (AGRÔNOMOS & TÉCNICOS) */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs space-y-6 p-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">
              Quadro Técnico de Interpretação Analítica e Extratores
            </h3>
            <p className="text-xs text-gray-500">
              Métodos analíticos oficiais, limites agronômicos e classificação segundo a 5ª Aproximação CFSEMG / Embrapa Solos.
            </p>
          </div>

          {/* Tabela Técnica Completa */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-y border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Atributo</th>
                  <th className="p-3">Método / Extrator</th>
                  <th className="p-3">Teor Obtido</th>
                  <th className="p-3">Unidade</th>
                  <th className="p-3">Classe</th>
                  <th className="p-3">Faixa de Referência</th>
                  <th className="p-3">Fonte da Tabela</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {diagnostics.map((diag) => (
                  <tr key={diag.attribute} className="hover:bg-gray-50/60">
                    <td className="p-3 font-semibold text-gray-900">{diag.label}</td>
                    <td className="p-3 text-gray-500 font-mono text-[11px]">{diag.method}</td>
                    <td className="p-3 font-bold text-gray-900">{diag.value}</td>
                    <td className="p-3 text-gray-600">{diag.unit || '-'}</td>
                    <td className="p-3">
                      <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        diag.classLabel.includes('Muito Baixo') || diag.classLabel.includes('Baixo')
                          ? 'bg-amber-100 text-amber-800'
                          : (diag.classLabel.includes('Bom') ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800')
                      }`}>
                        {diag.classLabel}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{diag.referenceRange}</td>
                    <td className="p-3 text-gray-500 text-[11px]">{diag.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Relações Catiônicas de Equilíbrio */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Relações Catiônicas no Complexo de Troca
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <span className="text-gray-500 block">Relação Cálcio / Magnésio (Ca/Mg):</span>
                <span className="text-base font-bold text-gray-900">{derived.caMgRatio ?? 'N/A'}</span>
                <p className="text-[10px] text-gray-400 mt-0.5">Faixa de equilíbrio: 3.0 a 5.0</p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <span className="text-gray-500 block">Relação Cálcio / Potássio (Ca/K):</span>
                <span className="text-base font-bold text-gray-900">{derived.caKRatio ?? 'N/A'}</span>
                <p className="text-[10px] text-gray-400 mt-0.5">Faixa de equilíbrio: 10.0 a 30.0</p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <span className="text-gray-500 block">Relação Magnésio / Potássio (Mg/K):</span>
                <span className="text-base font-bold text-gray-900">{derived.mgKRatio ?? 'N/A'}</span>
                <p className="text-[10px] text-gray-400 mt-0.5">Faixa de equilíbrio: 2.0 a 6.0</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Próximo Passo: Direcionamento para Calagem e Gessagem OU Próximo Talhão */}
      <div className="bg-[#173F2B] text-white p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold">Diagnóstico Concluído: {sample.plotName} ({sample.depthStartCm}-{sample.depthEndCm} cm)</h3>
          <p className="text-xs text-gray-200 mt-0.5">
            Calcule as doses de calcário e gesso na aba de correções, ou avance para interpretar o próximo talhão deste laudo.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          {nextSample && (
            <button
              onClick={() => onSelectSample(nextSample)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-white/15 text-white hover:bg-white/25 transition-all flex items-center justify-center space-x-1.5 border border-white/20"
            >
              <span>Interpretar Próximo: {nextSample.plotName}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onNavigate('corrections')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black bg-[#8BC34A] text-[#173F2B] hover:bg-white transition-all flex items-center justify-center space-x-2 shadow-sm"
          >
            <span>Ir para Calagem & Gessagem</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
