import React, { useState } from 'react';
import { SoilSample, Plot, TechnicalReference } from '../types';
import { calculateFertilization, getAllActiveCrops } from '../lib/agronomicEngine';
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
  BookOpen
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface FertilizationViewProps {
  sample: SoilSample | null;
  plot: Plot | null;
  references?: TechnicalReference[];
  onNavigate: (tab: NavTab) => void;
}

export const FertilizationView: React.FC<FertilizationViewProps> = ({
  sample,
  plot,
  references,
  onNavigate
}) => {
  const availableCrops = getAllActiveCrops(references);
  const [crop, setCrop] = useState<string>(plot?.currentCrop || availableCrops[0] || 'Milho');
  const [yieldGoal, setYieldGoal] = useState<'baixa' | 'media' | 'alta'>('alta');

  const plotArea = plot?.areaHa || 25.0;

  if (!sample) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
        <Wheat className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900">Selecione uma análise de solo</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Para recomendar adubação de plantio e cobertura, selecione um talhão com laudo químico cadastrado.
        </p>
      </div>
    );
  }

  const plan = calculateFertilization(crop, yieldGoal, sample, plotArea, references);

  return (
    <div className="space-y-6">
      {/* Topo com Título e Seletor de Cultura */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-gray-900">Recomendação de Adubação & Nutrição</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Talhão: {plot?.name || sample.plotName} ({plotArea} ha)
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-[#2F7D32]" />
            <span>Literatura Base no Motor: <strong>{plan.source}</strong></span>
          </div>
        </div>

        {/* Filtros de Cultura e Produtividade */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
              Cultura Alvo ({availableCrops.length} disponíveis)
            </label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="text-xs font-semibold p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#2F7D32] bg-white font-bold text-gray-900"
            >
              {availableCrops.map((c) => (
                <option key={c} value={c}>
                  🌱 {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Meta de Produtividade</label>
            <select
              value={yieldGoal}
              onChange={(e) => setYieldGoal(e.target.value as any)}
              className="text-xs font-semibold p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#2F7D32]"
            >
              <option value="alta">Alta Produtividade (Manejo Tecnificado)</option>
              <option value="media">Média Produtividade</option>
              <option value="baixa">Baixa Produtividade / Subsistência</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumo da Demanda Pura de Nutrientes (N, P2O5, K2O) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Nitrogênio (N)</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">Plantio + Cobertura</span>
          </div>
          <div className="mt-3 flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold text-gray-900">{plan.nutrientsTotal.n}</span>
            <span className="text-xs text-gray-500 font-medium">kg/ha de N</span>
          </div>
          <div className="mt-2 pt-2 border-t text-[11px] text-gray-500 flex justify-between">
            <span>Plantio: {plan.planting.n} kg/ha</span>
            <span className="font-semibold text-blue-700">Cobertura: {plan.topdressing.n} kg/ha</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Fósforo (P₂O₅)</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">100% no Plantio</span>
          </div>
          <div className="mt-3 flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold text-gray-900">{plan.nutrientsTotal.p2o5}</span>
            <span className="text-xs text-gray-500 font-medium">kg/ha de P₂O₅</span>
          </div>
          <div className="mt-2 pt-2 border-t text-[11px] text-gray-500 flex justify-between">
            <span>Sulco de Plantio: {plan.planting.p2o5} kg/ha</span>
            <span>Teor solo: {sample.pMehlich1} mg/dm³</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Potássio (K₂O)</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Parcelado</span>
          </div>
          <div className="mt-3 flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold text-gray-900">{plan.nutrientsTotal.k2o}</span>
            <span className="text-xs text-gray-500 font-medium">kg/ha de K₂O</span>
          </div>
          <div className="mt-2 pt-2 border-t text-[11px] text-gray-500 flex justify-between">
            <span>Plantio: {plan.planting.k2o} kg/ha</span>
            <span className="font-semibold text-emerald-700">Cobertura: {plan.topdressing.k2o} kg/ha</span>
          </div>
        </div>
      </div>

      {/* Plano de Fertilizantes Comerciais (Conversão Verificável - Requisito 6.7) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Formulações Comerciais & Parcelamento Sugerido
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Cálculo baseado nas garantias registradas no MAPA. Quantidades calculadas para os {plotArea} hectares do talhão.
            </p>
          </div>
          <span className="text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded border">
            Fonte: {plan.source}
          </span>
        </div>

        {/* Tabela de Produtos Comerciais */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-y border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Momento / Aplicação</th>
                <th className="p-3">Adubo Comercial</th>
                <th className="p-3">Garantia</th>
                <th className="p-3">Dose (kg/ha)</th>
                <th className="p-3">Sacos de 50kg / ha</th>
                <th className="p-3">Total do Talhão ({plotArea} ha)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {plan.commercialPlan.map((item, idx) => {
                const sacosPorHa = (item.doseKgHa / 50).toFixed(1);
                const sacosTotal = Math.ceil(item.totalKg / 50);

                return (
                  <tr key={idx} className="hover:bg-gray-50/70">
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.timing === 'Plantio' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                      }`}>
                        {item.timing}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-gray-900">{item.fertilizerName}</td>
                    <td className="p-3 font-mono text-[11px] text-gray-600">{item.guarantee}</td>
                    <td className="p-3 font-semibold text-gray-900">{item.doseKgHa} kg/ha</td>
                    <td className="p-3 text-gray-700">{sacosPorHa} sc/ha</td>
                    <td className="p-3 font-bold text-[#173F2B]">
                      {item.totalKg.toLocaleString('pt-BR')} kg ({sacosTotal} sc)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Memória e Orientações de Manejo Agronômico */}
        <div className="bg-[#F8FAF8] p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
          <h4 className="font-bold text-[#173F2B] uppercase text-[11px] flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-[#2F7D32]" />
            <span>Memória de Cálculo & Instruções de Aplicação</span>
          </h4>
          <ul className="list-disc list-inside space-y-1 text-gray-600 text-[11px]">
            <li className="font-semibold text-emerald-900">
              📖 Publicação Técnica Vinculada: <u>{plan.source}</u>
            </li>
            {plan.memory.map((m, idx) => (
              <li key={idx}>{m}</li>
            ))}
            <li>Para adubação de cobertura, aplicar preferencialmente em solo úmido ou antecedendo previsões de chuva leve para evitar perdas por volatilização de amônia.</li>
            <li>Não misturar ureia com superfosfatos simples muito tempo antes da aplicação devido ao risco de higroscopicidade e empedramento.</li>
          </ul>
        </div>
      </div>

      {/* Próximo Passo: Emissão do Relatório Técnico */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
        <span className="text-xs text-gray-600 font-medium">
          Planejamento nutricional pronto. Emita o laudo técnico completo em PDF com assinatura e snapshot de auditoria.
        </span>
        <button
          onClick={() => onNavigate('reports')}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F2B] text-white hover:bg-[#2F7D32] flex items-center space-x-1.5 transition-all"
        >
          <span>Emitir Laudo Técnico em PDF</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
