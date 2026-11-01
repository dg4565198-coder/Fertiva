import React from 'react';
import { Property, Plot, SoilSample, UserAccount } from '../types';
import { calculateIndices } from '../lib/agronomicEngine';
import {
  MapPin,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Building,
  Plus,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface DashboardViewProps {
  properties: Property[];
  plots: Plot[];
  samples: SoilSample[];
  currentUser: UserAccount;
  onNavigate: (tab: NavTab) => void;
  onSelectSample: (sample: SoilSample) => void;
  onOpenAddFarm: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  properties,
  plots,
  samples,
  currentUser,
  onNavigate,
  onSelectSample,
  onOpenAddFarm
}) => {
  const totalArea = properties.reduce((acc, p) => acc + p.totalAreaHa, 0);

  // Calcula amostras com acidez ou pendências
  const samplesWithLimingNeed = samples.filter((s) => {
    const ind = calculateIndices(s);
    return ind.vPercent !== undefined && ind.vPercent < 50;
  });

  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas Personalizado com Ação Direta para o Produtor */}
      <div className="bg-gradient-to-r from-[#173F2B] via-[#1E4B35] to-[#2F7D32] text-white p-6 sm:p-7 rounded-2xl shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[#8BC34A] text-xs font-bold border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Painel do Produtor Rural & Agrônomo</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Bem-vindo(a), {currentUser.name}!
          </h2>
          <p className="text-xs text-gray-200 max-w-xl leading-relaxed">
            Diagnósticos químicos determinísticos e apoio ao planejamento de calagem, gessagem e adubação para lavouras na Bahia.
          </p>
        </div>

        {/* Botão em Destaque: CADASTRAR MINHA FAZENDA */}
        <div className="z-10 flex flex-wrap gap-2.5">
          <button
            onClick={onOpenAddFarm}
            className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#8BC34A] text-[#173F2B] hover:bg-white transition-all shadow-md flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Minha Fazenda</span>
          </button>
          <button
            onClick={() => onNavigate('soil-entry')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/15 text-white hover:bg-white/25 border border-white/20 transition-all flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#8BC34A]" />
            <span>Importar Laudo PDF</span>
          </button>
        </div>
      </div>

      {/* Cartões de Indicadores Gerais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs hover:border-[#2F7D32]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Propriedades</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#173F2B] flex items-center justify-center border border-emerald-100">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-gray-900">{properties.length}</span>
            <span className="text-xs text-gray-500 font-medium">fazendas ({totalArea.toFixed(0)} ha)</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Mapeadas na Bahia</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs hover:border-[#2F7D32]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Talhões Ativos</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2F7D32] flex items-center justify-center border border-emerald-100">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-gray-900">{plots.length}</span>
            <span className="text-xs text-gray-500 font-medium">áreas de manejo</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Milho, Café, Cacau, Pastagem</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs hover:border-[#2F7D32]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Laudos Analisados</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2F7D32] flex items-center justify-center border border-emerald-100">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-gray-900">{samples.length}</span>
            <span className="text-xs text-emerald-700 font-bold">100% Auditados</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Superfície e subsuperfície</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Calagem Pendente</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-600">{samplesWithLimingNeed.length}</span>
            <span className="text-xs text-gray-500 font-medium">áreas com V &lt; 50%</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Requerem correção com calcário</p>
        </div>
      </div>

      {/* Ações Rápidas em Cards Profissionais */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-xs">
        <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-4">
          Etapas do Planejamento Agronômico
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate('soil-entry')}
            className="p-5 rounded-xl border border-gray-200/80 hover:border-[#2F7D32] hover:bg-[#F8FAF8] transition-all text-left flex items-start space-x-3.5 group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-[#173F2B] text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet className="w-5 h-5 text-[#8BC34A]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#173F2B]">
                1. Entrada do Laudo de Solo
              </h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Envie o laudo em PDF com conferência assistida por OCR ou faça a digitação direta dos valores.
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('corrections')}
            className="p-5 rounded-xl border border-gray-200/80 hover:border-[#2F7D32] hover:bg-[#F8FAF8] transition-all text-left flex items-start space-x-3.5 group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-[#2F7D32] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#2F7D32]">
                2. Correção: Calagem & Gessagem
              </h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Calcule a dose de calcário pelo V% e avalie critérios de cálcio e alumínio em subsuperfície (20-40 cm).
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('fertilization')}
            className="p-5 rounded-xl border border-gray-200/80 hover:border-[#8A5A22] hover:bg-[#F8FAF8] transition-all text-left flex items-start space-x-3.5 group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-[#8A5A22] text-white flex items-center justify-center shrink-0 shadow-xs">
              <TrendingUp className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#8A5A22]">
                3. Adubação & Nutrição
              </h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Recomendações para milho, café, cacau e pastagens com doses convertidas em sacos de adubo comercial.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Lista de Análises Recentes */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Análises de Solo Cadastradas
            </h3>
            <p className="text-xs text-gray-500">
              {samples.length > 0
                ? 'Clique para acessar a memória de cálculo agronômico e o diagnóstico completo.'
                : 'Nenhum laudo cadastrado no momento.'}
            </p>
          </div>
          {samples.length > 0 && (
            <button
              onClick={() => onNavigate('soil-entry')}
              className="text-xs font-bold text-[#2F7D32] hover:text-[#173F2B] flex items-center space-x-1"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {samples.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#173F2B] flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">Nenhum laudo laboratorial inserido ainda</h4>
              <p className="text-xs text-gray-500 mt-0.5 max-w-md mx-auto">
                Para começar, importe o arquivo PDF do laudo do seu laboratório ou digite os resultados químicos manualmente.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('soil-entry')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-xs inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4 text-[#8BC34A]" />
                <span>Cadastrar Primeiro Laudo</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {samples.map((sample) => {
              const ind = calculateIndices(sample);
              const isSub = sample.depthStartCm >= 20;

              return (
                <div
                  key={sample.id}
                  onClick={() => {
                    onSelectSample(sample);
                    onNavigate('interpretation');
                  }}
                  className="p-4 sm:px-6 hover:bg-gray-50/80 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-gray-900">
                        {sample.plotName}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSub ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Camada {sample.depthStartCm}-{sample.depthEndCm} cm
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {sample.propertyName} • Laudo: {sample.labReportNumber} ({sample.sampleDate})
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 text-xs">
                    <div className="text-right">
                      <span className="text-gray-400 block text-[10px]">pH H₂O</span>
                      <span className={`font-bold ${
                        (sample.phH2o ?? 7) < 5.0 ? 'text-red-600' : ((sample.phH2o ?? 7) < 6.0 ? 'text-amber-600' : 'text-emerald-700')
                      }`}>
                        {sample.phH2o?.toFixed(1) ?? 'N/A'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-gray-400 block text-[10px]">V% (Bases)</span>
                      <span className={`font-bold ${
                        (ind.vPercent ?? 100) < 50 ? 'text-red-600' : 'text-emerald-700'
                      }`}>
                        {ind.vPercent !== undefined ? `${ind.vPercent.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-gray-400 block text-[10px]">CTC a pH 7</span>
                      <span className="font-bold text-gray-800">
                        {ind.ctcPh7 ? `${ind.ctcPh7.toFixed(2)} cmol` : 'N/A'}
                      </span>
                    </div>

                    <div className="pl-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] shadow-2xs">
                        Ver Diagnóstico
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
