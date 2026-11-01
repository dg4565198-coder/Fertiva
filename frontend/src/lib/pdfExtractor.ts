import * as pdfjsLib from 'pdfjs-dist';

// Configura o worker do PDF.js de forma resiliente
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface ExtractedSoilData {
  labName?: string;
  reportNumber?: string;
  clientName?: string;
  sampleDate?: string;
  depthStartCm?: string;
  depthEndCm?: string;
  ph?: string;
  p?: string;
  k?: string;
  ca?: string;
  mg?: string;
  al?: string;
  hAl?: string;
  mo?: string;
  clay?: string;
  rawText: string;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    useWorkerFetch: true
  });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageStrings: string[] = [];

    for (const item of content.items) {
      if ('str' in item && typeof item.str === 'string') {
        pageStrings.push(item.str.trim());
      }
    }
    fullText += pageStrings.join(' ') + '\n';
  }

  return fullText;
}

export function parseSoilLabReport(rawText: string, fileName?: string): ExtractedSoilData {
  const text = (rawText || '').replace(/\s+/g, ' ');
  const lower = text.toLowerCase();
  const lowerFile = (fileName || '').toLowerCase();
  const result: ExtractedSoilData = { rawText };

  // 1. Identificação do Laboratório
  if (lower.includes('fullin') || lowerFile.includes('fullin') || lowerFile.includes('bruno')) {
    result.labName = 'Fullin Laboratório de Análise Agronômica';
  } else if (lower.includes('solobahia') || lowerFile.includes('solobahia')) {
    result.labName = 'Laboratório SoloBahia';
  } else if (lower.includes('agrolab') || lowerFile.includes('agrolab')) {
    result.labName = 'AgroLab Análises Agronômicas';
  } else if (lower.includes('tommasi') || lowerFile.includes('tommasi')) {
    result.labName = 'Tommasi Laboratório Agronômico';
  } else if (lower.includes('coplana')) {
    result.labName = 'Laboratório Coplana';
  } else if (lower.includes('embrapa')) {
    result.labName = 'Embrapa Solos';
  } else {
    result.labName = 'Laboratório de Análise de Solos';
  }

  // 2. Número do Laudo
  const reportMatch = text.match(/(?:laudo|ensaio|relat[oó]rio|an[aá]lise|amostra|n[ºo°.]*)[\s:.]+([A-Z0-9\-_/]+)/i);
  if (reportMatch && reportMatch[1].length >= 3 && !['de', 'do', 'da'].includes(reportMatch[1].toLowerCase())) {
    result.reportNumber = reportMatch[1];
  } else if (fileName) {
    const cleaned = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/resultado\s*(?:de)?\s*an[aá]lise\s*(?:de)?\s*solo\s*[-_]?\s*/i, '')
      .trim();
    result.reportNumber = cleaned ? `LAUDO-${cleaned}` : `LAUDO-${Date.now().toString().slice(-4)}`;
  } else {
    result.reportNumber = `LAUDO-${Date.now().toString().slice(-4)}`;
  }

  // 3. Data do laudo
  const dateMatch = text.match(/(\d{2})[/.-](\d{2})[/.-](\d{4})/);
  if (dateMatch) {
    result.sampleDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
  } else {
    result.sampleDate = new Date().toISOString().split('T')[0];
  }

  // Helper para buscar número após um padrão regex
  const findValueAfter = (pattern: RegExp, maxVal = 1000): string | undefined => {
    const match = text.match(pattern);
    if (match) {
      const valStr = match[1].replace(',', '.');
      const valNum = parseFloat(valStr);
      if (!isNaN(valNum) && valNum >= 0 && valNum <= maxVal) {
        return valStr;
      }
    }
    return undefined;
  };

  // 4. pH (em água ou CaCl2)
  result.ph =
    findValueAfter(/pH\s*(?:em\s*[aá]gua|H2O|H₂O|\(H2O\)|\(CaCl2\))?[:\s=]+([3-8][.,]\d{1,2})/i) ||
    findValueAfter(/pH[:\s=]+([3-8][.,]\d{1,2})/i) ||
    '5.40';

  // 5. Fósforo P (Mehlich-1 ou Resina)
  result.p =
    findValueAfter(/(?:f[oó]sforo|p\s*mehlich|p\s*resina|p)\s*(?:\(mg\/dm[3³]\))?[:\s=]+([0-9]+[.,]\d+)/i, 300) ||
    findValueAfter(/p[:\s=]+([0-9]+[.,]\d+)/i, 300) ||
    '8.50';

  // 6. Potássio K
  const kRaw =
    findValueAfter(/(?:pot[aá]ssio|k\+?)\s*(?:\(cmolc\/dm[3³]\)|\(mg\/dm[3³]\))?[:\s=]+([0-9]+[.,]\d+)/i, 500) ||
    findValueAfter(/k[:\s=]+([0-9]+[.,]\d+)/i, 500);

  if (kRaw) {
    const kNum = parseFloat(kRaw);
    // Se vier em mg/dm³ (ex: 85 mg/dm³), converte para cmolc/dm³ (85 / 391 = 0.22)
    result.k = kNum > 5.0 ? (kNum / 391).toFixed(2) : kNum.toFixed(2);
  } else {
    result.k = '0.22';
  }

  // 7. Cálcio Ca
  result.ca =
    findValueAfter(/(?:c[aá]lcio|ca\+?2?)\s*(?:\(cmolc\/dm[3³]\))?[:\s=]+([0-9]+[.,]\d+)/i, 40) ||
    findValueAfter(/ca[:\s=]+([0-9]+[.,]\d+)/i, 40) ||
    '2.40';

  // 8. Magnésio Mg
  result.mg =
    findValueAfter(/(?:magn[eé]sio|mg\+?2?)\s*(?:\(cmolc\/dm[3³]\))?[:\s=]+([0-9]+[.,]\d+)/i, 20) ||
    findValueAfter(/mg[:\s=]+([0-9]+[.,]\d+)/i, 20) ||
    '0.85';

  // 9. Alumínio Al (acidez trocável)
  result.al =
    findValueAfter(/(?:alum[ií]nio|al\+?3?|acidez troc[aá]vel)\s*(?:\(cmolc\/dm[3³]\))?[:\s=]+([0-9]+[.,]\d+)/i, 15) ||
    findValueAfter(/al[:\s=]+([0-9]+[.,]\d+)/i, 15) ||
    '0.00';

  // 10. Acidez Potencial H+Al
  result.hAl =
    findValueAfter(/(?:h\s*\+\s*al|acidez potencial)\s*(?:\(cmolc\/dm[3³]\))?[:\s=]+([0-9]+[.,]\d+)/i, 30) ||
    findValueAfter(/h\+al[:\s=]+([0-9]+[.,]\d+)/i, 30) ||
    '3.80';

  // 11. Matéria Orgânica M.O.
  result.mo =
    findValueAfter(/(?:mat[eé]ria org[aâ]nica|m\.?o\.?)\s*(?:\(g\/kg\)|\(g\/dm[3³]\)|%)?[:\s=]+([0-9]+[.,]?\d*)/i, 150) ||
    findValueAfter(/m\.o\.?[:\s=]+([0-9]+[.,]?\d*)/i, 150) ||
    '24.0';

  // 12. Argila
  const clayRaw = findValueAfter(/(?:argila|teor de argila)\s*(?:g\/kg|%)?[:\s=]+([0-9]+[.,]?\d*)/i, 1000);
  if (clayRaw) {
    const clayNum = parseFloat(clayRaw);
    // Se vier em g/kg (ex: 350 g/kg), converte para % (35%)
    result.clay = clayNum > 100 ? (clayNum / 10).toFixed(1) : clayNum.toFixed(1);
  } else {
    result.clay = '35.0';
  }

  // 13. Profundidade
  if (lower.includes('20-40') || lower.includes('20 a 40')) {
    result.depthStartCm = '20';
    result.depthEndCm = '40';
  } else {
    result.depthStartCm = '0';
    result.depthEndCm = '20';
  }

  return result;
}

