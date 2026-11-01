import React, { useRef } from 'react';
import { SoilSample, Plot, Property, UserRole } from '../types';
import { calculateIndices, diagnoseAttributes, calculateLiming, calculateFertilization } from '../lib/agronomicEngine';
import {
  Printer,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sprout,
  QrCode,
  Calendar,
  Layers,
  MapPin
} from 'lucide-react';

interface ReportsViewProps {
  sample: SoilSample | null;
  plot: Plot | null;
  property: Property | null;
  currentRole: UserRole;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sample,
  plot,
  property,
  currentRole
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!sample) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
        <FileCheck2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900">Selecione uma análise para emitir o relatório</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          O laudo técnico consolida os dados do laudo, índices químicos, recomendação de calcário e formulação de NPK.
        </p>
      </div>
    );
  }

  const plotArea = plot?.areaHa || 25.0;
  const derived = calculateIndices(sample);
  const diagnostics = diagnoseAttributes(sample);
  const liming = calculateLiming(sample, plotArea, 60, 80, 20);
  const fertilization = calculateFertilization('milho', 'alta', sample, plotArea);

  const reportId = `FERTIVA-${sample.labReportNumber || 'DOC'}-2026`;
  const emissionDate = new Date().toLocaleDateString('pt-BR');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Barra Superior de Ações */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Emissão de Laudo Técnico & Relatório Agronômico</h2>
          <p className="text-xs text-gray-500">
            Documento auditável com memória de cálculo determinística e termo de apoio à decisão (CREA/CONFEA).
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-lg text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] flex items-center space-x-2 shadow-xs transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / Salvar como PDF</span>
        </button>
      </div>

      {/* DOCUMENTO DO LAUDO TÉCNICO OFICIAL FERTIVA (Formatado para tela e papel A4) */}
      <div
        ref={reportRef}
        className="bg-white p-8 sm:p-10 rounded-xl border border-gray-300 shadow-sm space-y-6 max-w-4xl mx-auto print:p-0 print:border-none print:shadow-none"
      >
        {/* Cabeçalho do Laudo */}
        <div className="border-b-2 border-[#173F2B] pb-4 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-[#173F2B] flex items-center justify-center text-white">
              <Sprout className="w-7 h-7 text-[#8BC34A]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#173F2B]">FERTIVA</h1>
              <p className="text-xs font-semibold text-gray-600">Inteligência em Fertilidade do Solo • Relatório Agronômico</p>
              <p className="text-[11px] text-gray-400">Solo bem nutrido. Produção mais forte.</p>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="font-mono font-bold text-gray-900 block">{reportId}</span>
            <span className="text-gray-500 block">Emitido em: {emissionDate}</span>
            <span className="text-emerald-700 font-semibold block">Versão do Snapshot: 1.0</span>
          </div>
        </div>

        {/* Identificação Cadastral */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-lg border border-gray-200 text-xs">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Propriedade:</span>
            <span className="font-bold text-gray-900">{property?.name || sample.propertyName}</span>
            <span className="text-gray-500 block text-[11px]">{property?.city || 'Eunápolis'} - BA</span>
          </div>

          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Talhão / Área:</span>
            <span className="font-bold text-gray-900">{plot?.name || sample.plotName}</span>
            <span className="text-gray-500 block text-[11px]">{plotArea} hectares</span>
          </div>

          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Laudo Laboratório:</span>
            <span className="font-bold text-gray-900">{sample.labReportNumber}</span>
            <span className="text-gray-500 block text-[11px]">{sample.labName}</span>
          </div>

          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Amostragem:</span>
            <span className="font-bold text-gray-900">Camada {sample.depthStartCm}-{sample.depthEndCm} cm</span>
            <span className="text-gray-500 block text-[11px]">Data: {sample.sampleDate}</span>
          </div>
        </div>

        {/* 1. Diagnóstico Químico e Classificação Analítica */}
        <div>
          <h3 className="text-xs font-bold text-[#173F2B] uppercase tracking-wider mb-2 border-b pb-1">
            1. Diagnóstico Químico do Solo (Fonte: CFSEMG 5ª Aproximação / Embrapa)
          </h3>
          <table className="w-full text-xs text-left border border-gray-200">
            <thead className="bg-gray-100 font-bold text-[10px] text-gray-700 uppercase">
              <tr>
                <th className="p-2 border-b">Atributo</th>
                <th className="p-2 border-b">Teor</th>
                <th className="p-2 border-b">Unidade</th>
                <th className="p-2 border-b">Classificação</th>
                <th className="p-2 border-b">Faixa Adequada</th>
                <th className="p-2 border-b">Extrator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {diagnostics.map((d) => (
                <tr key={d.attribute} className="text-gray-800">
                  <td className="p-2 font-semibold">{d.label}</td>
                  <td className="p-2 font-bold">{d.value}</td>
                  <td className="p-2 text-gray-500">{d.unit || '-'}</td>
                  <td className="p-2 font-semibold">{d.classLabel}</td>
                  <td className="p-2 text-gray-600">{d.referenceRange}</td>
                  <td className="p-2 text-gray-500 text-[10px]">{d.method}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Índices Derivados */}
          <div className="grid grid-cols-4 gap-2 mt-2 text-center text-xs bg-gray-50 p-2 rounded border border-gray-200">
            <div><strong>Soma de Bases (SB):</strong> {derived.sb.toFixed(2)} cmol</div>
            <div><strong>CTC Efetiva (t):</strong> {derived.ctcEffective.toFixed(2)} cmol</div>
            <div><strong>CTC a pH 7 (T):</strong> {derived.ctcPh7?.toFixed(2)} cmol</div>
            <div><strong>Saturação Bases (V%):</strong> {derived.vPercent?.toFixed(1)}%</div>
          </div>
        </div>

        {/* 2. Recomendação de Calagem com Memória de Cálculo */}
        <div>
          <h3 className="text-xs font-bold text-[#173F2B] uppercase tracking-wider mb-2 border-b pb-1">
            2. Recomendação de Calagem (Método da Saturação por Bases)
          </h3>
          <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-200 text-xs space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-gray-900 text-sm">
                Dose Recomendada: {liming.doseTonHa} t/ha de calcário (PRNT {liming.prnt}%)
              </span>
              <span className="font-bold text-[#173F2B] text-sm">
                Total para a Área ({plotArea} ha): {liming.totalTon} toneladas
              </span>
            </div>
            <div className="font-mono text-[11px] text-gray-700 bg-white p-2.5 rounded border border-gray-200">
              <p className="font-bold">Memória de cálculo:</p>
              {liming.steps.slice(0, 4).map((s, i) => (
                <p key={i}>{s}</p>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Plano de Adubação Comercial Sugerido */}
        <div>
          <h3 className="text-xs font-bold text-[#173F2B] uppercase tracking-wider mb-2 border-b pb-1">
            3. Plano de Adubação & Nutrição (Cultura: {fertilization.crop} - {fertilization.yieldGoal})
          </h3>
          <table className="w-full text-xs text-left border border-gray-200">
            <thead className="bg-gray-100 font-bold text-[10px] text-gray-700 uppercase">
              <tr>
                <th className="p-2 border-b">Aplicação</th>
                <th className="p-2 border-b">Fertilizante</th>
                <th className="p-2 border-b">Garantia</th>
                <th className="p-2 border-b">Dose (kg/ha)</th>
                <th className="p-2 border-b">Total Talhão ({plotArea} ha)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fertilization.commercialPlan.map((c, i) => (
                <tr key={i}>
                  <td className="p-2 font-bold">{c.timing}</td>
                  <td className="p-2 font-semibold text-gray-900">{c.fertilizerName}</td>
                  <td className="p-2 font-mono text-[10px] text-gray-600">{c.guarantee}</td>
                  <td className="p-2">{c.doseKgHa} kg/ha</td>
                  <td className="p-2 font-bold text-[#173F2B]">
                    {c.totalKg.toLocaleString('pt-BR')} kg ({Math.ceil(c.totalKg / 50)} sc 50kg)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Termo de Apoio à Decisão e Responsabilidade Agronômica (Requisito 17 da especificação) */}
        <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-300 text-[10px] text-gray-600 space-y-1 leading-relaxed">
          <p className="font-bold text-gray-900 uppercase">
            Nota Técnica de Responsabilidade & Apoio à Decisão (Seção 17):
          </p>
          <p>
            A <strong>Fertiva</strong> é uma plataforma digital de apoio à tomada de decisão agronômica. Os diagnósticos e recomendações emitidos baseiam-se exclusivamente nos dados laboratoriais fornecidos pelo usuário e em tabelas bibliográficas oficiais validadas.
          </p>
          <p>
            Esta recomendação não substitui a visita a campo e a validação por Engenheiro Agrônomo habilitado, a quem compete o acompanhamento da lavoura e a emissão da respectiva Anotação de Responsabilidade Técnica (ART) conforme as normas do sistema CONFEA/CREA.
          </p>
        </div>

        {/* Rodapé e Assinaturas */}
        <div className="pt-6 border-t flex items-end justify-between text-xs">
          <div>
            <div className="w-48 border-b border-gray-400 mb-1"></div>
            <p className="font-bold text-gray-800">Engenheiro(a) Agrônomo(a) Responsável</p>
            <p className="text-[10px] text-gray-500">CREA-BA • Visto / Assinatura</p>
          </div>

          <div className="text-right flex items-center space-x-3">
            <div className="text-[10px] text-gray-400">
              <p>Código de Autenticidade Digital:</p>
              <p className="font-mono text-gray-600">{reportId}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 border border-gray-300 flex items-center justify-center rounded">
              <QrCode className="w-8 h-8 text-gray-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
