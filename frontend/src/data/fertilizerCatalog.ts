// Catálogo Oficial de Fertilizantes Minerais, Teores de Garantia e Solubilidade
// Fonte: Boletim Técnico 208, Instituto Agronômico de Campinas (IAC), 2011
// Autores: P.E. Trani e A.L. Trani (Fertilizantes: cálculo de fórmulas comerciais / Legislação MAPA)

export interface OfficialFertilizer {
  id: string;
  name: string;
  category: 'nitrogenado' | 'fosfatado' | 'potassico' | 'misto' | 'calcico_magnesiano' | 'micronutriente' | 'formulado';
  formulaChemical: string;
  nPercent: number;
  p2o5Percent: number;
  k2oPercent: number;
  caPercent?: number;
  mgPercent?: number;
  sPercent?: number;
  otherNutrients?: string;
  solubility20C?: string | number; // g/L em água
  solubility25C?: string | number;
  notes?: string;
  isCustom?: boolean;
}

export const OFFICIAL_FERTILIZERS: OfficialFertilizer[] = [
  // ================= NITROGENADOS =================
  {
    id: 'fert-ureia',
    name: 'Ureia Agrícola',
    category: 'nitrogenado',
    formulaChemical: 'CO(NH₂)₂',
    nPercent: 45,
    p2o5Percent: 0,
    k2oPercent: 0,
    solubility20C: 1030,
    solubility25C: 1190,
    notes: 'Fonte nitrogenada mais concentrada do mercado. Aplicar com solo úmido ou incorporar para evitar volatilização de amônia.'
  },
  {
    id: 'fert-sulfato-amonio',
    name: 'Sulfato de Amônio',
    category: 'nitrogenado',
    formulaChemical: '(NH₄)₂SO₄',
    nPercent: 20,
    p2o5Percent: 0,
    k2oPercent: 0,
    sPercent: 24,
    solubility20C: 710,
    solubility25C: '-',
    notes: 'Excelente fonte combinada de Nitrogênio (20%) e Enxofre (24%). Menor perda por volatilização que a ureia.'
  },
  {
    id: 'fert-nitrato-amonio',
    name: 'Nitrato de Amônio',
    category: 'nitrogenado',
    formulaChemical: 'NH₄NO₃',
    nPercent: 33,
    p2o5Percent: 0,
    k2oPercent: 0,
    solubility20C: 1950,
    solubility25C: '-',
    notes: 'Ação rápida (50% nítrico e 50% amoniacal). Alta solubilidade.'
  },
  {
    id: 'fert-nitrato-calcio',
    name: 'Nitrato de Cálcio',
    category: 'nitrogenado',
    formulaChemical: 'Ca(NO₃)₂',
    nPercent: 15,
    p2o5Percent: 0,
    k2oPercent: 0,
    caPercent: 20,
    solubility20C: 1220,
    solubility25C: 3410,
    notes: 'Fornece Cálcio solúvel (20%) e Nitrogênio nítrico (15%). Muito utilizado em fertirrigação e cafeicultura.'
  },
  {
    id: 'fert-nitrato-sodio',
    name: 'Nitrato de Sódio (Salitre do Chile)',
    category: 'nitrogenado',
    formulaChemical: 'NaNO₃',
    nPercent: 16,
    p2o5Percent: 0,
    k2oPercent: 0,
    solubility20C: 730,
    solubility25C: 920,
    notes: 'Nitrogênio 100% prontamente assimilável.'
  },

  // ================= FOSFATADOS =================
  {
    id: 'fert-super-simples',
    name: 'Superfosfato Simples (SS)',
    category: 'fosfatado',
    formulaChemical: 'Ca(H₂PO₄)₂.2H₂O + CaSO₄',
    nPercent: 0,
    p2o5Percent: 18,
    k2oPercent: 0,
    caPercent: 20,
    sPercent: 12,
    solubility20C: 20,
    notes: 'Adubo fosfatado clássico com excelente bônus de Cálcio (20%) e Enxofre sulfatado (12%). Ideal para solos com deficiência de S.'
  },
  {
    id: 'fert-super-triplo',
    name: 'Superfosfato Triplo (ST)',
    category: 'fosfatado',
    formulaChemical: 'Ca(H₂PO₄)₂.2H₂O',
    nPercent: 0,
    p2o5Percent: 46,
    k2oPercent: 0,
    caPercent: 12,
    sPercent: 1,
    solubility20C: 40,
    notes: 'Alta concentração de Fósforo (46% P₂O₅ solúvel). Economia de frete e volume operacional no plantio.'
  },
  {
    id: 'fert-termofosfato',
    name: 'Termofosfato Yoorin',
    category: 'fosfatado',
    formulaChemical: 'Silicato de Ca e Mg com fosfatos',
    nPercent: 0,
    p2o5Percent: 18,
    k2oPercent: 0,
    caPercent: 18,
    mgPercent: 7,
    otherNutrients: 'Silício + Micronutrientes (B, Zn, Cu, Mn)',
    notes: 'Fósforo de liberação gradual, insolúvel em água e solúvel em ácido cítrico. Não fixa facilmente no solo argiloso.'
  },
  {
    id: 'fert-fosfato-natural',
    name: 'Fosfato Natural Reativo (Arad / Gafsa)',
    category: 'fosfatado',
    formulaChemical: 'Ca₃(PO₄)₂',
    nPercent: 0,
    p2o5Percent: 29,
    k2oPercent: 0,
    caPercent: 32,
    notes: 'Liberação lenta. Efeito residual prolongado em solos ácidos.'
  },
  {
    id: 'fert-acido-fosforico',
    name: 'Ácido Fosfórico Agrícola',
    category: 'fosfatado',
    formulaChemical: 'H₃PO₄',
    nPercent: 0,
    p2o5Percent: 60,
    k2oPercent: 0,
    solubility20C: 460,
    solubility25C: 5480,
    notes: 'Usado principalmente em fertirrigação e correção de pH de calda.'
  },

  // ================= POTÁSSICOS =================
  {
    id: 'fert-kcl',
    name: 'Cloreto de Potássio (KCl)',
    category: 'potassico',
    formulaChemical: 'KCl',
    nPercent: 0,
    p2o5Percent: 0,
    k2oPercent: 60,
    solubility20C: 347,
    notes: 'Fonte potássica mais utilizada no agronegócio mundial (60% K₂O). Parcelar em solos arenosos para evitar perdas por lixiviação.'
  },
  {
    id: 'fert-sulfato-potassio',
    name: 'Sulfato de Potássio',
    category: 'potassico',
    formulaChemical: 'K₂SO₄',
    nPercent: 0,
    p2o5Percent: 0,
    k2oPercent: 50,
    sPercent: 18,
    solubility20C: 110,
    notes: 'Indicado para culturas sensíveis ao cloro (fumo, batata, hortaliças) e solos com déficit de enxofre.'
  },
  {
    id: 'fert-k-mag',
    name: 'Sulfato de Potássio e Magnésio (K-Mag)',
    category: 'potassico',
    formulaChemical: 'K₂SO₄.2MgSO₄',
    nPercent: 0,
    p2o5Percent: 0,
    k2oPercent: 21,
    mgPercent: 10,
    sPercent: 21,
    solubility20C: 250,
    notes: 'Fornece Potássio (21%), Magnésio (10%) e Enxofre (21%) solúveis com baixo índice salino.'
  },

  // ================= NITRO-FOSFATADOS & FOSFO-POTÁSSICOS =================
  {
    id: 'fert-map',
    name: 'Fosfato Monoamônico (MAP)',
    category: 'misto',
    formulaChemical: 'NH₄H₂PO₄',
    nPercent: 11,
    p2o5Percent: 52,
    k2oPercent: 0,
    solubility20C: 230,
    notes: 'Padrão ouro para plantio e adubação de arranque. Alta concentração combinada de Nitrogênio (11%) e Fósforo (52%).'
  },
  {
    id: 'fert-map-purificado',
    name: 'MAP Cristal Purificado',
    category: 'misto',
    formulaChemical: 'NH₄H₂PO₄',
    nPercent: 11,
    p2o5Percent: 60,
    k2oPercent: 0,
    solubility20C: 370,
    notes: 'Solubilidade máxima para fertirrigação e adubação foliar.'
  },
  {
    id: 'fert-dap',
    name: 'Fosfato Diamônico (DAP)',
    category: 'misto',
    formulaChemical: '(NH₄)₂HPO₄',
    nPercent: 18,
    p2o5Percent: 45,
    k2oPercent: 0,
    solubility20C: 430,
    notes: '18% de N e 45% de P₂O₅. Excelente arranque inicial para gramíneas.'
  },
  {
    id: 'fert-nitrato-potassio',
    name: 'Nitrato de Potássio (KNO₃)',
    category: 'misto',
    formulaChemical: 'KNO₃',
    nPercent: 13,
    p2o5Percent: 0,
    k2oPercent: 44,
    solubility20C: 320,
    notes: 'Combinação pura de Nitrogênio nítrico (13%) e Potássio (44%) sem cloro.'
  },
  {
    id: 'fert-mkp',
    name: 'Fosfato Monopotássico (MKP)',
    category: 'misto',
    formulaChemical: 'KH₂PO₄',
    nPercent: 0,
    p2o5Percent: 51,
    k2oPercent: 33,
    solubility20C: 230,
    solubility25C: 330,
    notes: 'Fornece 51% de P₂O₅ e 33% de K₂O de altíssima pureza e assimilação.'
  },

  // ================= CÁLCICOS E MAGNESIANOS =================
  {
    id: 'fert-gesso',
    name: 'Sulfato de Cálcio (Gesso Agrícola)',
    category: 'calcico_magnesiano',
    formulaChemical: 'CaSO₄.2H₂O',
    nPercent: 0,
    p2o5Percent: 0,
    k2oPercent: 0,
    caPercent: 18,
    sPercent: 16,
    solubility20C: 2.4,
    notes: 'Condicionador de subsuperfície: neutraliza alumínio tóxico em profundidade (20-40 cm) e carrega Cálcio e Enxofre.'
  },
  {
    id: 'fert-sulfato-magnesio',
    name: 'Sulfato de Magnésio',
    category: 'calcico_magnesiano',
    formulaChemical: 'MgSO₄.7H₂O',
    nPercent: 0,
    p2o5Percent: 0,
    k2oPercent: 0,
    mgPercent: 9.5,
    sPercent: 12,
    solubility20C: 710,
    notes: 'Correção rápida de carência de Magnésio e Enxofre via solo ou foliar.'
  },

  // ================= MICRONUTRIENTES =================
  {
    id: 'fert-acido-borico',
    name: 'Ácido Bórico',
    category: 'micronutriente',
    formulaChemical: 'H₃BO₃',
    nPercent: 0,
    p2o5Percent: 0,
    k2oPercent: 0,
    otherNutrients: '17% de Boro (B)',
    notes: 'Fonte solúvel de Boro para solo e foliar.'
  },
  {
    id: 'fert-sulfato-zinco',
    name: 'Sulfato de Zinco Mono-hidratado',
    category: 'micronutriente',
    formulaChemical: 'ZnSO₄.H₂O',
    nPercent: 0,
    p2o5Percent: 0,
    k2oPercent: 0,
    sPercent: 17,
    otherNutrients: '35% de Zinco (Zn)',
    solubility20C: 670,
    notes: 'Fonte clássica concentrada de Zinco e Enxofre para arranque de grãos.'
  },
  {
    id: 'fert-fte-br12',
    name: 'Silicatos Fracionados (Fritas / FTE BR-12)',
    category: 'micronutriente',
    formulaChemical: 'Silicatos de B, Cu, Fe, Mn, Mo, Zn',
    nPercent: 0,
    p2o5Percent: 0,
    k2oPercent: 0,
    otherNutrients: '9% Zn, 3% Fe, 2% Mn, 1.8% B, 0.8% Cu, 0.1% Mo',
    notes: 'Complexo de micronutrientes de liberação gradual no solo.'
  },

  // ================= FORMULADOS COMERCIAIS NPK REGISTRADOS =================
  {
    id: 'fert-npk-04-14-08',
    name: 'Formulado NPK 04-14-08',
    category: 'formulado',
    formulaChemical: 'Mistura N-P-K granulada',
    nPercent: 4,
    p2o5Percent: 14,
    k2oPercent: 8,
    caPercent: 6,
    sPercent: 4,
    notes: 'Fórmula tradicional no Brasil para adubação de plantio de grãos, tubérculos e hortaliças.'
  },
  {
    id: 'fert-npk-08-20-15',
    name: 'Formulado NPK 08-20-15',
    category: 'formulado',
    formulaChemical: 'Mistura N-P-K granulada',
    nPercent: 8,
    p2o5Percent: 20,
    k2oPercent: 15,
    notes: 'Formulação de alta tecnologia para milho e algodão em solos de média fertilidade.'
  },
  {
    id: 'fert-npk-05-25-15',
    name: 'Formulado NPK 05-25-15',
    category: 'formulado',
    formulaChemical: 'Mistura N-P-K granulada',
    nPercent: 5,
    p2o5Percent: 25,
    k2oPercent: 15,
    notes: 'Arranque pesado em fósforo para solos de abertura ou baixo teor de P.'
  },
  {
    id: 'fert-npk-20-05-20',
    name: 'Formulado NPK 20-05-20',
    category: 'formulado',
    formulaChemical: 'Mistura N-P-K granulada',
    nPercent: 20,
    p2o5Percent: 5,
    k2oPercent: 20,
    notes: 'Excelente para produção e pós-colheita em café conilon, citros e frutíferas.'
  },
  {
    id: 'fert-npk-00-20-20',
    name: 'Formulado NPK 00-20-20 (Sem Nitrogênio)',
    category: 'formulado',
    formulaChemical: 'Mistura P-K granulada',
    nPercent: 0,
    p2o5Percent: 20,
    k2oPercent: 20,
    notes: 'Desenvolvido especificamente para Soja e leguminosas inoculadas com Bradyrhizobium (FBN).'
  },
  {
    id: 'fert-npk-10-10-10',
    name: 'Formulado NPK 10-10-10',
    category: 'formulado',
    formulaChemical: 'Mistura N-P-K balanceada',
    nPercent: 10,
    p2o5Percent: 10,
    k2oPercent: 10,
    notes: 'Fórmula balanceada para manutenção, pastagens, seringueira e culturas perenes.'
  }
];
