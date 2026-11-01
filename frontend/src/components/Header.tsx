import React from 'react';
import { UserAccount, SubscriptionTier } from '../types';
import { Sprout, ShieldCheck, LogIn, LogOut, Sparkles, Building, UserCheck } from 'lucide-react';

interface HeaderProps {
  currentUser: UserAccount;
  onOpenAuth: () => void;
  onLogout: () => void;
  onTierChange: (tier: SubscriptionTier) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onTierChange
}) => {
  const isGuilherme =
    currentUser.name.toLowerCase().includes('guilherme') ||
    currentUser.email.toLowerCase().includes('guilherme') ||
    currentUser.role === 'admin';

  return (
    <header className="bg-[#173F2B] text-white border-b border-[#2F7D32]/50 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Branding Oficial */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2F7D32] to-[#8BC34A] flex items-center justify-center shadow-md border border-[#8BC34A]/40">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black tracking-tight text-white font-sans">
                  FERTIVA
                </span>
                <span className="text-[11px] text-[#8BC34A] font-semibold hidden sm:inline-block tracking-wide uppercase">
                  Inteligência em fertilidade do solo
                </span>
              </div>
              <p className="text-[10px] text-gray-300 font-normal hidden md:block">
                Solo bem nutrido. Produção mais forte.
              </p>
            </div>
          </div>

          {/* Área do Usuário Autenticado */}
          <div className="flex items-center space-x-3">
            {/* Badge de Plano */}
            <div className="hidden sm:flex items-center space-x-1.5">
              <button
                onClick={() => onTierChange(currentUser.tier === 'free' ? 'pro' : 'free')}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 border transition-all ${
                  currentUser.tier === 'consultoria'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-xs'
                    : (currentUser.tier === 'pro'
                      ? 'bg-[#8BC34A] text-[#173F2B] border-[#8BC34A] shadow-xs'
                      : 'bg-white/10 text-gray-200 border-white/20 hover:bg-white/20')
                }`}
                title="Clique para alternar o nível do plano"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {currentUser.tier === 'consultoria' ? 'Consultoria Master' : (currentUser.tier === 'pro' ? 'Plano PRO' : 'Plano Gratuito')}
                </span>
              </button>
            </div>

            {/* Informações da Conta do Usuário */}
            <div className="flex items-center space-x-3 bg-[#0D2418] px-3.5 py-1.5 rounded-xl border border-[#2F7D32]/80">
              <div className="w-8 h-8 rounded-lg bg-[#2F7D32] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {currentUser.name.charAt(0)}
              </div>

              <div className="hidden sm:block text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-white truncate max-w-[140px]">
                    {currentUser.name}
                  </span>
                  {isGuilherme && (
                    <span className="text-[9px] font-extrabold bg-[#8BC34A] text-[#173F2B] px-1.5 py-0.2 rounded uppercase">
                      Admin
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 block truncate max-w-[140px]">
                  {currentUser.role === 'admin' ? 'Administrador Geral' : (currentUser.role === 'produtor' ? 'Produtor Rural' : 'Engenheiro Agrônomo')}
                </span>
              </div>

              {/* Botão Trocar / Sair */}
              <div className="flex items-center space-x-1 border-l border-white/10 pl-2">
                <button
                  onClick={onOpenAuth}
                  className="p-1 text-gray-300 hover:text-white rounded hover:bg-white/10 transition-all"
                  title="Trocar de Conta / Login"
                >
                  <LogIn className="w-4 h-4" />
                </button>
                <button
                  onClick={onLogout}
                  className="p-1 text-gray-300 hover:text-red-300 rounded hover:bg-white/10 transition-all"
                  title="Sair da Conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
