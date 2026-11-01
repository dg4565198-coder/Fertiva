import React, { useState, useRef } from 'react';
import { Plot, SoilSample, TechnicalReference } from '../types';
import { getAllActiveCrops } from '../lib/agronomicEngine';
import { extractTextFromPdf, parseMultiSampleLabReport, ExtractedSampleRow } from '../lib/pdfExtractor';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  RefreshCw,
  Camera,
  FolderOpen,
  Eye,
  Check,
  Trash2,
  Plus,
  ArrowRight,
  Info,
  ChevronRight,
  FileCheck,
  Split
} from 'lucide-react';
import { createWorker } from 'tesseract.js';

interface SoilEntryViewProps {
  plots: Plot[];
  references?: TechnicalReference[];
  onAddSample: (sample: SoilSample, newPlotData?: { name: string; areaHa: number; currentCrop: string }) => void;
  onAddSamplesBatch?: (samples: SoilSample[], newPlots?: Plot[]) => void;
  onNavigateToInterpretation: (sample: SoilSample) => void;
}

export const SoilEntryView: React.FC<SoilEntryViewProps> = ({
  plots,
  references,
  onAddSample,
  onAddSamplesBatch,
  onNavigateToInterpretation
}) => {
  const availableCrops = getAllActiveCrops(references);
  const [entryMode, setEntryMode] = useState<'ocr' | 'manual'>('ocr');
  const [selectedPlotId, setSelectedPlotId] = useState<string>(plots[0]?.id || 'new');

  // Parâmetros rápidos de novos talhões que forem criados
  const [inlinePlotArea, setInlinePlotArea] = useState('20.0');
  const [inlinePlotCrop, setInlinePlotCrop] = useState(availableCrops[0] || 'Milho');

  // Input de arquivos nativo do sistema (celular ou computador)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Estado do Arquivo e OCR
  const [ocrStep, setOcrStep] = useState<'upload' | 'processing' | 'review'>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
  const [ocrProgressText, setOcrProgressText] = useState<string>('Lendo documento...');

  // Metadados do Laudo
  const [formLab, setFormLab] = useState('Fullin Laboratório de Análise Agronômica');
  const [formReportNum, setFormReportNum] = useState('');
  const [formClient, setFormClient] = useState('Produtor Rural');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  // Tabela de Amostras Identificadas (Múltiplos Talhões / Profundidades)
  const [samplesTable, setSamplesTable] = useState<ExtractedSampleRow[]>([]);
  const [selectedSampleIndexToStart, setSelectedSampleIndexToStart] = useState<number>(0);

  // Alertas de validação
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Disparo da abertura nativa no celular/computador
  const handleTriggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleTriggerCamera = () => {
    cameraInputRef.current?.click();
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

    let rawText = '';
    try {
      if (isPdf) {
        setOcrProgressText('Extraindo dados do laudo PDF (laboratório)...');
        try {
          rawText = await extractTextFromPdf(file);
        } catch (pdfErr) {
          console.warn('Erro ao extrair texto do PDF:', pdfErr);
        }
      } else if (isImage) {
        setOcrProgressText('Reconhecendo dados do laudo com OCR...');
        try {
          const worker = await createWorker('por');
          const ret = await worker.recognize(file);
          await worker.terminate();
          rawText = ret.data.text;
        } catch (ocrErr) {
          console.warn('Erro no OCR em imagem:', ocrErr);
        }
      }
    } catch (generalErr) {
      console.warn('Erro ao processar arquivo:', generalErr);
    }

    const multi = parseMultiSampleLabReport(rawText, file.name);
    if (multi.labName) setFormLab(multi.labName);
    if (multi.reportNumber) setFormReportNum(multi.reportNumber);
    if (multi.clientName) setFormClient(multi.clientName);
    if (multi.sampleDate) setFormDate(multi.sampleDate);

    setSamplesTable(multi.samples);
    setSelectedSampleIndexToStart(0);
    setOcrStep('review');
  };

  // Inicializa modo manual com 1 linha caso vazio
  const handleSwitchToManual = () => {
    setEntryMode('manual');
    if (samplesTable.length === 0) {
      setSamplesTable([
        {
          id: `sample-ext-${Date.now()}`,
          sampleCode: 'AMOSTRA-01',
          plotName: 'Talhão 01',
          depthStartCm: 0,
          depthEndCm: 20,
          ph: '5.60',
          p: '12.00',
          k: '0.25',
          ca: '2.80',
          mg: '0.90',
          al: '0.00',
          hAl: '3.20',
          mo: '22.0',
          clay: '38.0'
        }
      ]);
    }
    setOcrStep('review');
  };

  // Adicionar uma nova linha na tabela de conferência
  const handleAddRow = () => {
    const nextIdx = samplesTable.length + 1;
    const isSub = samplesTable.length % 2 === 1;
    const plotNum = Math.floor(samplesTable.length / 2) + 1;
    setSamplesTable((prev) => [
      ...prev,
      {
        id: `sample-ext-${Date.now()}`,
        sampleCode: `AMOSTRA-${nextIdx}`,
        plotName: `Talhão 0${plotNum}`,
        depthStartCm: isSub ? 20 : 0,
        depthEndCm: isSub ? 40 : 20,
        ph: isSub ? '4.90' : '5.60',
        p: isSub ? '4.50' : '12.00',
        k: isSub ? '0.12' : '0.25',
        ca: isSub ? '1.20' : '2.80',
        mg: isSub ? '0.45' : '0.90',
        al: isSub ? '0.30' : '0.00',
        hAl: isSub ? '4.00' : '3.20',
        mo: isSub ? '14.0' : '22.0',
        clay: isSub ? '40.0' : '38.0'
      }
    ]);
  };

  // Remover linha
  const handleRemoveRow = (id: string) => {
    setSamplesTable((prev) => {
      const next = prev.filter((r) => r.id !== id);
      if (selectedSampleIndexToStart >= next.length) {
        setSelectedSampleIndexToStart(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  // Atualizar campo específico da linha
  const handleUpdateRowField = (id: string, field: keyof ExtractedSampleRow, val: any) => {
    setSamplesTable((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  // Salvar tudo e seguir para o fluxo de interpretação do talhão selecionado
  const handleSaveAndStart = (e: React.FormEvent) => {
    e.preventDefault();

    if (samplesTable.length === 0) {
      setValidationWarning('Nenhuma amostra presente na tabela. Adicione ao menos uma linha.');
      return;
    }

    // Validação de consistência em cada linha
    for (const r of samplesTable) {
      const ph = parseFloat(r.ph);
      if (isNaN(ph) || ph < 3.0 || ph > 9.0) {
        setValidationWarning(`Valor de pH inválido (${r.ph}) no ${r.plotName}. Informe um valor entre 3.0 e 9.0.`);
        return;
      }
    }

    setValidationWarning(null);

    // Mapeamento de talhões únicos para cadastro
    const distinctPlotNames = Array.from(new Set(samplesTable.map((s) => s.plotName.trim() || 'Talhão 01')));
    const newPlotsToRegister: Plot[] = [];
    const plotNameToIdMap: Record<string, string> = {};

    distinctPlotNames.forEach((pName, idx) => {
      const existing = plots.find((p) => p.name.toLowerCase() === pName.toLowerCase());
      if (existing) {
        plotNameToIdMap[pName] = existing.id;
      } else {
        const generatedId = `plot-${Date.now()}-${idx}`;
        plotNameToIdMap[pName] = generatedId;
        newPlotsToRegister.push({
          id: generatedId,
          propertyId: 'prop-1',
          name: pName,
          areaHa: parseFloat(inlinePlotArea) || 20.0,
          currentCrop: inlinePlotCrop || 'Milho',
          isDemo: false
        });
      }
    });

    // Constrói objetos SoilSample completos para cada linha da tabela
    const newSamplesToRegister: SoilSample[] = samplesTable.map((row, idx) => {
      const ca = parseFloat(row.ca) || 2.4;
      const mg = parseFloat(row.mg) || 0.85;
      const k = parseFloat(row.k) || 0.22;
      const al = parseFloat(row.al) || 0.0;
      const hAl = parseFloat(row.hAl) || 3.5;

      return {
        id: `sample-${Date.now()}-${idx}`,
        plotId: plotNameToIdMap[row.plotName.trim() || 'Talhão 01'],
        plotName: row.plotName.trim() || 'Talhão 01',
        propertyName: 'Minha Fazenda',
        labName: formLab || 'Laboratório de Solos',
        labReportNumber: formReportNum || `LAUDO-${Date.now().toString().slice(-4)}`,
        sampleDate: formDate,
        depthStartCm: row.depthStartCm,
        depthEndCm: row.depthEndCm,
        extractedViaOcr: entryMode === 'ocr',
        ocrConfirmedByUser: true,
        isDemo: false,
        phH2o: parseFloat(row.ph) || 5.6,
        pMehlich1: parseFloat(row.p) || 12.0,
        kCmolc: k,
        caCmolc: ca,
        mgCmolc: mg,
        alCmolc: al,
        hAlCmolc: hAl,
        moGKg: parseFloat(row.mo) || 22.0,
        clayPercent: parseFloat(row.clay) || 38.0
      };
    });

    if (onAddSamplesBatch) {
      onAddSamplesBatch(newSamplesToRegister, newPlotsToRegister);
    } else {
      newSamplesToRegister.forEach((s) => onAddSample(s));
    }

    const chosenSample = newSamplesToRegister[selectedSampleIndexToStart] || newSamplesToRegister[0];
    onNavigateToInterpretation(chosenSample);
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
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center space-x-2">
            <span>Entrada de Análise de Solo</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Multi-Talhão & Multi-Profundidade
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Anexe o laudo em PDF ou foto. O sistema separa cada talhão e profundidade (0-20 e 20-40 cm) para você conferir e interpretar ordenadamente.
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
            onClick={handleSwitchToManual}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              entryMode === 'manual'
                ? 'bg-[#173F2B] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Digitação Manual / Tabela</span>
          </button>
        </div>
      </div>

      {/* Configurações Padrão de Cultura para novos Talhões gerados */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[#2F7D32]" />
          <span className="font-bold text-gray-800 uppercase tracking-wider">
            Cultura Principal dos Novos Talhões:
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={inlinePlotCrop}
            onChange={(e) => setInlinePlotCrop(e.target.value)}
            className="p-2 rounded-xl border border-gray-300 font-bold bg-white text-gray-800 focus:ring-2 focus:ring-[#2F7D32]/20"
          >
            {availableCrops.map((c) => (
              <option key={c} value={c}>
                🌱 {c}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-1.5">
            <span className="text-gray-500 font-medium">Área média:</span>
            <input
              type="number"
              step="0.5"
              value={inlinePlotArea}
              onChange={(e) => setInlinePlotArea(e.target.value)}
              className="w-16 p-1.5 text-center rounded-lg border border-gray-300 font-bold"
            />
            <span className="text-gray-500">ha</span>
          </div>
        </div>
      </div>

      {/* ETAPA 1: Upload (Modo OCR) */}
      {entryMode === 'ocr' && ocrStep === 'upload' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center space-y-6 shadow-xs">
          <div className="max-w-xl mx-auto p-8 sm:p-10 border-2 border-dashed border-[#2F7D32]/50 rounded-2xl bg-gradient-to-b from-white to-[#F8FAF8] hover:border-[#2F7D32] transition-all space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#2F7D32] flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">
                Anexe o Laudo de Solo (PDF ou Foto)
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Suporta laudos com múltiplos talhões (ex: Talhões 1 a 4) e múltiplas profundidades (0-20 e 20-40 cm).
              </p>
            </div>

            {/* Botões Nativos */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleTriggerFileSelect}
                className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <FolderOpen className="w-4 h-4 text-[#8BC34A]" />
                <span>Escolher Laudo (PDF ou Imagem)</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerCamera}
                className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold bg-white text-gray-800 border border-gray-300 hover:border-[#2F7D32] hover:bg-gray-50 transition-all shadow-xs flex items-center justify-center space-x-2"
              >
                <Camera className="w-4 h-4 text-[#2F7D32]" />
                <span>Fotografar Folha do Laudo</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Reconhece tabelas de laboratórios: Fullin, SoloBahia, AgroLab, Tommasi, Coplana, etc.</span>
          </div>
        </div>
      )}

      {/* ETAPA 2: Processamento */}
      {entryMode === 'ocr' && ocrStep === 'processing' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4 shadow-xs">
          <RefreshCw className="w-12 h-12 text-[#2F7D32] animate-spin mx-auto" />
          <h3 className="text-base font-bold text-gray-900">{ocrProgressText}</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Identificando talhões, camadas de profundidade e colunas de nutrientes...
          </p>
        </div>
      )}

      {/* ETAPA 3: TELA DE CONFERÊNCIA MULTI-TALHÃO & MULTI-PROFUNDIDADE */}
      {ocrStep === 'review' && (
        <div className="space-y-6">
          {/* Banner Superior com Orientação */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <FileCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center space-x-2">
                  <span>Conferência dos Dados Identificados no Laudo</span>
                  <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full text-[10px] font-black">
                    {samplesTable.length} {samplesTable.length === 1 ? 'Amostra' : 'Amostras Identificadas'}
                  </span>
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Separamos as amostras por talhão e profundidade. Você pode ajustar qualquer número diretamente na tabela abaixo antes de salvar.
                </p>
              </div>
            </div>

            {fileName && (
              <button
                type="button"
                onClick={handleTriggerFileSelect}
                className="text-xs font-bold text-[#173F2B] bg-white border border-emerald-300 px-3 py-1.5 rounded-xl hover:bg-emerald-50 shrink-0"
              >
                Trocar Arquivo
              </button>
            )}
          </div>

          {validationWarning && (
            <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationWarning}</span>
            </div>
          )}

          {/* Metadados do Laudo */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Laboratório</label>
              <input
                type="text"
                value={formLab}
                onChange={(e) => setFormLab(e.target.value)}
                placeholder="Ex: Fullin"
                className="w-full p-2 rounded-lg border border-gray-300 font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Número do Laudo</label>
              <input
                type="text"
                value={formReportNum}
                onChange={(e) => setFormReportNum(e.target.value)}
                placeholder="Ex: 2025-17488"
                className="w-full p-2 rounded-lg border border-gray-300 font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Cliente / Interessado</label>
              <input
                type="text"
                value={formClient}
                onChange={(e) => setFormClient(e.target.value)}
                placeholder="Ex: Bruno Viana"
                className="w-full p-2 rounded-lg border border-gray-300 font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Data da Análise</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-gray-300 font-medium"
              />
            </div>
          </div>

          {/* Seção Principal: Tabela de Amostras + Pré-visualização Opcional */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 tracking-tight flex items-center space-x-2">
                  <span>Tabela de Conferência (Amostras do Laudo)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Passe o olho e ajuste os valores se necessário. O pH foi corrigido e cada coluna representa uma amostra real.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRow}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 flex items-center space-x-1.5 transition-all self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Talhão / Profundidade</span>
              </button>
            </div>

            {/* TABELA RESPONSIVA COM ROLAGEM HORIZONTAL SUAVE */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                    <th className="p-3 w-40">Talhão / Ponto</th>
                    <th className="p-3 w-32">Profundidade</th>
                    <th className="p-3 w-24 text-center bg-emerald-50/70 text-emerald-900 font-black">pH H₂O</th>
                    <th className="p-3 w-24 text-center">P (mg/dm³)</th>
                    <th className="p-3 w-24 text-center">K⁺ (cmol_c)</th>
                    <th className="p-3 w-24 text-center">Ca²⁺ (cmol_c)</th>
                    <th className="p-3 w-24 text-center">Mg²⁺ (cmol_c)</th>
                    <th className="p-3 w-24 text-center">Al³⁺ (cmol_c)</th>
                    <th className="p-3 w-24 text-center">H+Al (cmol_c)</th>
                    <th className="p-3 w-24 text-center">M.O. (g/kg)</th>
                    <th className="p-3 w-24 text-center">Argila (%)</th>
                    <th className="p-3 w-12 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {samplesTable.map((row, idx) => {
                    const isSelectedToStart = selectedSampleIndexToStart === idx;
                    const isSubsurface = row.depthStartCm >= 20;

                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          isSelectedToStart ? 'bg-emerald-50/40 font-semibold' : 'hover:bg-gray-50/60'
                        }`}
                      >
                        {/* Talhão */}
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={row.plotName}
                            onChange={(e) => handleUpdateRowField(row.id, 'plotName', e.target.value)}
                            className="w-full p-1.5 rounded-lg border border-gray-300 font-bold text-gray-900 bg-white"
                          />
                          {row.sampleCode && (
                            <span className="text-[10px] text-gray-400 block px-1 mt-0.5">
                              Cód: {row.sampleCode}
                            </span>
                          )}
                        </td>

                        {/* Profundidade */}
                        <td className="p-2.5">
                          <div className="flex items-center space-x-1">
                            <select
                              value={`${row.depthStartCm}-${row.depthEndCm}`}
                              onChange={(e) => {
                                const [s, end] = e.target.value.split('-').map(Number);
                                handleUpdateRowField(row.id, 'depthStartCm', s);
                                handleUpdateRowField(row.id, 'depthEndCm', end);
                              }}
                              className={`p-1.5 rounded-lg border text-xs font-bold ${
                                isSubsurface
                                  ? 'bg-blue-50 text-blue-900 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                              }`}
                            >
                              <option value="0-20">0 - 20 cm (Arável)</option>
                              <option value="20-40">20 - 40 cm (Subsolo)</option>
                              <option value="0-40">0 - 40 cm</option>
                              <option value="40-60">40 - 60 cm</option>
                            </select>
                          </div>
                        </td>

                        {/* pH H2O */}
                        <td className="p-2.5 bg-emerald-50/30">
                          <input
                            type="number"
                            step="0.01"
                            value={row.ph}
                            onChange={(e) => handleUpdateRowField(row.id, 'ph', e.target.value)}
                            className="w-full p-1.5 text-center rounded-lg border border-emerald-300 font-black text-gray-900 bg-white"
                          />
                        </td>

                        {/* P Mehlich */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.01"
                            value={row.p}
                            onChange={(e) => handleUpdateRowField(row.id, 'p', e.target.value)}
                            className="w-full p-1.5 text-center rounded-lg border border-gray-300 font-medium bg-white"
                          />
                        </td>

                        {/* K */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.01"
                            value={row.k}
                            onChange={(e) => handleUpdateRowField(row.id, 'k', e.target.value)}
                            className="w-full p-1.5 text-center rounded-lg border border-gray-300 font-medium bg-white"
                          />
                        </td>

                        {/* Ca */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.01"
                            value={row.ca}
                            onChange={(e) => handleUpdateRowField(row.id, 'ca', e.target.value)}
                            className="w-full p-1.5 text-center rounded-lg border border-gray-300 font-medium bg-white"
                          />
                        </td>

                        {/* Mg */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.01"
                            value={row.mg}
                            onChange={(e) => handleUpdateRowField(row.id, 'mg', e.target.value)}
                            className="w-full p-1.5 text-center rounded-lg border border-gray-300 font-medium bg-white"
                          />
                        </td>

                        {/* Al */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.01"
                            value={row.al}
                            onChange={(e) => handleUpdateRowField(row.id, 'al', e.target.value)}
                            className={`w-full p-1.5 text-center rounded-lg border font-medium bg-white ${
                              parseFloat(row.al) > 0.2 ? 'border-amber-300 text-amber-900' : 'border-gray-300'
                            }`}
                          />
                        </td>

                        {/* H+Al */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.01"
                            value={row.hAl}
                            onChange={(e) => handleUpdateRowField(row.id, 'hAl', e.target.value)}
                            className="w-full p-1.5 text-center rounded-lg border border-gray-300 font-medium bg-white"
                          />
                        </td>

                        {/* MO */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.1"
                            value={row.mo}
                            onChange={(e) => handleUpdateRowField(row.id, 'mo', e.target.value)}
                            className="w-full p-1.5 text-center rounded-lg border border-gray-300 font-medium bg-white"
                          />
                        </td>

                        {/* Argila */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.1"
                            value={row.clay}
                            onChange={(e) => handleUpdateRowField(row.id, 'clay', e.target.value)}
                            className="w-full p-1.5 text-center rounded-lg border border-gray-300 font-medium bg-white"
                          />
                        </td>

                        {/* Excluir Linha */}
                        <td className="p-2.5 text-center">
                          {samplesTable.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1"
                              title="Remover amostra"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* SELEÇÃO DO TALHÃO INICIAL DE INTERPRETAÇÃO */}
            <div className="bg-gradient-to-r from-emerald-50/70 to-teal-50/60 p-5 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-base">🎯</span>
                <h4 className="text-sm font-extrabold text-emerald-950 uppercase tracking-wider">
                  Qual talhão você deseja interpretar agora?
                </h4>
              </div>
              <p className="text-xs text-emerald-800">
                Selecione abaixo por qual talhão deseja iniciar. <strong>Todas as amostras deste laudo ficarão salvas na memória do sistema</strong>, e ao concluir este talhão, o sistema te guiará automaticamente para o próximo!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {samplesTable.map((row, idx) => {
                  const isSelected = selectedSampleIndexToStart === idx;
                  const isSubsurface = row.depthStartCm >= 20;

                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setSelectedSampleIndexToStart(idx)}
                      className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white border-[#2F7D32] ring-2 ring-[#2F7D32]/30 shadow-md'
                          : 'bg-white/80 border-emerald-100 hover:border-emerald-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-extrabold text-xs text-gray-900">
                          {row.plotName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSubsurface
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {row.depthStartCm}-{row.depthEndCm} cm
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-600 space-y-0.5">
                        <div>
                          pH: <span className="font-bold text-gray-900">{row.ph}</span> • P:{' '}
                          <span className="font-bold text-gray-900">{row.p}</span>
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {isSubsurface ? 'Subsuperfície (Gesso)' : 'Camada Arável (Calagem/NPK)'}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-emerald-100 flex items-center space-x-1 text-emerald-700 text-[11px] font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Iniciar por este talhão</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BOTÃO FINAL DE CONFIRMAÇÃO E SALVAMENTO */}
            <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setOcrStep('upload')}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 order-2 sm:order-1"
              >
                Voltar e Anexar Outro Arquivo
              </button>

              <button
                type="button"
                onClick={handleSaveAndStart}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-black bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-md flex items-center justify-center space-x-2 order-1 sm:order-2"
              >
                <Check className="w-4 h-4 text-[#8BC34A]" />
                <span>
                  Conferido: Salvar Laudo & Iniciar Interpretação de{' '}
                  {samplesTable[selectedSampleIndexToStart]?.plotName || 'Talhão 01'} ({samplesTable[selectedSampleIndexToStart]?.depthStartCm}-{samplesTable[selectedSampleIndexToStart]?.depthEndCm} cm) ➡️
                </span>
              </button>
            </div>
          </div>

          {/* Visualizador do Arquivo Original Anexado (Para Fácil Comparação Lado a Lado ou Abaixo) */}
          {filePreviewUrl && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <span className="font-bold text-xs text-gray-800">
                    Documento Original do Laudo ({fileName})
                  </span>
                </div>
                <a
                  href={filePreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#173F2B] hover:text-[#2F7D32] underline"
                >
                  Abrir em nova aba
                </a>
              </div>

              <div className="max-h-[500px] overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-2 flex items-center justify-center">
                {fileType === 'image' ? (
                  <img
                    src={filePreviewUrl}
                    alt="Laudo de solo anexado"
                    className="max-w-full h-auto rounded-lg object-contain"
                  />
                ) : (
                  <iframe
                    src={filePreviewUrl}
                    title="Pré-visualização do laudo PDF"
                    className="w-full h-[480px] rounded-lg border-0"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
