import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  FileSpreadsheet,
  Activity,
  Layers,
  Wheat,
  BookOpen,
  FileText,
  ShieldAlert,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { UserAccount } from '../types';

export type NavTab =
  | 'dashboard'
  | 'properties'
  | 'soil-entry'
  | 'interpretation'
  | 'corrections'
  | 'fertilization'
  | 'library'
  | 'reports'
  | 'admin';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: UserAccount;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser
}) => {
  const isGuilhermeAdmin =
    currentUser.name.toLowerCase().includes('guilherme') ||
    currentUser.email.toLowerCase().includes('guilherme') ||
    currentUser.role === 'admin';

  const baseNavItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard, desc: 'Visão executiva e alertas' },
    { id: 'properties', label: 'Propriedades & Talhões', icon: MapPin, desc: 'Fazendas e áreas mapeadas' },
    { id: 'soil-entry', label: 'Análises de Solo & OCR', icon: FileSpreadsheet, desc: 'Cadastro manual e laudos' },
    { id: 'interpretation', label: 'Diagnóstico Químico', icon: Activity, desc: 'Classificação e semáforo' },
    { id: 'corrections', label: 'Calagem & Gessagem', icon: Layers, desc: 'Correção de solo e memória' },
    { id: 'fertilization', label: 'Adubação & Nutrição', icon: Wheat, desc: 'Culturas e adubos comerciais' },
    { id: 'library', label: 'Biblioteca Técnica', icon: BookOpen, desc: 'Manuais oficiais com links' },
    { id: 'reports', label: 'Relatórios & Laudos', icon: FileText, desc: 'Emissão técnica com snapshot' }
  ];

  // O Painel Administrativo SÓ fica disponível para o Guilherme
  const navItems = isGuilhermeAdmin
    ? [
        ...baseNavItems,
        {
          id: 'admin',
          label: 'Painel Administrativo',
          icon: ShieldAlert,
          desc: 'Exclusivo Guilherme (Master)'
        }
      ]
    : baseNavItems;

  return (
    <aside className="w-64 bg-white border-r border-gray-200/90 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] shadow-xs">
      {/* Navegação Principal */}
      <div className="p-3.5 space-y-1">
        <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Navegação do Sistema
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isAdminItem = item.id === 'admin';

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as NavTab)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                isActive
                  ? (isAdminItem
                    ? 'bg-purple-900 text-white shadow-sm'
                    : 'bg-[#173F2B] text-white shadow-sm')
                  : (isAdminItem
                    ? 'text-purple-900 hover:bg-purple-50 bg-purple-50/40 border border-purple-200'
                    : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900')
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? (isAdminItem ? 'text-purple-300' : 'text-[#8BC34A]')
                      : (isAdminItem ? 'text-purple-700' : 'text-gray-500')
                  }`}
                />
                <div className="truncate">
                  <div className="leading-tight truncate">{item.label}</div>
                  <div
                    className={`text-[10px] leading-tight truncate mt-0.5 ${
                      isActive ? 'text-gray-200' : (isAdminItem ? 'text-purple-600' : 'text-gray-400')
                    }`}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>
              {isActive && (
                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 ml-1 ${
                    isAdminItem ? 'text-purple-300' : 'text-[#8BC34A]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Região e Contexto de Validação (Bahia) */}
      <div className="mt-auto p-4 border-t border-gray-100 bg-gray-50/70">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-gray-800">Implantação: Bahia</span>
        </div>
        <p className="text-[11px] text-gray-500 mt-1 leading-snug">
          Extremo Sul, Oeste e Recôncavo.
          <br />
          Cálculos determinísticos e validados.
        </p>
      </div>
    </aside>
  );
};
