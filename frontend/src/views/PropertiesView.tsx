import React, { useState } from 'react';
import { Property, Plot, UserAccount, TechnicalReference } from '../types';
import { getAllActiveCrops } from '../lib/agronomicEngine';
import {
  MapPin,
  Layers,
  Plus,
  Building,
  CheckCircle2,
  Sparkles,
  TreePine,
  ShieldCheck,
  Compass,
  ArrowRight
} from 'lucide-react';

interface PropertiesViewProps {
  properties: Property[];
  plots: Plot[];
  currentUser: UserAccount;
  references?: TechnicalReference[];
  onAddProperty: (prop: Property) => void;
  onAddPlot: (plot: Plot) => void;
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({
  properties,
  plots,
  currentUser,
  references,
  onAddProperty,
  onAddPlot
}) => {
  const availableCrops = getAllActiveCrops(references);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '');
  const [showPropModal, setShowPropModal] = useState(false);
  const [showPlotModal, setShowPlotModal] = useState(false);

  // Formulário Propriedade
  const [newPropName, setNewPropName] = useState('');
  const [newPropArea, setNewPropArea] = useState('');
  const [newPropCity, setNewPropCity] = useState(currentUser.city || 'Eunápolis');
  const [newPropState] = useState('BA');

  // Formulário Talhão
  const [newPlotName, setNewPlotName] = useState('');
  const [newPlotArea, setNewPlotArea] = useState('');
  const [newPlotCrop, setNewPlotCrop] = useState(availableCrops[0] || 'Milho');
  const [newPlotTexture, setNewPlotTexture] = useState<'Argiloso' | 'Textura Média' | 'Arenoso'>('Argiloso');

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || properties[0];
  const propertyPlots = plots.filter((pl) => pl.propertyId === selectedProperty?.id);
  const plotsTotalArea = propertyPlots.reduce((acc, pl) => acc + pl.areaHa, 0);

  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName || !newPropArea) return;

    const prop: Property = {
      id: `prop-${Date.now()}`,
      userId: currentUser.id,
      name: newPropName,
      totalAreaHa: parseFloat(newPropArea),
      city: newPropCity,
      state: newPropState,
      isDemo: false
    };

    onAddProperty(prop);
    setSelectedPropertyId(prop.id);
    setShowPropModal(false);
    setNewPropName('');
    setNewPropArea('');
  };

  const handleCreatePlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlotName || !newPlotArea || !selectedProperty) return;

    const plot: Plot = {
      id: `plot-${Date.now()}`,
      propertyId: selectedProperty.id,
      name: newPlotName,
      areaHa: parseFloat(newPlotArea),
      currentCrop: newPlotCrop,
      soilTextureDeclared: newPlotTexture,
      isDemo: false
    };

    onAddPlot(plot);
    setShowPlotModal(false);
    setNewPlotName('');
    setNewPlotArea('');
  };

  return (
    <div className="space-y-6">
      {/* Topo com Destaque para o Produtor */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#173F2B] flex items-center justify-center border border-emerald-200">
              <Building className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Gestão Territorial & Propriedades Rurais
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Cadastre suas fazendas e talhões para vincular seus laudos de solo e obter recomendações de adubação e calagem calculadas por hectare.
          </p>
        </div>

        {/* BOTÃO EM DESTAQUE: CADASTRAR MINHA FAZENDA */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPropModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] flex items-center space-x-2 transition-all shadow-md group"
          >
            <Plus className="w-4 h-4 text-[#8BC34A] group-hover:scale-110 transition-transform" />
            <span>Cadastrar Minha Fazenda</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Lista de Fazendas */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Fazendas Mapeadas ({properties.length})
            </span>
            <span className="text-[11px] text-gray-400">Bahia</span>
          </div>

          <div className="space-y-2.5">
            {properties.map((prop) => {
              const isSelected = prop.id === selectedProperty?.id;
              const propPlotsCount = plots.filter((pl) => pl.propertyId === prop.id).length;
              return (
                <div
                  key={prop.id}
                  onClick={() => setSelectedPropertyId(prop.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#2F7D32] bg-emerald-50/40 ring-1 ring-[#2F7D32] shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-gray-900">{prop.name}</h4>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{prop.city} - {prop.state}</span>
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md">
                      {prop.totalAreaHa} ha
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span>{propPlotsCount} talhões cadastrados</span>
                    {isSelected && (
                      <span className="text-[#2F7D32] font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Selecionada</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Talhões e Mapeamento da Fazenda */}
        <div className="lg:col-span-8 space-y-5">
          {selectedProperty ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                <div>
                  <h3 className="text-lg font-black text-gray-900">{selectedProperty.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Município: {selectedProperty.city} (BA) • Área Total da Fazenda: {selectedProperty.totalAreaHa} ha
                  </p>
                </div>

                <button
                  onClick={() => setShowPlotModal(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#2F7D32] text-white hover:bg-[#173F2B] flex items-center space-x-1.5 transition-all shadow-xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Novo Talhão</span>
                </button>
              </div>

              {/* Balanço de Área do Imóvel Rural */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200/80 text-xs">
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[10px]">Área sob Manejo / Talhões:</span>
                  <span className="font-extrabold text-gray-900 text-base">{plotsTotalArea.toFixed(1)} ha</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[10px]">Reserva / Outras Áreas:</span>
                  <span className="font-extrabold text-gray-900 text-base">
                    {Math.max(0, selectedProperty.totalAreaHa - plotsTotalArea).toFixed(1)} ha
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[10px]">Área Total Declarada:</span>
                  <span className="font-extrabold text-[#173F2B] text-base">{selectedProperty.totalAreaHa} ha</span>
                </div>
              </div>

              {/* Lista de Talhões */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Talhões Cadastrados ({propertyPlots.length})
                  </h4>
                  <span className="text-xs text-gray-400">Cada talhão possui histórico individual de laudos</span>
                </div>

                {propertyPlots.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
                    <Layers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-700">Nenhum talhão cadastrado nesta fazenda</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Clique em "Cadastrar Novo Talhão" acima para delimitar suas áreas de cultivo.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {propertyPlots.map((plot) => (
                      <div
                        key={plot.id}
                        className="p-4 rounded-xl border border-gray-200 bg-white hover:border-[#2F7D32]/50 hover:shadow-xs transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-sm text-gray-900">{plot.name}</h5>
                          <span className="text-xs font-extrabold text-[#173F2B] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            {plot.areaHa} ha
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p className="flex justify-between">
                            <span className="text-gray-400">Cultura Atual:</span>
                            <span className="font-semibold text-gray-900">{plot.currentCrop}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-gray-400">Textura do Solo:</span>
                            <span className="font-medium text-gray-700">{plot.soilTextureDeclared || 'Média'}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#173F2B] flex items-center justify-center mx-auto">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Nenhuma propriedade cadastrada ainda</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Cadastre sua fazenda ou sítio para mapear seus talhões e vincular suas análises laboratoriais de solo.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowPropModal(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] transition-all shadow-xs inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4 text-[#8BC34A]" />
                  <span>Cadastrar Minha Fazenda</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Cadastrar Minha Fazenda */}
      {showPropModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#173F2B] flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Cadastrar Minha Fazenda</h3>
            </div>

            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome da Propriedade / Fazenda</label>
                <input
                  type="text"
                  required
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  placeholder="Ex: Fazenda Santa Maria"
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2F7D32]/20 focus:border-[#2F7D32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Área Total (Hectares)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newPropArea}
                    onChange={(e) => setNewPropArea(e.target.value)}
                    placeholder="Ex: 120.0"
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2F7D32]/20 focus:border-[#2F7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estado</label>
                  <input
                    type="text"
                    disabled
                    value={newPropState}
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Município (Bahia)</label>
                <select
                  value={newPropCity}
                  onChange={(e) => setNewPropCity(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2F7D32]/20 focus:border-[#2F7D32]"
                >
                  <option value="Eunápolis">Eunápolis (Extremo Sul)</option>
                  <option value="Itabela">Itabela</option>
                  <option value="Porto Seguro">Porto Seguro</option>
                  <option value="Teixeira de Freitas">Teixeira de Freitas</option>
                  <option value="Itamaraju">Itamaraju</option>
                  <option value="Luís Eduardo Magalhães">Luís Eduardo Magalhães (Oeste)</option>
                  <option value="Barreiras">Barreiras</option>
                  <option value="Ilhéus">Ilhéus (Sul / Litoral)</option>
                  <option value="Cruz das Almas">Cruz das Almas</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowPropModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#173F2B] text-white hover:bg-[#2F7D32] rounded-lg shadow-sm"
                >
                  Salvar Minha Fazenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Talhão */}
      {showPlotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-gray-900 mb-1">Cadastrar Novo Talhão</h3>
            <p className="text-xs text-gray-500 mb-4">Em: {selectedProperty?.name}</p>
            <form onSubmit={handleCreatePlot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Identificação / Nome do Talhão</label>
                <input
                  type="text"
                  required
                  value={newPlotName}
                  onChange={(e) => setNewPlotName(e.target.value)}
                  placeholder="Ex: Talhão 01 - Baixada"
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#2F7D32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Área do Talhão (ha)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newPlotArea}
                    onChange={(e) => setNewPlotArea(e.target.value)}
                    placeholder="Ex: 25.0"
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#2F7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cultura Pretendida</label>
                  <select
                    value={newPlotCrop}
                    onChange={(e) => setNewPlotCrop(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300"
                  >
                    {availableCrops.map((c) => (
                      <option key={c} value={c}>
                        🌱 {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Textura do Solo Declarada</label>
                <select
                  value={newPlotTexture}
                  onChange={(e) => setNewPlotTexture(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300"
                >
                  <option value="Argiloso">Argiloso (&gt; 35% argila)</option>
                  <option value="Textura Média">Textura Média (15 a 35% argila)</option>
                  <option value="Arenoso">Arenoso (&lt; 15% argila)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowPlotModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#2F7D32] text-white hover:bg-[#173F2B] rounded-lg shadow-sm"
                >
                  Salvar Talhão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
