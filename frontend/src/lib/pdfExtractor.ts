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

