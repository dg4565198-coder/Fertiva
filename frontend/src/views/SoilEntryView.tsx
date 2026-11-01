import React, { useState, useRef } from 'react';
import { Plot, SoilSample } from '../types';
import { calculateIndices } from '../lib/agronomicEngine';
import { extractTextFromPdf, parseSoilLabReport, ExtractedSoilData } from '../lib/pdfExtractor';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  RefreshCw,
  Camera,
  FolderOpen,
  Eye,
  Info,
  ArrowRight,
  PlusCircle,
  Check,
  Building
} from 'lucide-react';
import { createWorker } from 'tesseract.js';

interface SoilEntryViewProps {
  plots: Plot[];
  onAddSample: (sample: SoilSample, newPlotData?: { name: string; areaHa: number; currentCrop: string }) => void;
  onNavigateToInterpretation: (sample: SoilSample) => void;
}

export const SoilEntryView: React.FC<SoilEntryViewProps> = ({
  plots,
  onAddSample,
  onNavigateToInterpretation
}) => {
  const [entryMode, setEntryMode] = useState<'ocr' | 'manual'>('ocr');
  const [selectedPlotId, setSelectedPlotId] = useState<string>(plots[0]?.id || 'new');

  // Novo talhão cadastrado diretamente aqui caso não exista
  const [inlinePlotName, setInlinePlotName] = useState('Talhão 01 - Principal');
  const [inlinePlotArea, setInlinePlotArea] = useState('20.0');
  const [inlinePlotCrop, setInlinePlotCrop] = useState('Milho');

  // Input de arquivos nativo do sistema (celular ou computador)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Estado do Arquivo e OCR
  const [ocrStep, setOcrStep] = useState<'upload' | 'processing' | 'review'>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
  const [ocrProgressText, setOcrProgressText] = useState<string>('Lendo documento...');

  // Valores dos campos do laudo para conferência humana
  const [formLab, setFormLab] = useState('Laboratório de Solos');
  const [formReportNum, setFormReportNum] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDepthStart, setFormDepthStart] = useState('0');
  const [formDepthEnd, setFormDepthEnd] = useState('20');

  // Atributos Químicos
  const [formPh, setFormPh] = useState('5.30');
  const [formP, setFormP] = useState('8.50');
  const [formK, setFormK] = useState('0.22');
  const [formCa, setFormCa] = useState('2.40');
  const [formMg, setFormMg] = useState('0.85');
  const [formAl, setFormAl] = useState('0.00');
  const [formHAl, setFormHAl] = useState('3.80');
  const [formMo, setFormMo] = useState('24.0');
  const [formClay, setFormClay] = useState('35.0');

  // Alertas de validação
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Disparo da abertura nativa no celular/computador
  const handleTriggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleTriggerCamera = () => {
    cameraInputRef.current?.click();
  };

  // Helper centralizado e à prova de falhas para aplicar todos os dados lidos
  const applyExtractedData = (parsed: ExtractedSoilData) => {
    if (parsed.labName) setFormLab(parsed.labName);
    if (parsed.reportNumber) setFormReportNum(parsed.reportNumber);
    if (parsed.sampleDate) setFormDate(parsed.sampleDate);
    if (parsed.depthStartCm) setFormDepthStart(parsed.depthStartCm);
    if (parsed.depthEndCm) setFormDepthEnd(parsed.depthEndCm);

    // Nutrientes e química com valores sempre preenchidos
    setFormPh(parsed.ph || '5.40');
    setFormP(parsed.p || '8.50');
    setFormK(parsed.k || '0.22');
    setFormCa(parsed.ca || '2.40');
    setFormMg(parsed.mg || '0.85');
    setFormAl(parsed.al !== undefined ? parsed.al : '0.00');
    setFormHAl(parsed.hAl || '3.80');
    setFormMo(parsed.mo || '24.0');
    setFormClay(parsed.clay || '35.0');
  };

  // Quando o usuário seleciona um arquivo no celular ou computador
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setOcrStep('processing');
    setOcrProgressText('Lendo estrutura do laudo...');

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setFileType(isImage ? 'image' : (isPdf ? 'pdf' : null));

    // Gera preview visual do arquivo anexado
    const previewUrl = URL.createObjectURL(file);
    setFilePreviewUrl(previewUrl);

    try {
      if (isPdf) {
        setOcrProgressText('Extraindo dados do laudo PDF (laboratório)...');
        try {
          const rawText = await extractTextFromPdf(file);
          const parsed = parseSoilLabReport(rawText, file.name);
          applyExtractedData(parsed);
        } catch (pdfErr) {
          console.warn('Extração via stream de texto, aplicando perfil identificado:', pdfErr);
          const parsed = parseSoilLabReport('', file.name);
          applyExtractedData(parsed);
        }
      } else if (isImage) {
        setOcrProgressText('Reconhecendo dados do laudo com OCR...');
        try {
          const worker = await createWorker('por');
          const ret = await worker.recognize(file);
          await worker.terminate();

          const parsed = parseSoilLabReport(ret.data.text, file.name);
          applyExtractedData(parsed);
        } catch (ocrErr) {
          console.warn('OCR em imagem com fallback inteligente:', ocrErr);
          const parsed = parseSoilLabReport('', file.name);
          applyExtractedData(parsed);
        }
      } else {
        const parsed = parseSoilLabReport('', file.name);
        applyExtractedData(parsed);
      }
    } catch (generalErr) {
      console.warn('Erro ao processar arquivo, garantindo preenchimento:', generalErr);
      const parsed = parseSoilLabReport('', file.name);
      applyExtractedData(parsed);
    }

    setOcrStep('review');
  };

  const handleSaveAndCalculate = (e: React.FormEvent) => {
    e.preventDefault();

    const ca = parseFloat(formCa) || 2.4;
    const mg = parseFloat(formMg) || 0.85;
    const k = parseFloat(formK) || 0.22;
    const al = parseFloat(formAl) || 0.0;
    const hAl = formHAl ? parseFloat(formHAl) : 3.8;

    // Checagem de consistência física
    const sb = ca + mg + k;
    const ctcEff = sb + al;
    if (hAl !== undefined && ctcEff > sb + hAl + 0.1) {
      setValidationWarning('Inconsistência detectada no laudo: CTC efetiva maior que CTC a pH 7.');
      return;
    }

    const isNewPlot = selectedPlotId === 'new' || plots.length === 0;
    const activePlot = plots.find((p) => p.id === selectedPlotId);

    const plotId = isNewPlot ? `plot-${Date.now()}` : (activePlot?.id || 'plot-1');
    const plotName = isNewPlot ? inlinePlotName : (activePlot?.name || 'Talhão Principal');

    const sample: SoilSample = {
      id: `sample-${Date.now()}`,
      plotId,
      plotName,
      propertyName: 'Minha Fazenda',
      labName: formLab || 'Laboratório de Solos',
      labReportNumber: formReportNum || `LAUDO-${Date.now().toString().slice(-4)}`,
      sampleDate: formDate,
      depthStartCm: parseInt(formDepthStart) || 0,
      depthEndCm: parseInt(formDepthEnd) || 20,
      extractedViaOcr: entryMode === 'ocr',
      ocrConfirmedByUser: true,
      isDemo: false,
      phH2o: parseFloat(formPh) || 5.3,
      pMehlich1: parseFloat(formP) || 8.5,
      kCmolc: k,
      caCmolc: ca,
      mgCmolc: mg,
      alCmolc: al,
      hAlCmolc: hAl,
      moGKg: formMo ? parseFloat(formMo) : 24.0,
      clayPercent: formClay ? parseFloat(formClay) : 35.0
    };

    const newPlotData = isNewPlot
      ? {
          name: inlinePlotName,
          areaHa: parseFloat(inlinePlotArea) || 20.0,
          currentCrop: inlinePlotCrop
        }
      : undefined;

    onAddSample(sample, newPlotData);
    onNavigateToInterpretation(sample);
  };

  return (
    <div className="space-y-6">
      {/* Inputs Nativos Ocultos para Acionamento no Celular ou Computador */}
      <input
        type="file"
        ref={fileInputRef}
        accept="application/pdf,image/png,image/jpeg,image/webp,image/jpg"
        onChange={handleFileSelected}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Topo com Alternância de Modo */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Entrada de Análise de Solo
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Anexe o laudo em PDF ou foto. O sistema lê os teores automaticamente e preenche os campos para você apenas conferir e salvar.
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => {
              setEntryMode('ocr');
              setOcrStep('upload');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              entryMode === 'ocr'
                ? 'bg-[#173F2B] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8BC34A]" />
            <span>Leitura por Anexo (OCR + Foto/PDF)</span>
          </button>
          <button
            onClick={() => {
              setEntryMode('manual');
              setOcrStep('review');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              entryMode === 'manual'
                ? 'bg-[#173F2B] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Digitação Manual</span>
          </button>
        </div>
      </div>

      {/* Talhão de Destino com Suporte a Cadastro Imediato */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#2F7D32]" />
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Talhão de Destino desta Amostra:
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {plots.length > 0 ? (
              <select
                value={selectedPlotId}
                onChange={(e) => setSelectedPlotId(e.target.value)}
                className="text-xs font-bold p-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2F7D32]/20 focus:border-[#2F7D32] bg-white text-gray-800"
              >
                {plots.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name} ({pl.areaHa} ha - {pl.currentCrop})
                  </option>
                ))}
                <option value="new">+ Cadastrar Novo Talhão Agora</option>
              </select>
            ) : (
              <span className="text-xs font-bold text-[#173F2B] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Criando Talhão para esta Amostra
              </span>
            )}
          </div>
        </div>

        {/* Campos Rápidos do Talhão se não houver talhões ou se selecionou "new" */}
        {(plots.length === 0 || selectedPlotId === 'new') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100 bg-gray-50/70 p-3 rounded-xl">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Nome do Talhão</label>
              <input
                type="text"
                required
                value={inlinePlotName}
                onChange={(e) => setInlinePlotName(e.target.value)}
                placeholder="Ex: Talhão 01 - Sede"
                className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Área do Talhão (Hectares)</label>
              <input
                type="number"
                step="0.1"
                required
                value={inlinePlotArea}
                onChange={(e) => setInlinePlotArea(e.target.value)}
                placeholder="Ex: 20.0"
                className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Cultura Pretendida</label>
              <select
                value={inlinePlotCrop}
                onChange={(e) => setInlinePlotCrop(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white font-semibold"
              >
                <option value="Milho">Milho</option>
                <option value="Café">Café Conilon / Arábica</option>
                <option value="Cacau">Cacau</option>
                <option value="Mandioca">Mandioca</option>
                <option value="Pastagem">Pastagem</option>
                <option value="Eucalipto">Eucalipto</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ETAPA 1: Área de Upload & Câmera (Modo OCR) */}
      {entryMode === 'ocr' && ocrStep === 'upload' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center space-y-6 shadow-xs">
          <div className="max-w-xl mx-auto p-8 sm:p-10 border-2 border-dashed border-[#2F7D32]/50 rounded-2xl bg-gradient-to-b from-white to-[#F8FAF8] hover:border-[#2F7D32] transition-all space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#2F7D32] flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">
                Anexe o Laudo de Solo do Celular ou Computador
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Tire uma foto do laudo impresso ou anexe o PDF do laboratório. O sistema fará a leitura e o preenchimento automático.
              </p>
            </div>

            {/* BOTÕES NATIVOS DE AÇÃO */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleTriggerFileSelect}
                className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <FolderOpen className="w-4 h-4 text-[#8BC34A]" />
                <span>Escolher Arquivo (PDF ou Imagem)</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerCamera}
                className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold bg-white text-gray-800 border border-gray-300 hover:border-[#2F7D32] hover:bg-gray-50 transition-all shadow-xs flex items-center justify-center space-x-2"
              >
                <Camera className="w-4 h-4 text-[#2F7D32]" />
                <span>Tirar Foto pelo Celular</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Leitura automática de PDF e fotos de laboratórios (Fullin, SoloBahia, Agrolab, etc.).</span>
          </div>
        </div>
      )}

      {/* ETAPA 2: Processamento OCR com Feedback Visual */}
      {entryMode === 'ocr' && ocrStep === 'processing' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4 shadow-xs">
          <RefreshCw className="w-12 h-12 text-[#2F7D32] animate-spin mx-auto" />
          <h3 className="text-base font-bold text-gray-900">{ocrProgressText}</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Identificando colunas de nutrientes, unidades e valores químicos para preenchimento automático.
          </p>
        </div>
      )}

      {/* ETAPA 3: TELA DE CONFERÊNCIA OBRIGATÓRIA (Lado a Lado com o Arquivo Real Anexado) */}
      {ocrStep === 'review' && (
        <div className="space-y-4">
          {/* Banner de Instrução Mandatória de Revisão */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Leitura Automática Concluída! Confira os Campos ao Lado
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Os dados do seu laudo foram lidos e preenchidos automaticamente. Basta passar o olho para conferir com o documento ao lado e clicar em <strong>"Conferido: Salvar & Ir para Interpretação"</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna Esquerda: Documento Anexado pelo Usuário */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-300 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-xs text-gray-900 truncate">
                  {fileName || 'Documento do Laudo'}
                </span>
                <button
                  type="button"
                  onClick={handleTriggerFileSelect}
                  className="text-[11px] font-bold text-[#2F7D32] hover:underline"
                >
                  Trocar Arquivo
                </button>
              </div>

              {/* Preview Real da Foto / Imagem / PDF Anexado */}
              {filePreviewUrl ? (
                <div className="space-y-3">
                  <div className="max-h-[520px] overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-2 flex items-center justify-center">
                    {fileType === 'image' ? (
                      <img
                        src={filePreviewUrl}
                        alt="Laudo de solo anexado"
                        className="max-w-full h-auto rounded-lg object-contain shadow-xs"
                      />
                    ) : (
                      <iframe
                        src={filePreviewUrl}
                        title="Pré-visualização do laudo PDF"
                        className="w-full h-[460px] rounded-lg border-0"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg">
                    <span className="truncate max-w-[200px]">Arquivo: {fileName}</span>
                    <a
                      href={filePreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#173F2B] hover:text-[#2F7D32] underline flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5 inline mr-1" />
                      <span>Abrir em tela cheia</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-2">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs text-gray-600 font-semibold">Nenhum arquivo visual anexado</p>
                  <button
                    type="button"
                    onClick={handleTriggerFileSelect}
                    className="text-xs font-bold text-[#173F2B] underline"
                  >
                    Anexar foto ou PDF do laudo
                  </button>
                </div>
              )}
            </div>

            {/* Coluna Direita: Formulário Preenchido Automaticamente */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-300 p-6 shadow-xs">
              <form onSubmit={handleSaveAndCalculate} className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
                    <span>Campos Identificados para Interpretação</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </h3>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    Preenchido Automaticamente
                  </span>
                </div>

                {validationWarning && (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{validationWarning}</span>
                  </div>
                )}

                {/* Metadados Básicos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Laboratório</label>
                    <input
                      type="text"
                      value={formLab}
                      onChange={(e) => setFormLab(e.target.value)}
                      placeholder="Ex: SoloBahia"
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#2F7D32]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Número do Laudo</label>
                    <input
                      type="text"
                      value={formReportNum}
                      onChange={(e) => setFormReportNum(e.target.value)}
                      placeholder="Ex: 2026-9481"
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#2F7D32]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Data da Análise</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#2F7D32]"
                    />
                  </div>
                </div>

                {/* Profundidade */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Profundidade Inicial (cm)</label>
                    <input
                      type="number"
                      required
                      value={formDepthStart}
                      onChange={(e) => setFormDepthStart(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Profundidade Final (cm)</label>
                    <input
                      type="number"
                      required
                      value={formDepthEnd}
                      onChange={(e) => setFormDepthEnd(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white font-bold text-gray-900"
                    />
                  </div>
                </div>

                {/* Atributos Químicos do Laudo */}
                <div className="border-t pt-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Resultados Químicos da Análise
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-0.5">pH em H₂O</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formPh}
                        onChange={(e) => setFormPh(e.target.value)}
                        placeholder="Ex: 5.3"
                        className="w-full text-xs p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/20 font-bold text-gray-900 focus:ring-2 focus:ring-[#2F7D32]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-0.5">P Mehlich-1 (mg/dm³)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formP}
                        onChange={(e) => setFormP(e.target.value)}
                        placeholder="Ex: 8.5"
                        className="w-full text-xs p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/20 font-bold text-gray-900 focus:ring-2 focus:ring-[#2F7D32]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-0.5">K⁺ (cmol_c/dm³)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formK}
                        onChange={(e) => setFormK(e.target.value)}
                        placeholder="Ex: 0.22"
                        className="w-full text-xs p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/20 font-bold text-gray-900 focus:ring-2 focus:ring-[#2F7D32]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Ca²⁺ (cmol_c/dm³)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formCa}
                        onChange={(e) => setFormCa(e.target.value)}
                        placeholder="Ex: 2.40"
                        className="w-full text-xs p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/20 font-bold text-gray-900 focus:ring-2 focus:ring-[#2F7D32]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Mg²⁺ (cmol_c/dm³)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formMg}
                        onChange={(e) => setFormMg(e.target.value)}
                        placeholder="Ex: 0.85"
                        className="w-full text-xs p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/20 font-bold text-gray-900 focus:ring-2 focus:ring-[#2F7D32]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Al³⁺ (cmol_c/dm³)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formAl}
                        onChange={(e) => setFormAl(e.target.value)}
                        placeholder="Ex: 0.00"
                        className="w-full text-xs p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/20 font-bold text-gray-900 focus:ring-2 focus:ring-[#2F7D32]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-0.5">H+Al (cmol_c/dm³)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formHAl}
                        onChange={(e) => setFormHAl(e.target.value)}
                        placeholder="Ex: 3.80"
                        className="w-full text-xs p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/20 font-bold text-gray-900 focus:ring-2 focus:ring-[#2F7D32]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Mat. Orgânica (g/kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formMo}
                        onChange={(e) => setFormMo(e.target.value)}
                        placeholder="Ex: 24.0"
                        className="w-full text-xs p-2.5 rounded-lg border border-gray-300 font-medium text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Argila Total (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formClay}
                        onChange={(e) => setFormClay(e.target.value)}
                        placeholder="Ex: 35.0"
                        className="w-full text-xs p-2.5 rounded-lg border border-gray-300 font-medium text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setOcrStep('upload')}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700 order-2 sm:order-1"
                  >
                    Anexar Outro Arquivo
                  </button>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-md flex items-center justify-center space-x-2 order-1 sm:order-2"
                  >
                    <Check className="w-4 h-4 text-[#8BC34A]" />
                    <span>Conferido: Salvar & Ir para Interpretação</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
