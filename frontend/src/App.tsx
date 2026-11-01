import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';

import { DashboardView } from './views/DashboardView';
import { PropertiesView } from './views/PropertiesView';
import { SoilEntryView } from './views/SoilEntryView';
import { InterpretationView } from './views/InterpretationView';
import { CorrectionsView } from './views/CorrectionsView';
import { FertilizationView } from './views/FertilizationView';
import { LibraryView } from './views/LibraryView';
import { ReportsView } from './views/ReportsView';
import { AdminView } from './views/AdminView';

import { Property, Plot, SoilSample, UserAccount, SubscriptionTier, TechnicalReference } from './types';
import { INITIAL_USERS, DEMO_PROPERTIES, DEMO_PLOTS, DEMO_SOIL_SAMPLES, TECHNICAL_REFERENCES_CATALOG } from './data/mockData';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Base de Livros e Referências Técnicas (Persistida e Dinâmica)
  const [references, setReferences] = useState<TechnicalReference[]>(() => {
    const saved = localStorage.getItem('fertiva_technical_references');
    if (saved) {
      try {
        const parsed: TechnicalReference[] = JSON.parse(saved);
        const hasIac = parsed.some((r) => r.code === 'IAC_BOLETIM_208' || r.id === 'ref-iac-208');
        if (!hasIac) {
          const iacRef = TECHNICAL_REFERENCES_CATALOG.find((r) => r.code === 'IAC_BOLETIM_208');
          if (iacRef) {
            const updated = [iacRef, ...parsed];
            localStorage.setItem('fertiva_technical_references', JSON.stringify(updated));
            return updated;
          }
        }
        return parsed;
      } catch {
        // fallback
      }
    }
    return TECHNICAL_REFERENCES_CATALOG;
  });

  const handleAddReference = (newRef: TechnicalReference) => {
    setReferences((prev) => {
      const exists = prev.some((r) => r.id === newRef.id);
      const updated = exists ? prev.map((r) => (r.id === newRef.id ? newRef : r)) : [newRef, ...prev];
      localStorage.setItem('fertiva_technical_references', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveReference = (id: string) => {
    setReferences((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem('fertiva_technical_references', JSON.stringify(updated));
      return updated;
    });
  };

  // Lista de usuários registrados no sistema
  const [usersList, setUsersList] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('fertiva_users_list');
    if (saved) {
      try {
        const parsed: UserAccount[] = JSON.parse(saved);
        return parsed.map((u) => {
          if (u.id === 'user-admin-guilherme' && (u.email === 'guilherme@fertiva.com.br' || u.city === 'Salvador')) {
            return { ...u, email: '', city: '', state: '' };
          }
          return u;
        });
      } catch {}
    }
    return INITIAL_USERS;
  });

  // Usuário atualmente autenticado (Guilherme)
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem('fertiva_current_user');
    if (saved) {
      try {
        const parsed: UserAccount = JSON.parse(saved);
        if (parsed.id === 'user-admin-guilherme' && (parsed.email === 'guilherme@fertiva.com.br' || parsed.city === 'Salvador')) {
          return { ...parsed, email: '', city: '', state: '' };
        }
        return parsed;
      } catch {}
    }
    return INITIAL_USERS[0];
  });

  // Propriedades e talhões (persistidos no sistema)
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('fertiva_properties');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEMO_PROPERTIES;
  });

  const [plots, setPlots] = useState<Plot[]>(() => {
    const saved = localStorage.getItem('fertiva_plots');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEMO_PLOTS;
  });

  const [samples, setSamples] = useState<SoilSample[]>(() => {
    const saved = localStorage.getItem('fertiva_samples');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEMO_SOIL_SAMPLES;
  });

  // Amostra e talhão selecionados (persistidos)
  const [selectedSampleId, setSelectedSampleId] = useState<string>(() => {
    return localStorage.getItem('fertiva_selected_sample_id') || '';
  });

  const selectedSample = samples.find((s) => s.id === selectedSampleId) || samples[0] || null;
  const selectedPlot = plots.find((p) => p.id === selectedSample?.plotId) || plots[0] || null;
  const selectedProperty = properties.find((pr) => pr.id === selectedPlot?.propertyId) || properties[0] || null;

  // Busca amostra de subsuperfície compatível para o mesmo talhão (camada 20-40 cm)
  const subsurfaceSample = selectedSample
    ? samples.find((s) => s.plotId === selectedSample.plotId && s.depthStartCm >= 20 && s.id !== selectedSample.id) || null
    : null;

  // Login
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
  };

  // Cadastro de novo usuário + cadastro automático da fazenda se informado
  const handleRegister = (newUser: UserAccount, farmName?: string, farmArea?: number) => {
    setUsersList((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);

    if (farmName && farmArea) {
      const newFarm: Property = {
        id: `prop-${Date.now()}`,
        userId: newUser.id,
        name: farmName,
        totalAreaHa: farmArea,
        city: newUser.city || 'Eunápolis',
        state: 'BA',
        isDemo: false
      };
      setProperties((prev) => [newFarm, ...prev]);
    }
  };

  // Logout
  const handleLogout = () => {
    setIsAuthModalOpen(true);
  };

  // Atualização de plano de usuário
  const handleUpdateUserTier = (userId: string, newTier: SubscriptionTier) => {
    setUsersList((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, tier: newTier } : u));
      localStorage.setItem('fertiva_users_list', JSON.stringify(updated));
      return updated;
    });
    if (currentUser.id === userId) {
      setCurrentUser((prev) => {
        const updated = { ...prev, tier: newTier };
        localStorage.setItem('fertiva_current_user', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleUpdateUserProfile = (userId: string, updatedData: Partial<UserAccount>) => {
    setUsersList((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, ...updatedData } : u));
      localStorage.setItem('fertiva_users_list', JSON.stringify(updated));
      return updated;
    });
    if (currentUser.id === userId) {
      setCurrentUser((prev) => {
        const updated = { ...prev, ...updatedData };
        localStorage.setItem('fertiva_current_user', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleTierChangeDirect = (newTier: SubscriptionTier) => {
    handleUpdateUserTier(currentUser.id, newTier);
  };

  const handleAddProperty = (newProp: Property) => {
    setProperties((prev) => {
      const updated = [newProp, ...prev];
      localStorage.setItem('fertiva_properties', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddPlot = (newPlot: Plot) => {
    setPlots((prev) => {
      const updated = [newPlot, ...prev];
      localStorage.setItem('fertiva_plots', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddSample = (
    newSample: SoilSample,
    newPlotData?: { name: string; areaHa: number; currentCrop: string }
  ) => {
    if (newPlotData) {
      const defaultPropId = properties[0]?.id || `prop-${Date.now()}`;
      if (properties.length === 0) {
        const newFarm: Property = {
          id: defaultPropId,
          userId: currentUser.id,
          name: 'Minha Fazenda',
          totalAreaHa: newPlotData.areaHa * 2,
          city: currentUser.city || 'Eunápolis',
          state: 'BA',
          isDemo: false
        };
        setProperties([newFarm]);
        localStorage.setItem('fertiva_properties', JSON.stringify([newFarm]));
      }
      const newPlot: Plot = {
        id: newSample.plotId,
        propertyId: defaultPropId,
        name: newPlotData.name,
        areaHa: newPlotData.areaHa,
        currentCrop: newPlotData.currentCrop,
        isDemo: false
      };
      setPlots((prev) => {
        const updated = [newPlot, ...prev];
        localStorage.setItem('fertiva_plots', JSON.stringify(updated));
        return updated;
      });
    }

    setSamples((prev) => {
      const updated = [newSample, ...prev];
      localStorage.setItem('fertiva_samples', JSON.stringify(updated));
      return updated;
    });
    setSelectedSampleId(newSample.id);
    localStorage.setItem('fertiva_selected_sample_id', newSample.id);
  };

  const handleAddSamplesBatch = (
    newSamplesList: SoilSample[],
    newPlotsList?: Plot[]
  ) => {
    if (newPlotsList && newPlotsList.length > 0) {
      setPlots((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const toAdd = newPlotsList.filter((p) => !existingIds.has(p.id));
        const updated = [...toAdd, ...prev];
        localStorage.setItem('fertiva_plots', JSON.stringify(updated));
        return updated;
      });
    }

    setSamples((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const toAdd = newSamplesList.filter((s) => !existingIds.has(s.id));
      const updated = [...toAdd, ...prev];
      localStorage.setItem('fertiva_samples', JSON.stringify(updated));
      return updated;
    });

    if (newSamplesList.length > 0) {
      setSelectedSampleId(newSamplesList[0].id);
      localStorage.setItem('fertiva_selected_sample_id', newSamplesList[0].id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF8] text-[#1E293B]">
      {/* Topo / Barra de Navegação com Sessão de Usuário */}
      <Header
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onTierChange={handleTierChangeDirect}
      />

      {/* Modal de Autenticação / Troca de Usuário */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        usersList={usersList}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Menu Lateral de Navegação (Admin só para Guilherme) */}
        <div className="print:hidden">
          <Sidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            currentUser={currentUser}
          />
        </div>

        {/* Conteúdo Dinâmico por Aba */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {currentTab === 'dashboard' && (
            <DashboardView
              properties={properties}
              plots={plots}
              samples={samples}
              currentUser={currentUser}
              onNavigate={setCurrentTab}
              onSelectSample={(s) => setSelectedSampleId(s.id)}
              onOpenAddFarm={() => setCurrentTab('properties')}
            />
          )}

          {currentTab === 'properties' && (
            <PropertiesView
              properties={properties}
              plots={plots}
              currentUser={currentUser}
              references={references}
              onAddProperty={handleAddProperty}
              onAddPlot={handleAddPlot}
            />
          )}

          {currentTab === 'soil-entry' && (
            <SoilEntryView
              plots={plots}
              references={references}
              onAddSample={handleAddSample}
              onAddSamplesBatch={handleAddSamplesBatch}
              onNavigateToInterpretation={(s) => {
                setSelectedSampleId(s.id);
                localStorage.setItem('fertiva_selected_sample_id', s.id);
                setCurrentTab('interpretation');
              }}
            />
          )}

          {currentTab === 'interpretation' && (
            <InterpretationView
              sample={selectedSample}
              samplesList={samples}
              currentRole={currentUser.role}
              onSelectSample={(s) => {
                setSelectedSampleId(s.id);
                localStorage.setItem('fertiva_selected_sample_id', s.id);
              }}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'corrections' && (
            <CorrectionsView
              sample={selectedSample}
              subsurfaceSample={subsurfaceSample}
              plot={selectedPlot}
              references={references}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'fertilization' && (
            <FertilizationView
              sample={selectedSample}
              plot={selectedPlot}
              references={references}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'library' && (
            <LibraryView
              references={references}
              onAddReference={handleAddReference}
              onRemoveReference={handleRemoveReference}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              sample={selectedSample}
              plot={selectedPlot}
              property={selectedProperty}
              currentRole={currentUser.role}
            />
          )}

          {currentTab === 'admin' && (
            <AdminView
              currentUser={currentUser}
              usersList={usersList}
              propertiesList={properties}
              plotsList={plots}
              samplesList={samples}
              onUpdateUserTier={handleUpdateUserTier}
              onUpdateUserProfile={handleUpdateUserProfile}
              onOpenLogin={() => setIsAuthModalOpen(true)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
