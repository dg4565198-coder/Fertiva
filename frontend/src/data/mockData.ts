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
    docType: 'Guia Estadual'
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
    docType: 'Manual Oficial'
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
    docType: 'Manual Oficial'
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
    docType: 'Boletim Técnico'
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
    docType: 'Circular Técnica'
  }
];
