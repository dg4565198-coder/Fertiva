import React, { useState } from 'react';
import { TECHNICAL_REFERENCES_CATALOG } from '../data/mockData';
import { TechnicalReference } from '../types';
import {
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Search,
  Building2,
  FileText,
  BadgeCheck,
  Calendar,
  Lock
} from 'lucide-react';

export const LibraryView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ba' | 'mg' | 'es' | 'embrapa'>('all');

  const filteredRefs = TECHNICAL_REFERENCES_CATALOG.filter((ref: TechnicalReference) => {
    const matchesSearch =
      ref.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.scope.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedFilter === 'ba') return matchesSearch && (ref.scope.includes('Bahia') || ref.code.includes('BAHIA') || ref.code.includes('CEPLAC'));
    if (selectedFilter === 'mg') return matchesSearch && ref.code.includes('CFSEMG');
    if (selectedFilter === 'es') return matchesSearch && ref.code.includes('INCAPER');
    if (selectedFilter === 'embrapa') return matchesSearch && ref.code.includes('EMBRAPA');
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Topo com Título e Apresentação Profissional */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#173F2B] flex items-center justify-center border border-emerald-200">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight font-sans">
              Biblioteca Técnica & Referências Oficiais
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Todas as regras e fórmulas da Fertiva são vinculadas a manuais estaduais e publicações de órgãos agronômicos oficiais. Acesse os links institucionais para auditoria e conferência dos dados.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <BadgeCheck className="w-3.5 h-3.5 mr-1 text-[#2F7D32]" />
            100% Fontes Verificadas
          </span>
        </div>
      </div>

      {/* Faixa Institucional de Confiabilidade e Governança */}
      <div className="bg-gradient-to-r from-[#173F2B] to-[#24543B] text-white p-5 rounded-2xl border border-[#2F7D32] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#8BC34A]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8BC34A]">
              Transparência & Rastreabilidade Agronômica
            </h3>
          </div>
          <p className="text-xs text-gray-200 max-w-2xl leading-relaxed">
            Nenhuma recomendação do Fertiva é arbitrária. Cada card abaixo possui o link oficial para você acessar o portal do órgão de pesquisa (Embrapa, Incaper, CFSEMG, SEAGRI-BA, CEPLAC) e constatar a autenticidade científica dos métodos.
          </p>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedFilter === 'all'
                ? 'bg-[#173F2B] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Todas as Fontes ({TECHNICAL_REFERENCES_CATALOG.length})
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
          <button
            onClick={() => setSelectedFilter('mg')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedFilter === 'mg'
                ? 'bg-[#173F2B] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Minas Gerais (CFSEMG)
          </button>
          <button
            onClick={() => setSelectedFilter('es')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedFilter === 'es'
                ? 'bg-[#173F2B] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Espírito Santo (Incaper)
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por manual, sigla ou autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs pl-8 pr-3 py-2 rounded-xl border border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#2F7D32]/20 focus:border-[#2F7D32] bg-white shadow-2xs"
          />
        </div>
      </div>

      {/* Grade de Cards com Links Oficiais Disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRefs.map((ref: TechnicalReference) => (
          <div
            key={ref.id}
            className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4 group hover:border-[#2F7D32]/50"
          >
            <div className="space-y-3">
              {/* Header do Card com Código e Tipo de Documento */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-[#173F2B] border border-emerald-200/60">
                    {ref.code}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {ref.docType}
                  </span>
                </div>
                <span className="text-xs font-extrabold text-[#2F7D32] bg-emerald-50/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Ano {ref.year}
                </span>
              </div>

              {/* Título Oficial */}
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#173F2B] transition-colors leading-snug">
                {ref.title}
              </h3>

              {/* Instituição Autora */}
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-medium">{ref.institution}</span>
              </div>

              {/* Notas e Escopo */}
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                {ref.notes}
              </p>
            </div>

            {/* Rodapé do Card com Status e Botões de Link Externo */}
            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-1.5 text-[11px] text-emerald-800 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{ref.status}</span>
              </div>

              {/* LINK OFICIAL EXTERNO OBRIGATÓRIO */}
              <a
                href={ref.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-xs shrink-0 group/link"
                title={`Acessar publicação oficial em ${ref.officialUrl}`}
              >
                <span>Acessar Fonte Oficial</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#8BC34A] group-hover/link:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
