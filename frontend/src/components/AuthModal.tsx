import React, { useState } from 'react';
import { UserAccount, UserRole } from '../types';
import { Sprout, Lock, Mail, User, ShieldCheck, MapPin, Building, ArrowRight, X, KeyRound, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserAccount) => void;
  onRegister: (user: UserAccount, farmName?: string, farmArea?: number) => void;
  usersList: UserAccount[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  usersList
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Form de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Form de Registro
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('produtor');
  const [regCrea, setRegCrea] = useState('');
  const [regCity, setRegCity] = useState('Eunápolis');
  const [regFarmName, setRegFarmName] = useState('');
  const [regFarmArea, setRegFarmArea] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const found = usersList.find((u) => u.email.toLowerCase() === loginEmail.toLowerCase());
    if (found) {
      onLogin(found);
      onClose();
    } else {
      // Se não encontrar exatamente, cria sessão como produtor ou admin se nome for guilherme
      const isGuilherme = loginEmail.toLowerCase().includes('guilherme');
      const newUser: UserAccount = {
        id: `user-${Date.now()}`,
        name: isGuilherme ? 'Guilherme' : loginEmail.split('@')[0],
        email: loginEmail,
        role: isGuilherme ? 'admin' : 'produtor',
        tier: isGuilherme ? 'consultoria' : 'free',
        city: 'Bahia',
        state: 'BA',
        createdAt: new Date().toISOString().split('T')[0]
      };
      onLogin(newUser);
      onClose();
    }
  };

  const handleQuickLogin = (email: string) => {
    const user = usersList.find((u) => u.email === email);
    if (user) {
      onLogin(user);
      onClose();
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name: regName,
      email: regEmail,
      role: regRole,
      tier: 'free',
      creaCrmv: regRole === 'profissional' ? regCrea : undefined,
      city: regCity,
      state: 'BA',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const area = regFarmArea ? parseFloat(regFarmArea) : undefined;
    onRegister(newUser, regFarmName || undefined, area);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Topo com Branding Premium */}
        <div className="bg-gradient-to-r from-[#173F2B] to-[#2F7D32] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none"></div>
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-2 border border-white/20 shadow-md">
            <Sprout className="w-7 h-7 text-[#8BC34A]" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">FERTIVA</h2>
          <p className="text-xs text-[#8BC34A] font-medium">Plataforma de Inteligência em Fertilidade do Solo</p>
        </div>

        {/* Alternador de Abas */}
        <div className="flex border-b border-gray-200 bg-gray-50/50">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              tab === 'login'
                ? 'border-[#2F7D32] text-[#173F2B] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Acessar Minha Conta
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              tab === 'register'
                ? 'border-[#2F7D32] text-[#173F2B] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Criar Nova Conta
          </button>
        </div>

        {/* CONTEÚDO DA ABA LOGIN */}
        {tab === 'login' && (
          <div className="p-6 space-y-5">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail Profissional ou Rural</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com.br"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2F7D32]/30 focus:border-[#2F7D32]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-700">Senha de Acesso</label>
                  <a href="#recuperar" onClick={(e) => { e.preventDefault(); alert('Instruções de recuperação de senha enviadas ao e-mail informado.'); }} className="text-[11px] text-[#2F7D32] hover:underline">
                    Esqueceu a senha?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2F7D32]/30 focus:border-[#2F7D32]"
                  />
                </div>
              </div>

              {loginError && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">{loginError}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <span>Entrar no Fertiva</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Login com Google via Firebase */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const { firebaseLoginGoogle, isFirebaseActive } = await import('../lib/firebase');
                    if (isFirebaseActive()) {
                      const user = await firebaseLoginGoogle();
                      if (user) {
                        onLogin(user);
                        onClose();
                      }
                    } else {
                      // Login com conta Google demonstrativo / instantâneo
                      const user: UserAccount = {
                        id: `user-google-${Date.now()}`,
                        name: 'Produtor Google',
                        email: 'produtor@gmail.com',
                        role: 'produtor',
                        tier: 'pro',
                        createdAt: new Date().toISOString()
                      };
                      onLogin(user);
                      onClose();
                    }
                  } catch (err: any) {
                    alert('Autenticação Firebase: ' + (err.message || 'Erro ao conectar'));
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Entrar com Conta Google (Firebase)</span>
              </button>
            </div>

            {/* Atalho Rápido para o Guilherme */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleQuickLogin('guilherme@fertiva.com.br')}
                className="w-full p-2.5 rounded-xl border border-[#2F7D32]/40 bg-emerald-50/60 hover:bg-emerald-100 text-left transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#173F2B]" />
                  <div>
                    <span className="font-bold text-xs text-[#173F2B] block">Entrar como Guilherme (Administrador Geral)</span>
                    <span className="text-[10px] text-gray-500">Acesso completo e Painel Administrativo</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#2F7D32]" />
              </button>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA REGISTRO */}
        {tab === 'register' && (
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: João da Silva Santos"
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#2F7D32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="seu.email@fazenda.com"
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#2F7D32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Senha</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#2F7D32]"
                  />
                </div>
              </div>

              {/* Tipo de Perfil */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Seu Perfil de Atuação</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('produtor')}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-all ${
                      regRole === 'produtor'
                        ? 'border-[#2F7D32] bg-emerald-50 text-[#173F2B] ring-1 ring-[#2F7D32]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Produtor Rural
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('profissional')}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-all ${
                      regRole === 'profissional'
                        ? 'border-[#2F7D32] bg-emerald-50 text-[#173F2B] ring-1 ring-[#2F7D32]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Agrônomo / Técnico
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('estudante')}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-all ${
                      regRole === 'estudante'
                        ? 'border-[#2F7D32] bg-emerald-50 text-[#173F2B] ring-1 ring-[#2F7D32]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Estudante
                  </button>
                </div>
              </div>

              {/* Campo CREA se Profissional */}
              {regRole === 'profissional' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Registro CREA / CRMV</label>
                  <input
                    type="text"
                    required
                    value={regCrea}
                    onChange={(e) => setRegCrea(e.target.value)}
                    placeholder="Ex: CREA-BA 12345/D"
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#2F7D32]"
                  />
                </div>
              )}

              {/* Destaque para Produtor: Cadastrar Sua Fazenda Agora */}
              {regRole === 'produtor' && (
                <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-2.5">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-[#2F7D32]" />
                    <span className="text-xs font-bold text-[#173F2B] uppercase">Cadastrar Minha Fazenda (Opcional)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-0.5">Nome da Fazenda</label>
                      <input
                        type="text"
                        value={regFarmName}
                        onChange={(e) => setRegFarmName(e.target.value)}
                        placeholder="Ex: Fazenda Alvorada"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-0.5">Área Total (Hectares)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={regFarmArea}
                        onChange={(e) => setRegFarmArea(e.target.value)}
                        placeholder="Ex: 85.0"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Município (Bahia)</label>
                <select
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-gray-300"
                >
                  <option value="Eunápolis">Eunápolis (Extremo Sul)</option>
                  <option value="Itabela">Itabela</option>
                  <option value="Porto Seguro">Porto Seguro</option>
                  <option value="Teixeira de Freitas">Teixeira de Freitas</option>
                  <option value="Itamaraju">Itamaraju</option>
                  <option value="Luís Eduardo Magalhães">Luís Eduardo Magalhães (Oeste)</option>
                  <option value="Barreiras">Barreiras</option>
                  <option value="Ilhéus">Ilhéus (Sul da Bahia)</option>
                  <option value="Cruz das Almas">Cruz das Almas (Recôncavo)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-md flex items-center justify-center space-x-2 pt-3"
              >
                <span>Criar Conta e Começar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
