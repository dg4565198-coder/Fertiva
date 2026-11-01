import { Property, Plot, SoilSample, TechnicalReference, UserAccount } from '../types';

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-admin-guilherme',
    name: 'Guilherme',
    email: 'guilherme@fertiva.com.br',
    role: 'admin',
    tier: 'consultoria',
    city: 'Salvador',
    state: 'BA',
    createdAt: '2026-10-31'
  }
];

// O sistema agora inicia 100% limpo, sem nenhum dado fictício pré-carregado
export const DEMO_PROPERTIES: Property[] = [];
export const DEMO_PLOTS: Plot[] = [];
export const DEMO_SOIL_SAMPLES: SoilSample[] = [];

export const TECHNICAL_REFERENCES_CATALOG: TechnicalReference[] = [
  {
    id: 'ref-1',
    code: 'BAHIA_EXTREMO_SUL',
    title: 'Manual de Adubação e Calagem para o Estado da Bahia',
    institution: 'SEAGRI / EBDA Bahia',
    year: 2012,
    status: 'Prioridade Regional - Validada',
    scope: 'Estado da Bahia (Extremo Sul, Oeste e Recôncavo)',
    notes: 'Prioritária para calibragem agronômica regional no Extremo Sul baiano e solos de Tabuleiros Costeiros.',
    officialUrl: 'http://www.seagri.ba.gov.br',
    institutionUrl: 'http://www.agricultura.ba.gov.br/',
    docType: 'Guia Estadual',
    cropsCovered: ['Milho', 'Café Conilon', 'Cacau', 'Mandioca', 'Pastagem', 'Eucalipto'],
    cropRules: [
      {
        id: 'rule-milho-ba',
        cropName: 'Milho',
        category: 'grão',
        targetV: 70,
        targetYield: '8.0 a 10.0 t/ha',
        nDemandKgHa: 120,
        pDemandKgHa: 80,
        kDemandKgHa: 80,
        suggestedFormulation: '04-14-08',
        gypsumFactor: 50
      },
      {
        id: 'rule-cafe-ba',
        cropName: 'Café Conilon',
        category: 'perene',
        targetV: 60,
        targetYield: '60 a 80 sc/ha',
        nDemandKgHa: 220,
        pDemandKgHa: 60,
        kDemandKgHa: 200,
        suggestedFormulation: '20-05-20',
        gypsumFactor: 60
      },
      {
        id: 'rule-cacau-ba',
        cropName: 'Cacau',
        category: 'perene',
        targetV: 60,
        targetYield: '1.200 kg amêndoas/ha',
        nDemandKgHa: 70,
        pDemandKgHa: 50,
        kDemandKgHa: 70,
        suggestedFormulation: '10-10-10',
        gypsumFactor: 60
      },
      {
        id: 'rule-mandioca-ba',
        cropName: 'Mandioca',
        category: 'raiz',
        targetV: 50,
        targetYield: '25 a 30 t raízes/ha',
        nDemandKgHa: 40,
        pDemandKgHa: 50,
        kDemandKgHa: 50,
        suggestedFormulation: '04-14-08',
        gypsumFactor: 50
      },
      {
        id: 'rule-pastagem-ba',
        cropName: 'Pastagem',
        category: 'pastagem',
        targetV: 50,
        targetYield: 'Manutenção / Pastejo',
        nDemandKgHa: 50,
        pDemandKgHa: 50,
        kDemandKgHa: 40,
        suggestedFormulation: 'Superfosfato Simples',
        gypsumFactor: 50
      },
      {
        id: 'rule-eucalipto-ba',
        cropName: 'Eucalipto',
        category: 'florestal',
        targetV: 40,
        targetYield: '40 a 50 m³/ha.ano',
        nDemandKgHa: 40,
        pDemandKgHa: 70,
        kDemandKgHa: 60,
        suggestedFormulation: '06-30-06',
        gypsumFactor: 60
      }
    ]
  },
  {
    id: 'ref-2',
    code: 'CFSEMG_5APROX',
    title: 'Recomendações para o Uso de Corretivos e Fertilizantes em Minas Gerais - 5ª Aproximação',
    institution: 'Comissão de Fertilidade do Solo de MG (CFSEMG / UFV)',
    year: 1999,
    status: 'Referência Metodológica Alternativa',
    scope: 'Solos sob Cerrado e Mata Atlântica',
    notes: 'Referência metodológica clássica no Brasil para saturação por bases, CTC e extratores químicos.',
    officialUrl: 'https://www.cfsemg.org.br/',
    institutionUrl: 'https://www.ufv.br/',
    docType: 'Manual Oficial',
    cropsCovered: ['Milho', 'Café', 'Soja', 'Feijão', 'Cana-de-Açúcar', 'Pastagem'],
    cropRules: [
      {
        id: 'rule-soja-cfsemg',
        cropName: 'Soja',
        category: 'grão',
        targetV: 70,
        targetYield: '3.5 a 4.5 t/ha',
        nDemandKgHa: 20, // Fixação biológica
        pDemandKgHa: 80,
        kDemandKgHa: 90,
        suggestedFormulation: '02-20-20',
        gypsumFactor: 50
      },
      {
        id: 'rule-feijao-cfsemg',
        cropName: 'Feijão',
        category: 'grão',
        targetV: 65,
        targetYield: '2.5 a 3.5 t/ha',
        nDemandKgHa: 90,
        pDemandKgHa: 80,
        kDemandKgHa: 60,
        suggestedFormulation: '04-14-08',
        gypsumFactor: 50
      },
      {
        id: 'rule-cana-cfsemg',
        cropName: 'Cana-de-Açúcar',
        category: 'outros',
        targetV: 60,
        targetYield: '90 a 110 t colmos/ha',
        nDemandKgHa: 100,
        pDemandKgHa: 100,
        kDemandKgHa: 120,
        suggestedFormulation: '05-25-15',
        gypsumFactor: 50
      }
    ]
  },
  {
    id: 'ref-3',
    code: 'INCAPER_5APROX',
    title: 'Manual de Recomendação de Calagem e Adubação para o Espírito Santo - 5ª Aproximação',
    institution: 'Instituto Capixaba de Pesquisa, Assistência Técnica e Extensão Rural (Incaper)',
    year: 2007,
    status: 'Referência Alternativa Validada para Perenes',
    scope: 'Espírito Santo e faixa costeira da divisa BA/ES',
    notes: 'Especialmente calibrada para café conilon, eucalipto e cacau em condições edafoclimáticas limítrofes do Extremo Sul da Bahia.',
    officialUrl: 'https://incaper.es.gov.br/publicacoes',
    institutionUrl: 'https://incaper.es.gov.br/',
    docType: 'Manual Oficial',
    cropsCovered: ['Café Conilon', 'Cacau', 'Eucalipto', 'Pimenta-do-Reino', 'Banana'],
    cropRules: [
      {
        id: 'rule-banana-incaper',
        cropName: 'Banana',
        category: 'perene',
        targetV: 70,
        targetYield: '30 a 40 t/ha',
        nDemandKgHa: 180,
        pDemandKgHa: 60,
        kDemandKgHa: 300,
        suggestedFormulation: '15-05-30',
        gypsumFactor: 60
      },
      {
        id: 'rule-pimenta-incaper',
        cropName: 'Pimenta-do-Reino',
        category: 'perene',
        targetV: 65,
        targetYield: '4 a 6 t pimenta seca/ha',
        nDemandKgHa: 120,
        pDemandKgHa: 50,
        kDemandKgHa: 150,
        suggestedFormulation: '14-07-28',
        gypsumFactor: 60
      }
    ]
  },
  {
    id: 'ref-4',
    code: 'EMBRAPA_CERRADOS',
    title: 'Adubação Corretiva e Critérios de Gessagem (Sousa & Lobato)',
    institution: 'Empresa Brasileira de Pesquisa Agropecuária (Embrapa Cerrados)',
    year: 2004,
    status: 'Referência Nacional de Subsuperfície',
    scope: 'Critérios de Acidez Subsuperficial (20-40 cm) e Gessagem',
    notes: 'Padrão científico brasileiro para tomada de decisão em gessagem com base em cálcio e alumínio em profundidade.',
    officialUrl: 'https://www.embrapa.br/cerrados',
    institutionUrl: 'https://www.embrapa.br/',
    docType: 'Boletim Técnico',
    cropsCovered: ['Soja', 'Milho', 'Algodão', 'Pastagem'],
    cropRules: [
      {
        id: 'rule-algodao-embrapa',
        cropName: 'Algodão',
        category: 'grão',
        targetV: 70,
        targetYield: '280 a 320 @/ha',
        nDemandKgHa: 140,
        pDemandKgHa: 90,
        kDemandKgHa: 140,
        suggestedFormulation: '08-20-15',
        gypsumFactor: 50
      }
    ]
  },
  {
    id: 'ref-5',
    code: 'CEPLAC_CACAU',
    title: 'Manejo da Fertilidade e Nutrição do Cacaueiro no Sul da Bahia',
    institution: 'Comissão Executiva do Plano da Lavoura Cacaueira (CEPLAC / MAPA)',
    year: 2018,
    status: 'Referência Específica para Cacauicultura',
    scope: 'Região Cacaueira da Bahia (Ilhéus, Itabuna, Extremo Sul)',
    notes: 'Diretrizes técnicas para adubação de manutenção, parcelamento de potássio e manejo em sistema Cabruca.',
    officialUrl: 'https://www.gov.br/agricultura/pt-br/assuntos/ceplac',
    institutionUrl: 'https://www.gov.br/agricultura/pt-br',
    docType: 'Circular Técnica',
    cropsCovered: ['Cacau', 'Seringueira', 'Frutíferas Tropicais'],
    cropRules: [
      {
        id: 'rule-seringueira-ceplac',
        cropName: 'Seringueira',
        category: 'florestal',
        targetV: 50,
        targetYield: 'Produção látex seco',
        nDemandKgHa: 60,
        pDemandKgHa: 50,
        kDemandKgHa: 70,
        suggestedFormulation: '10-10-10',
        gypsumFactor: 60
      }
    ]
  }
];
