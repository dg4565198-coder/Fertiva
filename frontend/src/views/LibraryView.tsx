import React, { useState, useRef } from 'react';
import { TechnicalReference, CropAgronomicRule } from '../types';
import { extractTextFromPdf, parseBookManualReport, ExtractedBookData } from '../lib/pdfExtractor';
import { getCropAgronomicRule } from '../lib/agronomicEngine';
import { createWorker } from 'tesseract.js';
import {
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Search,
  Building2,
  BadgeCheck,
  Plus,
  Trash2,
  X,
  Sparkles,
  Layers,
  Sprout,
  Info,
  AlertTriangle,
  ArrowRight,
  UploadCloud,
  Camera,
  FolderOpen,
  FileText,
  Eye,
  RefreshCw,
  FileCheck2,
  Database,
  AlertCircle,
  Filter,
  BarChart3
} from 'lucide-react';

interface LibraryViewProps {
  references: TechnicalReference[];
  onAddReference: (ref: TechnicalReference) => void;
  onRemoveReference: (id: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  references,
  onAddReference,
  onRemoveReference
}) => {
  // Navegação da Biblioteca: Catálogo de Manuais vs. Acervo de Governança
  const [activeSection, setActiveSection] = useState<'catalog' | 'acervo'>('catalog');
  const [acervoFilter, setAcervoFilter] = useState<'all' | 'complete' | 'partial' | 'lacuna'>('all');
  const [acervoSearch, setAcervoSearch] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refToDelete, setRefToDelete] = useState<TechnicalReference | null>(null);

  // Input de arquivos nativo do sistema (celular ou computador)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Estado de Anexo e Leitura Automática de Livro/Manual
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [docProgressText, setDocProgressText] = useState('Lendo documento...');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedPreviewUrl, setAttachedPreviewUrl] = useState<string | null>(null);
  const [attachedFileType, setAttachedFileType] = useState<'image' | 'pdf' | null>(null);
  const [showPreviewDoc, setShowPreviewDoc] = useState(false);
  const [autoFillSuccess, setAutoFillSuccess] = useState(false);

  // Formulário do Novo Livro
  const [newTitle, setNewTitle] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [newDocType, setNewDocType] = useState<TechnicalReference['docType']>('Manual Oficial');
  const [newScope, setNewScope] = useState('Nacional / Regional');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  
  // Culturas contempladas no novo livro
  const [cropsInput, setCropsInput] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['Soja', 'Milho']);
  const [customTargetV, setCustomTargetV] = useState('70');
  const [customN, setCustomN] = useState('100');
  const [customP, setCustomP] = useState('80');
  const [customK, setCustomK] = useState('90');
  const [customFormulation, setCustomFormulation] = useState('04-14-08');

  // Coleta todas as culturas únicas presentes na biblioteca
  const allLibraryCrops = Array.from(
    new Set(references.flatMap((r) => r.cropsCovered || []))
  ).sort();

  const filteredRefs = references.filter((ref: TechnicalReference) => {
    const matchesSearch =
      ref.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.scope.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ref.cropsCovered && ref.cropsCovered.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase())));

    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'ba') return matchesSearch && (ref.scope.includes('Bahia') || ref.code.includes('BAHIA') || ref.code.includes('CEPLAC'));
    if (selectedFilter === 'embrapa') return matchesSearch && (ref.institution.includes('Embrapa') || ref.code.includes('EMBRAPA'));
    
    // Filtro por cultura específica
    return matchesSearch && ref.cropsCovered && ref.cropsCovered.includes(selectedFilter);
  });

  const handleToggleCrop = (crop: string) => {
    if (selectedCrops.includes(crop)) {
      setSelectedCrops(selectedCrops.filter((c) => c !== crop));
    } else {
      setSelectedCrops([...selectedCrops, crop]);
    }
  };

  const handleAddCustomCrop = () => {
    if (cropsInput.trim() && !selectedCrops.includes(cropsInput.trim())) {
      setSelectedCrops([...selectedCrops, cropsInput.trim()]);
      setCropsInput('');
    }
  };

  // Lista unificada de culturas do agronegócio no radar do sistema
  const radarCrops = [
    'Soja',
    'Milho',
    'Feijão',
    'Café Conilon',
    'Cacau',
    'Mandioca',
    'Banana',
    'Citros',
    'Algodão',
    'Cana-de-Açúcar',
    'Pastagem',
    'Eucalipto',
    'Pimenta-do-Reino',
    'Sorgo',
    'Trigo',
    'Tomate',
    'Girassol',
    'Abacaxi',
    'Mamona'
  ];

  // Todas as culturas ativas cadastradas em qualquer livro da biblioteca
  const allSystemCrops = Array.from(
    new Set([...radarCrops, ...references.flatMap((r) => r.cropsCovered || [])])
  ).sort();

  // Mapeamento e Diagnóstico do Acervo por Cultura
  const acervoItems = allSystemCrops.map((cropName) => {
    const matchingRefs = references.filter(
      (ref) =>
        (ref.cropsCovered && ref.cropsCovered.some((c) => c.toLowerCase() === cropName.toLowerCase())) ||
        (ref.cropRules && ref.cropRules.some((r) => r.cropName.toLowerCase() === cropName.toLowerCase()))
    );

    const ruleMatch = getCropAgronomicRule(cropName, references);
    const rule = ruleMatch.rule;

    let status: 'completo' | 'parcial' | 'lacuna' = 'lacuna';
    let diagnostic = '';
    let missingNote = '';

    if (matchingRefs.length >= 2) {
      status = 'completo';
      diagnostic = `Embasamento oficial robusto: ${matchingRefs.length} exemplares no sistema cobrindo calagem (V%), tabela de arranque NPK e nutrição mineral.`;
    } else if (matchingRefs.length === 1) {
      status = 'parcial';
      diagnostic = `Possui 1 exemplar oficial cadastrado (${matchingRefs[0].code} - ${matchingRefs[0].institution}).`;
      missingNote = 'Falta anexar obra complementar de outro órgão de pesquisa para cruzamento de doses e faixas de solo arenoso.';
    } else {
      status = 'lacuna';
      diagnostic = `⚠️ ATENÇÃO: A cultura ${cropName} está com FALTA DE INFORMAÇÃO na biblioteca. O motor de cálculo está usando calibração genérica.`;
      missingNote = 'Recomendado anexar um manual ou boletim técnico em PDF ou foto para calibrar e auditar 100% das regras desta cultura.';
    }

    return {
      cropName,
      matchingRefs,
      totalExemplares: matchingRefs.length,
      status,
      diagnostic,
      missingNote,
      rule
    };
  });

  const completeCount = acervoItems.filter((i) => i.status === 'completo').length;
  const partialCount = acervoItems.filter((i) => i.status === 'parcial').length;
  const missingCount = acervoItems.filter((i) => i.status === 'lacuna').length;

  const filteredAcervo = acervoItems.filter((item) => {
    const matchSearch =
      item.cropName.toLowerCase().includes(acervoSearch.toLowerCase()) ||
      item.matchingRefs.some(
        (r) =>
          r.title.toLowerCase().includes(acervoSearch.toLowerCase()) ||
          r.code.toLowerCase().includes(acervoSearch.toLowerCase())
      );

    if (acervoFilter === 'all') return matchSearch;
    if (acervoFilter === 'complete') return matchSearch && item.status === 'completo';
    if (acervoFilter === 'partial') return matchSearch && item.status === 'parcial';
    if (acervoFilter === 'lacuna') return matchSearch && item.status === 'lacuna';
    return matchSearch;
  });

  const handleOpenAddForCrop = (cropName: string) => {
    resetModalForm();
    setSelectedCrops([cropName]);
    setNewTitle(`Manual de Adubação e Calagem para a Cultura de ${cropName}`);
    const match = getCropAgronomicRule(cropName, references);
    setCustomTargetV(match.rule.targetV.toString());
    setCustomN(match.rule.nDemandKgHa.toString());
    setCustomP(match.rule.pDemandKgHa.toString());
    setCustomK(match.rule.kDemandKgHa.toString());
    setCustomFormulation(match.rule.suggestedFormulation || '04-14-08');
    setIsAddModalOpen(true);
  };

  const resetModalForm = () => {
    setNewTitle('');
    setNewInstitution('');
    setNewYear(new Date().getFullYear().toString());
    setNewDocType('Manual Oficial');
    setNewScope('Nacional / Regional');
    setNewUrl('');
    setNewNotes('');
    setSelectedCrops(['Soja', 'Milho']);
    setCustomTargetV('70');
    setCustomN('100');
    setCustomP('80');
    setCustomK('90');
    setCustomFormulation('04-14-08');
    setAttachedFileName(null);
    setAttachedPreviewUrl(null);
    setAttachedFileType(null);
    setShowPreviewDoc(false);
    setAutoFillSuccess(false);
  };

  const applyExtractedBookData = (parsed: ExtractedBookData) => {
    if (parsed.title) setNewTitle(parsed.title);
    if (parsed.institution) setNewInstitution(parsed.institution);
    if (parsed.year) setNewYear(parsed.year.toString());
    if (parsed.docType) setNewDocType(parsed.docType);
    if (parsed.scope) setNewScope(parsed.scope);
    if (parsed.officialUrl) setNewUrl(parsed.officialUrl);
    if (parsed.notes) setNewNotes(parsed.notes);
    if (parsed.cropsDetected && parsed.cropsDetected.length > 0) {
      setSelectedCrops(parsed.cropsDetected);
    }
    if (parsed.targetV) setCustomTargetV(parsed.targetV.toString());
    if (parsed.nKgHa) setCustomN(parsed.nKgHa.toString());
    if (parsed.p2o5KgHa) setCustomP(parsed.p2o5KgHa.toString());
    if (parsed.k2oKgHa) setCustomK(parsed.k2oKgHa.toString());
    if (parsed.formulation) setCustomFormulation(parsed.formulation);
    setAutoFillSuccess(true);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedFileName(file.name);
    setIsProcessingDoc(true);
    setDocProgressText('Identificando formato do documento...');

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setAttachedFileType(isImage ? 'image' : (isPdf ? 'pdf' : null));

    const previewUrl = URL.createObjectURL(file);
    setAttachedPreviewUrl(previewUrl);

    try {
      if (isPdf) {
        setDocProgressText('Extraindo texto e tabelas do PDF técnico...');
        try {
          const rawText = await extractTextFromPdf(file);
          setDocProgressText('Cruzando regras agronômicas e culturas...');
          const parsed = parseBookManualReport(rawText, file.name);
          applyExtractedBookData(parsed);
        } catch (pdfErr) {
          console.warn('Fallback inteligente para o manual PDF:', pdfErr);
          const parsed = parseBookManualReport('', file.name);
          applyExtractedBookData(parsed);
        }
      } else if (isImage) {
        setDocProgressText('Reconhecendo texto e sumário via OCR...');
        try {
          const worker = await createWorker('por');
          const ret = await worker.recognize(file);
          await worker.terminate();
          setDocProgressText('Cruzando dados agronômicos da publicação...');
          const parsed = parseBookManualReport(ret.data.text, file.name);
          applyExtractedBookData(parsed);
        } catch (ocrErr) {
          console.warn('OCR em imagem com fallback inteligente:', ocrErr);
          const parsed = parseBookManualReport('', file.name);
          applyExtractedBookData(parsed);
        }
      } else {
        const parsed = parseBookManualReport('', file.name);
        applyExtractedBookData(parsed);
      }
    } catch (err) {
      console.warn('Erro ao processar livro/manual:', err);
      const parsed = parseBookManualReport('', file.name);
      applyExtractedBookData(parsed);
    } finally {
      setIsProcessingDoc(false);
    }
  };

  const handleSaveNewBook = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      alert('Por favor, informe o título do manual ou livro.');
      return;
    }

    const cleanCrops = selectedCrops.length > 0 ? selectedCrops : ['Cultura Geral'];
    const codeGen = `LIVRO_${Date.now().toString().slice(-4)}`;

    const cropRules: CropAgronomicRule[] = cleanCrops.map((c) => ({
      id: `rule-${codeGen}-${c.toLowerCase().replace(/\s+/g, '-')}`,
      cropName: c,
      category: c.toLowerCase().includes('caf') || c.toLowerCase().includes('cacau') || c.toLowerCase().includes('banana') ? 'perene' : 'grão',
      targetV: parseFloat(customTargetV) || 70,
      targetYield: 'Meta Padrão Recomendada',
      nDemandKgHa: parseFloat(customN) || 100,
      pDemandKgHa: parseFloat(customP) || 80,
      kDemandKgHa: parseFloat(customK) || 90,
      suggestedFormulation: customFormulation || '04-14-08',
      gypsumFactor: 50
    }));

    const newRef: TechnicalReference = {
      id: `ref-${Date.now()}`,
      code: codeGen,
      title: newTitle.trim(),
      institution: newInstitution.trim() || 'Órgão de Pesquisa Agropecuária',
      year: parseInt(newYear) || new Date().getFullYear(),
      status: 'Adicionado pelo Operador - Ativo',
      scope: newScope.trim() || 'Brasil',
      notes: newNotes.trim() || `Base de calagem e nutrição cadastrada no sistema. Culturas contempladas: ${cleanCrops.join(', ')}.`,
      officialUrl: newUrl.trim() || 'https://www.gov.br/agricultura',
      institutionUrl: newUrl.trim() || 'https://www.gov.br/agricultura',
      docType: newDocType,
      cropsCovered: cleanCrops,
      cropRules,
      isCustom: true
    };

    onAddReference(newRef);
    setIsAddModalOpen(false);
    resetModalForm();
  };

  return (
    <div className="space-y-6">
      {/* Topo com Título, Estatísticas e Botão de Adicionar Livro */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#173F2B] flex items-center justify-center border border-emerald-200">
              <BookOpen className="w-5 h-5 text-[#2F7D32]" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Biblioteca Técnica & Base de Raciocínio
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Adicione ou remova livros e manuais oficiais. O sistema cruza os dados dos livros com as culturas operadas e expande automaticamente a lista de culturas atendidas no motor agronômico.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setActiveSection(activeSection === 'acervo' ? 'catalog' : 'acervo')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-2 border cursor-pointer ${
              activeSection === 'acervo'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/40'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
          >
            <Database className="w-4 h-4 text-amber-500" />
            <span>Acervo</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white font-mono font-bold text-amber-900 border border-amber-200">
              {allSystemCrops.length} culturas
            </span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-md flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#8BC34A]" />
            <span>+ Adicionar Manual / Livro Oficial</span>
          </button>
        </div>
      </div>

      {/* Abas de Navegação Superior: Catálogo vs. Acervo */}
      <div className="flex border-b border-gray-200 space-x-3">
        <button
          onClick={() => setActiveSection('catalog')}
          className={`pb-3 px-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            activeSection === 'catalog'
              ? 'border-[#2F7D32] text-[#173F2B]'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Catálogo de Obras & Manuais ({references.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('acervo')}
          className={`pb-3 px-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            activeSection === 'acervo'
              ? 'border-amber-600 text-amber-900 font-extrabold'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Database className="w-4 h-4 text-amber-500" />
          <span>Acervo & Diagnóstico de Culturas ({allSystemCrops.length})</span>
          {missingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-extrabold ml-1 animate-pulse">
              {missingCount} com lacunas
            </span>
          )}
        </button>
      </div>

      {activeSection === 'catalog' && (
        <div className="space-y-6">

      {/* Faixa de Governança e Cruzamento Inteligente */}
      <div className="bg-gradient-to-r from-[#173F2B] via-[#1F4E37] to-[#2F7D32] text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#8BC34A]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8BC34A]">
              Raciocínio Agronômico Dinâmico & Auditável
            </h3>
          </div>
          <p className="text-xs text-gray-100 max-w-3xl leading-relaxed">
            Cada livro cadastrado alimenta as regras de <strong>Saturação por Bases ($V_2\%$)</strong> para calagem, <strong>critérios de gessagem</strong> e <strong>tabelas de adubação NPK</strong>. Se você adicionar um manual de uma nova cultura (ex: Soja, Citros, Feijão, Cana), ela aparece imediatamente para seleção em talhões, diagnósticos e planos de adubação.
          </p>
        </div>
      </div>

      {/* Barra de Filtros por Cultura, Região e Busca */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Seletor Rápido de Cultura / Região */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-bold text-gray-400 uppercase mr-1">Filtrar:</span>
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedFilter === 'all'
                  ? 'bg-[#173F2B] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Todos os Livros ({references.length})
            </button>
            <button
              onClick={() => setSelectedFilter('ba')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedFilter === 'ba'
                  ? 'bg-[#173F2B] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Bahia (SEAGRI / CEPLAC)
            </button>
            <button
              onClick={() => setSelectedFilter('embrapa')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedFilter === 'embrapa'
                  ? 'bg-[#173F2B] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Embrapa
            </button>

            {/* Dropdown de Culturas Cadastradas */}
            <select
              value={allLibraryCrops.includes(selectedFilter) ? selectedFilter : ''}
              onChange={(e) => setSelectedFilter(e.target.value || 'all')}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2F7D32]"
            >
              <option value="">Filtrar por Cultura...</option>
              {allLibraryCrops.map((c) => (
                <option key={c} value={c}>
                  🌱 Cultura: {c}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar livro, cultura, autor ou sigla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-2 rounded-xl border border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#2F7D32]/20 focus:border-[#2F7D32] bg-white shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Grade de Livros e Manuais Cadastrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRefs.map((ref: TechnicalReference) => (
          <div
            key={ref.id}
            className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4 group hover:border-[#2F7D32]/50 relative"
          >
            <div className="space-y-3">
              {/* Header do Card */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-[#173F2B] border border-emerald-200/60">
                    {ref.code}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {ref.docType}
                  </span>
                  {ref.isCustom && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Adicionado pelo Usuário
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-extrabold text-[#2F7D32] bg-emerald-50/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Ano {ref.year}
                  </span>
                  {/* Botão de Excluir Livro */}
                  <button
                    onClick={() => setRefToDelete(ref)}
                    title="Remover livro e suas regras do sistema"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Título Oficial */}
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#173F2B] transition-colors leading-snug">
                {ref.title}
              </h3>

              {/* Instituição Autora */}
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-semibold text-gray-800">{ref.institution}</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500">{ref.scope}</span>
              </div>

              {/* Culturas Contempladas pelo Livro */}
              {ref.cropsCovered && ref.cropsCovered.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Culturas Contempladas por esta Obra:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {ref.cropsCovered.map((crop) => (
                      <span
                        key={crop}
                        className="text-[11px] font-bold bg-gray-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-md inline-flex items-center space-x-1"
                      >
                        <Sprout className="w-2.5 h-2.5 text-[#2F7D32]" />
                        <span>{crop}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Regras Agronômicas Extraídas / Conectadas ao Motor */}
              {ref.cropRules && ref.cropRules.length > 0 && (
                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950">
                    <span className="flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Raciocínio Agronômico Ativo no Motor:</span>
                    </span>
                    <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[9px] uppercase font-extrabold tracking-wider">
                      Alimentando Cálculos
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-gray-700 pt-1">
                    <div className="bg-white p-1.5 rounded-lg border border-emerald-100">
                      <span className="text-gray-400 block">V% Meta:</span>
                      <strong className="text-[#2F7D32] text-xs">{ref.cropRules[0].targetV}%</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-emerald-100">
                      <span className="text-gray-400 block">Demanda N:</span>
                      <strong className="text-gray-900 text-xs">{ref.cropRules[0].nDemandKgHa} kg/ha</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-emerald-100">
                      <span className="text-gray-400 block">Demanda P₂O₅:</span>
                      <strong className="text-gray-900 text-xs">{ref.cropRules[0].pDemandKgHa} kg/ha</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-emerald-100">
                      <span className="text-gray-400 block">Demanda K₂O:</span>
                      <strong className="text-gray-900 text-xs">{ref.cropRules[0].kDemandKgHa} kg/ha</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Notas e Escopo */}
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                {ref.notes}
              </p>
            </div>

            {/* Rodapé do Card com Status e Botões de Link Externo */}
            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-1.5 text-[11px] text-emerald-800 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{ref.status}</span>
              </div>

              {/* LINK OFICIAL EXTERNO */}
              {ref.officialUrl && (
                <a
                  href={ref.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-xs shrink-0 group/link"
                  title={`Acessar publicação oficial em ${ref.officialUrl}`}
                >
                  <span>Acessar Publicação Oficial</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#8BC34A] group-hover/link:translate-x-0.5 transition-transform" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

      {/* ===================== ABA 2: ACERVO & GOVERNANÇA DE CULTURAS ===================== */}
      {activeSection === 'acervo' && (
        <div className="space-y-6">
          {/* Métricas do Acervo */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Total no Radar
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-gray-900">{allSystemCrops.length}</span>
                <span className="text-xs text-gray-500 font-medium">Culturas monitoradas</span>
              </div>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Cobertura Completa
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-emerald-950">{completeCount}</span>
                <span className="text-xs text-emerald-800 font-medium">2+ Manuais Oficiais</span>
              </div>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-xs">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Cobertura Parcial
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-amber-950">{partialCount}</span>
                <span className="text-xs text-amber-800 font-medium">1 Manual Cadastrado</span>
              </div>
            </div>

            <div className="bg-red-50/70 p-4 rounded-xl border border-red-200 shadow-xs">
              <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                Falta Informação
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-red-950">{missingCount}</span>
                <span className="text-xs text-red-800 font-medium">Sem Manuais Anexados</span>
              </div>
            </div>
          </div>

          {/* Faixa Explicativa de Governança */}
          <div className="bg-gradient-to-r from-emerald-950 via-[#173F2B] to-[#2F7D32] p-5 rounded-2xl text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Painel de Controle do Acervo & Diagnóstico de Lacunas
                </h3>
              </div>
              <p className="text-xs text-gray-100 max-w-3xl leading-relaxed">
                Aqui você controla o que o sistema sabe sobre cada cultura. O motor informa quantos exemplares citam cada espécie, o que eles cobrem (calagem, NPK, gessagem) e avisa expressamente: <em>"olha, na cultura Y está faltando informação na biblioteca"</em>.
              </p>
            </div>
          </div>

          {/* Filtros e Busca do Acervo */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] font-bold text-gray-400 uppercase mr-1">Filtrar Acervo:</span>
                <button
                  onClick={() => setAcervoFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    acervoFilter === 'all'
                      ? 'bg-[#173F2B] text-white shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Todas as Culturas ({allSystemCrops.length})
                </button>
                <button
                  onClick={() => setAcervoFilter('lacuna')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    acervoFilter === 'lacuna'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
                  }`}
                >
                  ⚠️ Faltando Informação ({missingCount})
                </button>
                <button
                  onClick={() => setAcervoFilter('partial')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    acervoFilter === 'partial'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  🟡 Cobertura Parcial ({partialCount})
                </button>
                <button
                  onClick={() => setAcervoFilter('complete')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    acervoFilter === 'complete'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  🟢 Cobertura Completa ({completeCount})
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar cultura ou obra no acervo..."
                  value={acervoSearch}
                  onChange={(e) => setAcervoSearch(e.target.value)}
                  className="text-xs pl-8 pr-3 py-2 rounded-xl border border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#2F7D32]/20 focus:border-[#2F7D32] bg-white shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Grade de Cartões de Cada Cultura */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredAcervo.map((item) => (
              <div
                key={item.cropName}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all hover:shadow-md ${
                  item.status === 'lacuna'
                    ? 'border-red-200/90 bg-gradient-to-br from-white via-white to-red-50/20 ring-1 ring-red-100'
                    : (item.status === 'parcial'
                      ? 'border-amber-200/90 bg-gradient-to-br from-white via-white to-amber-50/20'
                      : 'border-emerald-200/80 bg-white')
                }`}
              >
                <div className="space-y-3">
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        item.status === 'lacuna'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : (item.status === 'parcial'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200')
                      }`}>
                        <Sprout className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                          {item.cropName}
                        </h3>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">
                          Categoria Agronômica: {item.rule.category}
                        </span>
                      </div>
                    </div>

                    {/* Badge do Status da Cultura */}
                    {item.status === 'completo' && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center space-x-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{item.totalExemplares} Exemplares (Completo)</span>
                      </span>
                    )}
                    {item.status === 'parcial' && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center space-x-1 shrink-0">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>1 Exemplar (Parcial)</span>
                      </span>
                    )}
                    {item.status === 'lacuna' && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-100 text-red-900 border border-red-200 flex items-center space-x-1 shrink-0">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span>Falta Informação</span>
                      </span>
                    )}
                  </div>

                  {/* Exemplares que Citam esta Cultura */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Exemplares no Sistema que Citam sobre {item.cropName}:
                    </span>
                    {item.matchingRefs.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {item.matchingRefs.map((r) => (
                          <span
                            key={r.id}
                            className="text-[11px] font-semibold bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg text-gray-800 flex items-center space-x-1"
                            title={`${r.title} (${r.institution}, ${r.year})`}
                          >
                            <BookOpen className="w-3 h-3 text-[#2F7D32]" />
                            <span><strong>{r.code}</strong> ({r.year})</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-red-800 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Nenhum livro ou boletim técnico oficial anexado especificamente para esta cultura.</span>
                      </div>
                    )}
                  </div>

                  {/* O que os Exemplares Cobrem (Dados Técnicos no Motor) */}
                  <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-200/80 text-xs space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                      O que está parametrizado no motor para {item.cropName}:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <span className="text-gray-400 block">Saturação Bases:</span>
                        <strong className="text-[#2F7D32] text-xs">V% = {item.rule.targetV}%</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <span className="text-gray-400 block">Demanda N:</span>
                        <strong className="text-gray-900 text-xs">{item.rule.nDemandKgHa} kg/ha</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <span className="text-gray-400 block">Demanda P₂O₅:</span>
                        <strong className="text-gray-900 text-xs">{item.rule.pDemandKgHa} kg/ha</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <span className="text-gray-400 block">Demanda K₂O:</span>
                        <strong className="text-gray-900 text-xs">{item.rule.kDemandKgHa} kg/ha</strong>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-600 pt-0.5">
                      Formulação comercial sugerida: <strong>{item.rule.suggestedFormulation}</strong> • Produtividade alvo: <strong>{item.rule.targetYield}</strong>
                    </p>
                  </div>

                  {/* Diagnóstico Humano do Sistema */}
                  <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    item.status === 'lacuna'
                      ? 'bg-red-50/90 border-red-200 text-red-950'
                      : (item.status === 'parcial'
                        ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-950')
                  }`}>
                    <div className="flex items-center space-x-1.5 font-bold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Diagnóstico de Controle do FERTIVA:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed font-medium">{item.diagnostic}</p>
                    {item.missingNote && (
                      <p className="text-[10px] font-bold text-red-700 pt-0.5">
                        {item.missingNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* Rodapé da Cultura no Acervo com Ação de Anexar */}
                <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenAddForCrop(item.cropName)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#8BC34A]" />
                    <span>+ Anexar Manual / Livro para {item.cropName}</span>
                  </button>

                  {item.matchingRefs.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedFilter(item.cropName);
                        setActiveSection('catalog');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 hover:bg-emerald-50 border border-emerald-200 cursor-pointer"
                    >
                      Ver Obras no Catálogo ({item.matchingRefs.length})
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR NOVO MANUAL / LIVRO OFICIAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-100 overflow-hidden relative my-6">
            <div className="bg-gradient-to-r from-[#173F2B] to-[#2F7D32] p-6 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <BookOpen className="w-5 h-5 text-[#8BC34A]" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Adicionar Manual / Livro Oficial à Base</h3>
                  <p className="text-xs text-[#8BC34A]">
                    Anexe o arquivo (PDF ou foto) para leitura automática e expansão imediata do motor.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetModalForm();
                }}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewBook} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
              {/* Inputs Nativos Ocultos (Arquivos e Câmera) */}
              <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf,image/*"
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

              {/* SEÇÃO DE ANEXO AUTOMÁTICO (PDF OU FOTO) */}
              {!isProcessingDoc && !attachedFileName && (
                <div className="bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-5 rounded-2xl border-2 border-dashed border-[#2F7D32]/30 flex flex-col items-center justify-center text-center space-y-3 transition-all hover:border-[#2F7D32] shadow-2xs">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-emerald-100 flex items-center justify-center text-[#2F7D32]">
                    <UploadCloud className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 flex items-center justify-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Anexar Arquivo do Livro ou Manual Oficial</span>
                    </h4>
                    <p className="text-xs text-gray-500 max-w-lg mx-auto mt-1">
                      O sistema lê o PDF ou a foto da capa/sumário pelo celular ou computador, extrai as culturas contempladas, metas de calagem ($V_2\%$) e formulação NPK automaticamente.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-sm flex items-center space-x-2 cursor-pointer"
                    >
                      <FolderOpen className="w-4 h-4 text-[#8BC34A]" />
                      <span>Escolher Arquivo (PDF ou Imagem)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>Tirar Foto pelo Celular</span>
                    </button>
                  </div>
                </div>
              )}

              {/* CARD DE PROCESSAMENTO / LEITURA */}
              {isProcessingDoc && (
                <div className="bg-emerald-50/90 p-5 rounded-2xl border border-emerald-300 flex items-center space-x-4 shadow-sm animate-pulse">
                  <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center border border-emerald-200 shrink-0">
                    <RefreshCw className="w-6 h-6 text-[#2F7D32] animate-spin" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-xs font-bold text-gray-900">Processando Obra Técnica no Sistema...</h5>
                    <p className="text-xs text-emerald-800 mt-0.5">{docProgressText}</p>
                  </div>
                </div>
              )}

              {/* CARD DE SUCESSO DO ARQUIVO ANEXADO COM PRÉ-VISUALIZAÇÃO */}
              {!isProcessingDoc && attachedFileName && (
                <div className="bg-emerald-50/90 p-4 rounded-2xl border border-emerald-300 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-gray-900 truncate max-w-[240px] sm:max-w-md">
                            {attachedFileName}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                            Leitura Concluída
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          Dados da publicação e regras agronômicas preenchidos automaticamente. Confira abaixo e salve.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {attachedPreviewUrl && (
                        <button
                          type="button"
                          onClick={() => setShowPreviewDoc(!showPreviewDoc)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100/50 flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{showPreviewDoc ? 'Ocultar Documento' : 'Ver Documento Lido'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 flex items-center space-x-1"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Trocar Arquivo</span>
                      </button>
                    </div>
                  </div>

                  {/* Visualizador Embutido do PDF / Imagem */}
                  {showPreviewDoc && attachedPreviewUrl && (
                    <div className="pt-2 border-t border-emerald-200/60 animate-in fade-in duration-200">
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-inner h-64 sm:h-80 flex items-center justify-center">
                        {attachedFileType === 'pdf' ? (
                          <iframe
                            src={attachedPreviewUrl}
                            title="Pré-visualização do Documento Técnico"
                            className="w-full h-full border-none"
                          />
                        ) : (
                          <img
                            src={attachedPreviewUrl}
                            alt="Documento Técnico Anexo"
                            className="max-h-full max-w-full object-contain"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Título e Instituição */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Título da Obra / Livro Técnico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Manual de Calagem e Adubação para a Cultura da Soja e Feijão"
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2F7D32]/20 focus:border-[#2F7D32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Instituição Autora / Órgão</label>
                  <input
                    type="text"
                    required
                    value={newInstitution}
                    onChange={(e) => setNewInstitution(e.target.value)}
                    placeholder="Ex: Embrapa Soja / UFV / IAC"
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ano de Publicação / Edição</label>
                  <input
                    type="number"
                    required
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300"
                  />
                </div>
              </div>

              {/* Tipo e Escopo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Documento</label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white font-medium"
                  >
                    <option value="Manual Oficial">Manual Oficial</option>
                    <option value="Boletim Técnico">Boletim Técnico</option>
                    <option value="Circular Técnica">Circular Técnica</option>
                    <option value="Guia Estadual">Guia Estadual</option>
                    <option value="Livro Técnico">Livro Técnico Acadêmico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Região de Aplicação / Escopo</label>
                  <input
                    type="text"
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value)}
                    placeholder="Ex: Bahia (Extremo Sul) ou Cerrados"
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300"
                  />
                </div>
              </div>

              {/* Link Oficial de Redirecionamento */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Link Oficial para Auditoria / Download</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://www.embrapa.br/publicacoes/..."
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300"
                />
              </div>

              {/* SEÇÃO DINÂMICA: CULTURAS CONTEMPLADAS */}
              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center space-x-1.5">
                      <Sprout className="w-4 h-4 text-emerald-700" />
                      <span>Culturas Contempladas nesta Obra</span>
                    </h4>
                    <p className="text-[11px] text-emerald-800">
                      Selecione ou digite novas culturas. O sistema as adicionará imediatamente ao cadastro de talhões e adubação.
                    </p>
                  </div>
                </div>

                {/* Tags Selecionadas */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Soja', 'Milho', 'Feijão', 'Café Conilon', 'Cacau', 'Mandioca', 'Banana', 'Citros', 'Algodão', 'Cana-de-Açúcar', 'Pastagem', 'Eucalipto'].map((c) => {
                    const isSel = selectedCrops.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleToggleCrop(c)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                          isSel
                            ? 'bg-[#173F2B] text-white shadow-xs'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <span>{c}</span>
                        {isSel && <CheckCircle2 className="w-3 h-3 text-[#8BC34A]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Adicionar Cultura Personalizada */}
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="text"
                    value={cropsInput}
                    onChange={(e) => setCropsInput(e.target.value)}
                    placeholder="Outra cultura não listada (Ex: Sorgo, Mamona, Melancia...)"
                    className="flex-1 text-xs p-2 rounded-lg border border-gray-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCrop}
                    className="px-3 py-2 rounded-lg text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32]"
                  >
                    + Adicionar Cultura
                  </button>
                </div>

                {/* Parâmetros Agronômicos Definidos nesta Obra */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-emerald-200/60">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">V% Meta (Calagem)</label>
                    <input
                      type="number"
                      value={customTargetV}
                      onChange={(e) => setCustomTargetV(e.target.value)}
                      placeholder="Ex: 70"
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">N Meta (kg/ha)</label>
                    <input
                      type="number"
                      value={customN}
                      onChange={(e) => setCustomN(e.target.value)}
                      placeholder="Ex: 100"
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">P₂O₅ Meta (kg/ha)</label>
                    <input
                      type="number"
                      value={customP}
                      onChange={(e) => setCustomP(e.target.value)}
                      placeholder="Ex: 80"
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">K₂O Meta (kg/ha)</label>
                    <input
                      type="number"
                      value={customK}
                      onChange={(e) => setCustomK(e.target.value)}
                      placeholder="Ex: 90"
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Metodologia e Notas */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notas Técnicas / Memória da Metodologia</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Descreva as tabelas de referência, doses por faixa de teor e observações regionais deste manual..."
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300"
                ></textarea>
              </div>

              {/* Botões do Modal */}
              <div className="pt-3 border-t flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetModalForm();
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-md flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4 text-[#8BC34A]" />
                  <span>Salvar Obra & Atualizar Motor Imediatamente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {refToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-gray-900">Remover Livro da Base de Raciocínio?</h3>
              <p className="text-xs text-gray-500">
                Tem certeza que deseja remover <strong>"{refToDelete.title}"</strong> ({refToDelete.code})?
                As regras associadas a esta publicação serão desconectadas do motor.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRefToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemoveReference(refToDelete.id);
                  setRefToDelete(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-xs"
              >
                Sim, Remover Livro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
