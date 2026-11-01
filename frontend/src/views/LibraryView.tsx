import React, { useState } from 'react';
import { TechnicalReference, CropAgronomicRule } from '../types';
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
  ArrowRight
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refToDelete, setRefToDelete] = useState<TechnicalReference | null>(null);

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

    // Reseta form
    setNewTitle('');
    setNewInstitution('');
    setNewUrl('');
    setNewNotes('');
    setSelectedCrops(['Soja', 'Milho']);
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
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Sprout className="w-3.5 h-3.5 mr-1 text-[#2F7D32]" />
            <strong>{allLibraryCrops.length}</strong> Culturas Disponíveis
          </span>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-md flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 text-[#8BC34A]" />
            <span>+ Adicionar Manual / Livro Oficial</span>
          </button>
        </div>
      </div>

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

      {/* MODAL: ADICIONAR NOVO MANUAL / LIVRO OFICIAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden relative">
            <div className="bg-gradient-to-r from-[#173F2B] to-[#2F7D32] p-6 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <BookOpen className="w-5 h-5 text-[#8BC34A]" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Adicionar Manual / Livro Oficial à Base</h3>
                  <p className="text-xs text-[#8BC34A]">
                    Cadastre uma nova obra para cruzar regras e incorporar novas culturas ao sistema.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewBook} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
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
                  onClick={() => setIsAddModalOpen(false)}
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
