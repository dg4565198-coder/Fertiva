import React, { useState } from 'react';
import { UserAccount, Property, Plot, SoilSample, SubscriptionTier } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Settings,
  History,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Filter,
  UserCheck,
  Ban,
  Building,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface AdminViewProps {
  currentUser: UserAccount;
  usersList: UserAccount[];
  propertiesList: Property[];
  plotsList: Plot[];
  samplesList: SoilSample[];
  onUpdateUserTier: (userId: string, newTier: SubscriptionTier) => void;
  onOpenLogin: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  usersList,
  propertiesList,
  plotsList,
  samplesList,
  onUpdateUserTier,
  onOpenLogin
}) => {
  const isGuilhermeAdmin =
    currentUser.name.toLowerCase().includes('guilherme') ||
    currentUser.email.toLowerCase().includes('guilherme') ||
    currentUser.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'produtor' | 'profissional' | 'estudante'>('all');
  const [activeTab, setActiveTab] = useState<'users' | 'rules' | 'metrics'>('users');

  // Se NÃO for o Guilherme, exibe tela de bloqueio e segurança estrita
  if (!isGuilhermeAdmin) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-red-200 shadow-sm max-w-lg mx-auto space-y-4 my-8">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Acesso Restrito ao Administrador Geral</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Este módulo é exclusivo para o administrador <strong>Guilherme</strong>. Somente ele possui autorização para auditar regras, visualizar a carteira completa de usuários e gerenciar os planos do sistema.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={onOpenLogin}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-xs"
          >
            Fazer Login como Guilherme
          </button>
        </div>
      </div>
    );
  }

  // Filtragem dos usuários para o Guilherme
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.city && u.city.toLowerCase().includes(searchTerm.toLowerCase()));

    if (roleFilter === 'produtor') return matchesSearch && u.role === 'produtor';
    if (roleFilter === 'profissional') return matchesSearch && u.role === 'profissional';
    if (roleFilter === 'estudante') return matchesSearch && u.role === 'estudante';
    return matchesSearch;
  });

  const totalHectares = propertiesList.reduce((acc, p) => acc + p.totalAreaHa, 0);

  return (
    <div className="space-y-6">
      {/* Topo Exclusivo do Guilherme */}
      <div className="bg-gradient-to-r from-[#173F2B] via-[#1E4B35] to-[#2F7D32] text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8BC34A] animate-ping"></span>
            <span className="text-[11px] font-bold tracking-widest text-[#8BC34A] uppercase">
              Painel Master de Controle
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-1">
            Olá, Guilherme! Controle Geral do Fertiva
          </h2>
          <p className="text-xs text-gray-200 mt-0.5">
            Acesso master: Gestão de usuários, governança das regras agronômicas e monitoramento da plataforma.
          </p>
        </div>

        <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-md border border-white/20">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'users' ? 'bg-[#8BC34A] text-[#173F2B] shadow-sm' : 'text-white hover:bg-white/10'
            }`}
          >
            Usuários Cadastrados ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'metrics' ? 'bg-[#8BC34A] text-[#173F2B] shadow-sm' : 'text-white hover:bg-white/10'
            }`}
          >
            Estatísticas Gerais
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'rules' ? 'bg-[#8BC34A] text-[#173F2B] shadow-sm' : 'text-white hover:bg-white/10'
            }`}
          >
            Regras & Auditoria
          </button>
        </div>
      </div>

      {/* METRICAS GERAIS DO SISTEMA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase block">Usuários Ativos</span>
          <span className="text-2xl font-extrabold text-gray-900">{usersList.length}</span>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">Produtores & Agrônomos</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase block">Fazendas Cadastradas</span>
          <span className="text-2xl font-extrabold text-[#173F2B]">{propertiesList.length}</span>
          <span className="text-[11px] text-gray-500 block mt-0.5">{totalHectares.toFixed(1)} ha totais</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase block">Talhões Mapeados</span>
          <span className="text-2xl font-extrabold text-[#2F7D32]">{plotsList.length}</span>
          <span className="text-[11px] text-gray-500 block mt-0.5">Áreas de cultivo</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase block">Laudos Processados</span>
          <span className="text-2xl font-extrabold text-emerald-700">{samplesList.length}</span>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">100% Determinísticos</span>
        </div>
      </div>

      {/* ABA 1: GESTÃO DE TODOS OS USUÁRIOS CADASTRADOS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Controle de Usuários e Assinaturas
              </h3>
              <p className="text-xs text-gray-500">
                Guilherme, aqui você pode visualizar todos os cadastrados e alterar o plano de cada usuário diretamente.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrar usuário ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 w-full focus:outline-none focus:ring-1 focus:ring-[#2F7D32]"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="text-xs p-1.5 rounded-lg border border-gray-300 font-semibold text-gray-700"
              >
                <option value="all">Todos os Perfis</option>
                <option value="produtor">Produtores</option>
                <option value="profissional">Agrônomos</option>
                <option value="estudante">Estudantes</option>
              </select>
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-y border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Nome / Usuário</th>
                  <th className="p-3">E-mail</th>
                  <th className="p-3">Perfil</th>
                  <th className="p-3">Localização</th>
                  <th className="p-3">Data de Cadastro</th>
                  <th className="p-3">Plano Atual</th>
                  <th className="p-3 text-right">Alterar Plano (Ação Guilherme)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUser.id;
                  const userProperties = propertiesList.filter((p) => p.userId === user.id);

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                          <span>{user.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold bg-[#173F2B] text-white px-1.5 rounded">
                              Você
                            </span>
                          )}
                        </div>
                        {user.creaCrmv && (
                          <span className="text-[10px] text-gray-400 block">{user.creaCrmv}</span>
                        )}
                        {userProperties.length > 0 && (
                          <span className="text-[10px] text-emerald-700 font-medium block">
                            {userProperties.length} fazenda(s) vinculada(s)
                          </span>
                        )}
                      </td>

                      <td className="p-3 font-mono text-[11px] text-gray-600">{user.email}</td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : (user.role === 'produtor' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                        }`}>
                          {user.role}
                        </span>
                      </td>

                      <td className="p-3 text-gray-600">{user.city || 'Bahia'} - {user.state || 'BA'}</td>

                      <td className="p-3 text-gray-500 font-mono text-[11px]">{user.createdAt}</td>

                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          user.tier === 'consultoria'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : (user.tier === 'pro' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200')
                        }`}>
                          {user.tier}
                        </span>
                      </td>

                      {/* Controle de Plano */}
                      <td className="p-3 text-right">
                        <select
                          value={user.tier}
                          onChange={(e) => onUpdateUserTier(user.id, e.target.value as SubscriptionTier)}
                          className="text-[11px] font-bold p-1 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2F7D32]"
                        >
                          <option value="free">Mudar para Free</option>
                          <option value="pro">Mudar para Pro ⭐</option>
                          <option value="consultoria">Mudar para Consultoria 💎</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 2: ESTATÍSTICAS GERAIS E GEOGRÁFICAS */}
      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase">Distribuição Territorial na Bahia</h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Extremo Sul (Eunápolis, Itabela, Porto Seguro)</span>
                  <span className="font-bold text-[#173F2B]">65% das fazendas</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#173F2B] h-full w-[65%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Oeste Baiano (Luís Eduardo Magalhães, Barreiras)</span>
                  <span className="font-bold text-[#2F7D32]">20% das fazendas</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#2F7D32] h-full w-[20%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Sul / Litoral Cacaueiro (Ilhéus, Itabuna)</span>
                  <span className="font-bold text-[#8BC34A]">15% das fazendas</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#8BC34A] h-full w-[15%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase">Culturas Prioritárias em Monitoramento</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Milho Grão / Silagem</span>
                <span className="text-base font-bold text-gray-900">42% dos talhões</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Café Conilon</span>
                <span className="text-base font-bold text-gray-900">28% dos talhões</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Cacau Cabruca</span>
                <span className="text-base font-bold text-gray-900">18% dos talhões</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Pastagens & Eucalipto</span>
                <span className="text-base font-bold text-gray-900">12% dos talhões</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: REGRAS AGRONÔMICAS E GOVERNANÇA */}
      {activeTab === 'rules' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase">Governança do Motor Agronômico</h3>
              <p className="text-xs text-gray-500">
                Regras determinísticas ativas no motor Python / TypeScript.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">Regra de Calagem: Saturação por Bases (V%)</p>
                <p className="text-gray-500">Fórmula: NC = [CTC * (V2 - V1)] / (100 * (PRNT/100)) • Versão 1.0</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Ativa & Aprovada</span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">Trava de Segurança: Gessagem Subsuperficial Obrigatória (20-40 cm)</p>
                <p className="text-gray-500">Critérios Sousa & Lobato (Ca &lt; 0.4 ou Al &gt; 0.5 ou m% &gt; 20%) • Versão 1.0</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Ativa & Aprovada</span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">Adubação NPK para as 6 Culturas da Bahia</p>
                <p className="text-gray-500">Milho, Café, Cacau, Mandioca, Pastagens, Eucalipto • Versão 1.0</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Ativa & Aprovada</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