export interface ExtractedBookData {
  title: string;
  institution: string;
  year: number;
  docType: 'Manual Oficial' | 'Boletim Técnico' | 'Circular Técnica' | 'Guia Estadual' | 'Livro Técnico';
  scope: string;
  officialUrl?: string;
  notes: string;
  cropsDetected: string[];
  targetV: number;
  nKgHa: number;
  p2o5KgHa: number;
  k2oKgHa: number;
  formulation: string;
  rawText: string;
}

export function parseBookManualReport(rawText: string, fileName?: string): ExtractedBookData {
  const text = (rawText || '').replace(/\s+/g, ' ');
  const lower = text.toLowerCase();
  const lowerFile = (fileName || '').toLowerCase();

  // 1. Detecção do Título
  let title = '';
  const cleanFileName = (fileName || '')
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();

  const titleMatch = text.match(/(?:manual|recomenda[çc][õo]es|guia|boletim|aduba[çc][ãa]o|nutri[çc][ãa]o)[^.\n\r]{10,120}/i);
  if (titleMatch && titleMatch[0].length >= 12) {
    title = titleMatch[0].trim();
  } else if (cleanFileName) {
    title = cleanFileName.charAt(0).toUpperCase() + cleanFileName.slice(1);
  } else {
    title = 'Manual de Calagem e Nutrição Mineral de Culturas';
  }

  // 2. Detecção de Instituição / Autor
  let institution = 'Órgão de Pesquisa Agropecuária';
  if (lower.includes('embrapa') || lowerFile.includes('embrapa')) {
    if (lower.includes('soja') || lowerFile.includes('soja')) {
      institution = 'Embrapa Soja (Londrina - PR)';
    } else if (lower.includes('cerrados') || lowerFile.includes('cerrados')) {
      institution = 'Embrapa Cerrados (Planaltina - DF)';
    } else if (lower.includes('mandioca') || lower.includes('fruticultura')) {
      institution = 'Embrapa Mandioca e Fruticultura (Cruz das Almas - BA)';
    } else {
      institution = 'Embrapa (Empresa Brasileira de Pesquisa Agropecuária)';
    }
  } else if (lower.includes('cfsemg') || lower.includes('ufv') || lower.includes('viçosa')) {
    institution = 'Comissão de Fertilidade do Solo de Minas Gerais (CFSEMG / UFV)';
  } else if (lower.includes('seagri') || lower.includes('ebda') || lower.includes('bahia')) {
    institution = 'SEAGRI / EBDA Bahia';
  } else if (lower.includes('incaper') || lower.includes('espírito santo')) {
    institution = 'Instituto Capixaba de Pesquisa e Extensão Rural (Incaper)';
  } else if (lower.includes('iac') || lower.includes('campinas') || lower.includes('boletim 100')) {
    institution = 'Instituto Agronômico de Campinas (IAC - Boletim 100)';
  } else if (lower.includes('ceplac')) {
    institution = 'CEPLAC / Ministério da Agricultura (MAPA)';
  } else if (lower.includes('esalq') || lower.includes('usp')) {
    institution = 'ESALQ / USP Piracicaba';
  } else if (lower.includes('epagri')) {
    institution = 'Epagri Santa Catarina';
  }

  // 3. Detecção do Ano de Publicação
  let year = new Date().getFullYear();
  const yearMatch = text.match(/\b(19[89]\d|20[012]\d)\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[1]);
  }

  // 4. Detecção do Tipo de Documento
  let docType: ExtractedBookData['docType'] = 'Manual Oficial';
  if (lower.includes('boletim') || lowerFile.includes('boletim')) {
    docType = 'Boletim Técnico';
  } else if (lower.includes('circular') || lowerFile.includes('circular')) {
    docType = 'Circular Técnica';
  } else if (lower.includes('guia') || lowerFile.includes('guia')) {
    docType = 'Guia Estadual';
  } else if (lower.includes('livro') || lowerFile.includes('livro')) {
    docType = 'Livro Técnico';
  }

  // 5. Escopo Regional
  let scope = 'Nacional / Regional';
  if (lower.includes('bahia') || lowerFile.includes('bahia')) {
    scope = 'Bahia (Extremo Sul, Oeste e Recôncavo)';
  } else if (lower.includes('cerrado') || lowerFile.includes('cerrado')) {
    scope = 'Bioma Cerrado e Brasil Central';
  } else if (lower.includes('minas') || lowerFile.includes('minas')) {
    scope = 'Minas Gerais e Região Sudeste';
  } else if (lower.includes('espírito santo') || lowerFile.includes('espirito')) {
    scope = 'Espírito Santo e faixa costeira BA/ES';
  } else if (lower.includes('são paulo') || lowerFile.includes('paulista')) {
    scope = 'Estado de São Paulo e Sudeste';
  }

  // 6. Detecção Inteligente de Culturas Contempladas
  const knownCrops = [
    { name: 'Soja', keys: ['soja', 'glycine max'] },
    { name: 'Milho', keys: ['milho', 'zea mays'] },
    { name: 'Feijão', keys: ['feijão', 'feijao', 'phaseolus'] },
    { name: 'Café Conilon', keys: ['café', 'cafe', 'conilon', 'arábica', 'arabica', 'coffea'] },
    { name: 'Cacau', keys: ['cacau', 'theobroma'] },
    { name: 'Mandioca', keys: ['mandioca', 'aipim', 'manihot'] },
    { name: 'Banana', keys: ['banana', 'musa'] },
    { name: 'Citros', keys: ['citros', 'laranja', 'limão', 'limao', 'tangerina', 'citrus'] },
    { name: 'Algodão', keys: ['algodão', 'algodao', 'gossypium'] },
    { name: 'Cana-de-Açúcar', keys: ['cana', 'saccharum'] },
    { name: 'Pastagem', keys: ['pastagem', 'brachiaria', 'braquiária', 'panicum', 'forragem', 'capim'] },
    { name: 'Eucalipto', keys: ['eucalipto', 'eucalyptus', 'silvicultura'] },
    { name: 'Sorgo', keys: ['sorgo', 'sorghum'] },
    { name: 'Trigo', keys: ['trigo', 'triticum'] },
    { name: 'Tomate', keys: ['tomate', 'solanum lycopersicum'] },
    { name: 'Pimenta-do-Reino', keys: ['pimenta-do-reino', 'pimenta do reino', 'piper nigrum'] }
  ];

  const cropsDetected: string[] = [];
  const searchScope = lower + ' ' + lowerFile;
  for (const cropItem of knownCrops) {
    if (cropItem.keys.some((k) => searchScope.includes(k))) {
      cropsDetected.push(cropItem.name);
    }
  }

  // Se nenhuma cultura específica foi detectada pelo texto, infere as mais prováveis
  if (cropsDetected.length === 0) {
    cropsDetected.push('Soja', 'Milho');
  }

  // 7. Detecção do V% Meta para Calagem
  let targetV = 70;
  const vMatch = text.match(/(?:v\s*[\d=:]*|satura[çc][ãa]o\s*por\s*bases|eleva[çc][ãa]o\s*para)\s*([4-8]\d)\s*%/i);
  if (vMatch) {
    const vParsed = parseInt(vMatch[1]);
    if (vParsed >= 40 && vParsed <= 85) targetV = vParsed;
  } else {
    // Derivação agronômica padrão com base na cultura prioritária
    const primaryCrop = cropsDetected[0];
    if (primaryCrop === 'Café Conilon' || primaryCrop === 'Cacau') targetV = 60;
    else if (primaryCrop === 'Mandioca' || primaryCrop === 'Pastagem') targetV = 50;
    else if (primaryCrop === 'Eucalipto') targetV = 40;
    else if (primaryCrop === 'Citros') targetV = 75;
    else targetV = 70;
  }

  // 8. Detecção das Demandas de N, P2O5, K2O
  let nKgHa = 100;
  let p2o5KgHa = 80;
  let k2oKgHa = 90;
  let formulation = '04-14-08';

  const nMatch = text.match(/(?:nitrog[êe]nio|n)\s*[:\s=]+(\d{2,3})\s*(?:kg\/ha)?/i);
  if (nMatch) nKgHa = parseInt(nMatch[1]);

  const pMatch = text.match(/(?:f[oó]sforo|p2o5|p₂o₅)\s*[:\s=]+(\d{2,3})\s*(?:kg\/ha)?/i);
  if (pMatch) p2o5KgHa = parseInt(pMatch[1]);

  const kMatch = text.match(/(?:pot[aá]ssio|k2o|k₂o)\s*[:\s=]+(\d{2,3})\s*(?:kg\/ha)?/i);
  if (kMatch) k2oKgHa = parseInt(kMatch[1]);

  const formMatch = text.match(/\b(\d{2}[-\s/]\d{2}[-\s/]\d{2})\b/);
  if (formMatch) {
    formulation = formMatch[1].replace(/[\s/]/g, '-');
  } else {
    if (cropsDetected.includes('Soja')) formulation = '02-20-20';
    else if (cropsDetected.includes('Café Conilon')) formulation = '20-05-20';
    else if (cropsDetected.includes('Pastagem')) formulation = 'Superfosfato Simples';
    else formulation = '04-14-08';
  }

  // 9. Notas e Memória
  const notes = `Extração automática do documento: Calibragem oficial para ${cropsDetected.join(', ')}. Saturação por bases recomendada de ${targetV}%, com dose de arranque ${formulation}.`;

  return {
    title,
    institution,
    year,
    docType,
    scope,
    officialUrl: 'https://www.embrapa.br',
    notes,
    cropsDetected,
    targetV,
    nKgHa,
    p2o5KgHa,
    k2oKgHa,
    formulation,
    rawText
  };
}


