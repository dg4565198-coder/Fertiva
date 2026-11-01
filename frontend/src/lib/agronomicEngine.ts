import {
  SoilSample,
  DerivedIndices,
  AttributeDiagnostic,
  LimingPlan,
  GypsumPlan,
  FertilizationPlan,
  CommercialFertilizerItem
} from '../types';

/**
 * Motor Agronômico Determinístico em TypeScript
 * Reproduz com 100% de paridade as regras validadas do motor Python.
 */

export function calculateIndices(sample: SoilSample): DerivedIndices {
  const ca = sample.caCmolc ?? 0;
  const mg = sample.mgCmolc ?? 0;
  const k = sample.kCmolc ?? 0;
  const al = sample.alCmolc ?? 0;
  const hAl = sample.hAlCmolc;

  const sb = Number((ca + mg + k).toFixed(3));
  const ctcEffective = Number((sb + al).toFixed(3));

  let ctcPh7: number | undefined = undefined;
  let vPercent: number | undefined = undefined;
  const warnings: string[] = [];

  if (hAl !== undefined && hAl !== null) {
    ctcPh7 = Number((sb + hAl).toFixed(3));
    if (ctcPh7 > 0) {
      vPercent = Number(((sb / ctcPh7) * 100).toFixed(1));
    } else {
      warnings.push("CTC a pH 7.0 calculada como zero.");
    }
  } else {
    warnings.push("Acidez potencial (H+Al) ausente no laudo. Não é possível calcular CTC a pH 7.0 nem V%.");
  }

  let mPercent = 0;
  if (ctcEffective > 0) {
    mPercent = Number(((al / ctcEffective) * 100).toFixed(1));
  } else if (al > 0) {
    mPercent = 100;
  }

  const caMgRatio = mg > 0 ? Number((ca / mg).toFixed(2)) : undefined;
  const caKRatio = k > 0 ? Number((ca / k).toFixed(2)) : undefined;
  const mgKRatio = k > 0 ? Number((mg / k).toFixed(2)) : undefined;

  if (ctcPh7 !== undefined && ctcEffective > ctcPh7 + 0.1) {
    warnings.push(`Inconsistência detectada: CTC efetiva (${ctcEffective}) maior que CTC a pH 7 (${ctcPh7}).`);
  }

  return {
    sb,
    ctcEffective,
    ctcPh7,
    vPercent,
    mPercent,
    caMgRatio,
    caKRatio,
    mgKRatio,
    isConsistent: warnings.length === 0,
    warnings
  };
}

export function diagnoseAttributes(sample: SoilSample): AttributeDiagnostic[] {
  const list: AttributeDiagnostic[] = [];
  const derived = calculateIndices(sample);

  // pH em H2O
  if (sample.phH2o !== undefined) {
    const ph = sample.phH2o;
    let label: 'Muito Baixo' | 'Baixo' | 'Médio' | 'Bom' | 'Muito Alto' = 'Médio';
    let color: 'red' | 'amber' | 'yellow' | 'green' | 'blue' = 'yellow';
    let ref = '6.1 a 6.8';

    if (ph < 4.5) {
      label = 'Muito Baixo';
      color = 'red';
      ref = '< 4.5';
    } else if (ph <= 5.0) {
      label = 'Baixo';
      color = 'amber';
      ref = '4.5 a 5.0';
    } else if (ph <= 6.0) {
      label = 'Médio';
      color = 'yellow';
      ref = '5.1 a 6.0';
    } else if (ph <= 6.8) {
      label = 'Bom';
      color = 'green';
      ref = '6.1 a 6.8';
    } else {
      label = 'Muito Alto';
      color = 'blue';
      ref = '> 6.8';
    }

    list.push({
      attribute: 'phH2o',
      label: 'pH em Água',
      value: ph,
      unit: '',
      classLabel: label,
      color,
      referenceRange: ref,
      explanation: 'Indica a acidez ativa da solução do solo e a disponibilidade geral de nutrientes.',
      source: 'CFSEMG 5ª Aproximação',
      method: 'Relação Solo:Água 1:2.5'
    });
  }

  // Fósforo Mehlich-1 (mg/dm3)
  if (sample.pMehlich1 !== undefined) {
    const p = sample.pMehlich1;
    let label: 'Muito Baixo' | 'Baixo' | 'Médio' | 'Bom' | 'Muito Alto' = 'Baixo';
    let color: 'red' | 'amber' | 'yellow' | 'green' | 'blue' = 'amber';

    if (p <= 5.0) {
      label = 'Muito Baixo';
      color = 'red';
    } else if (p <= 10.0) {
      label = 'Baixo';
      color = 'amber';
    } else if (p <= 20.0) {
      label = 'Médio';
      color = 'yellow';
    } else if (p <= 30.0) {
      label = 'Bom';
      color = 'green';
    } else {
      label = 'Muito Alto';
      color = 'blue';
    }

    list.push({
      attribute: 'pMehlich1',
      label: 'Fósforo Disponível (P)',
      value: p,
      unit: 'mg/dm³',
      classLabel: label,
      color,
      referenceRange: 'Bom: 20.1 a 30.0 mg/dm³',
      explanation: 'Vital para o desenvolvimento radicular inicial, perfilhamento e floração.',
      source: 'CFSEMG 5ª Aproximação',
      method: 'Extrator Mehlich-1'
    });
  }

  // Potássio Trocável (cmol_c/dm3)
  if (sample.kCmolc !== undefined) {
    const k = sample.kCmolc;
    let label: 'Muito Baixo' | 'Baixo' | 'Médio' | 'Bom' | 'Muito Alto' = 'Médio';
    let color: 'red' | 'amber' | 'yellow' | 'green' | 'blue' = 'yellow';

    if (k <= 0.08) {
      label = 'Muito Baixo';
      color = 'red';
    } else if (k <= 0.15) {
      label = 'Baixo';
      color = 'amber';
    } else if (k <= 0.25) {
      label = 'Médio';
      color = 'yellow';
    } else if (k <= 0.40) {
      label = 'Bom';
      color = 'green';
    } else {
      label = 'Muito Alto';
      color = 'blue';
    }

    list.push({
      attribute: 'kCmolc',
      label: 'Potássio Trocável (K)',
      value: k,
      unit: 'cmol_c/dm³',
      classLabel: label,
      color,
      referenceRange: 'Bom: 0.26 a 0.40 cmol_c/dm³',
      explanation: 'Atua no equilíbrio hídrico da planta, transporte de carboidratos e enchimento de grãos.',
      source: 'CFSEMG 5ª Aproximação',
      method: 'Extrator Mehlich-1'
    });
  }

  // Cálcio Trocável (cmol_c/dm3)
  if (sample.caCmolc !== undefined) {
    const ca = sample.caCmolc;
    let label: 'Muito Baixo' | 'Baixo' | 'Médio' | 'Bom' | 'Muito Alto' = 'Médio';
    let color: 'red' | 'amber' | 'yellow' | 'green' | 'blue' = 'yellow';

    if (ca <= 1.2) {
      label = 'Muito Baixo';
      color = 'red';
    } else if (ca <= 2.4) {
      label = 'Baixo';
      color = 'amber';
    } else if (ca <= 4.0) {
      label = 'Médio';
      color = 'yellow';
    } else if (ca <= 7.0) {
      label = 'Bom';
      color = 'green';
    } else {
      label = 'Muito Alto';
      color = 'blue';
    }

    list.push({
      attribute: 'caCmolc',
      label: 'Cálcio Trocável (Ca)',
      value: ca,
      unit: 'cmol_c/dm³',
      classLabel: label,
      color,
      referenceRange: 'Bom: 4.01 a 7.00 cmol_c/dm³',
      explanation: 'Componente da parede celular. Essencial para elongação radicular em profundidade.',
      source: 'CFSEMG 5ª Aproximação',
      method: 'Extrator KCl 1 mol/L'
    });
  }

  // Magnésio Trocável (cmol_c/dm3)
  if (sample.mgCmolc !== undefined) {
    const mg = sample.mgCmolc;
    let label: 'Muito Baixo' | 'Baixo' | 'Médio' | 'Bom' | 'Muito Alto' = 'Médio';
    let color: 'red' | 'amber' | 'yellow' | 'green' | 'blue' = 'yellow';

    if (mg <= 0.4) {
      label = 'Muito Baixo';
      color = 'red';
    } else if (mg <= 0.8) {
      label = 'Baixo';
      color = 'amber';
    } else if (mg <= 1.5) {
      label = 'Médio';
      color = 'yellow';
    } else if (mg <= 2.5) {
      label = 'Bom';
      color = 'green';
    } else {
      label = 'Muito Alto';
      color = 'blue';
    }

    list.push({
      attribute: 'mgCmolc',
      label: 'Magnésio Trocável (Mg)',
      value: mg,
      unit: 'cmol_c/dm³',
      classLabel: label,
      color,
      referenceRange: 'Bom: 1.51 a 2.50 cmol_c/dm³',
      explanation: 'Componente estrutural da clorofila e ativador enzimático.',
      source: 'CFSEMG 5ª Aproximação',
      method: 'Extrator KCl 1 mol/L'
    });
  }

  // V% Saturação por Bases
  if (derived.vPercent !== undefined) {
    const v = derived.vPercent;
    let label: 'Muito Baixo' | 'Baixo' | 'Médio' | 'Bom' | 'Muito Alto' = 'Médio';
    let color: 'red' | 'amber' | 'yellow' | 'green' | 'blue' = 'yellow';

    if (v <= 20) {
      label = 'Muito Baixo';
      color = 'red';
    } else if (v <= 40) {
      label = 'Baixo';
      color = 'amber';
    } else if (v <= 60) {
      label = 'Médio';
      color = 'yellow';
    } else if (v <= 80) {
      label = 'Bom';
      color = 'green';
    } else {
      label = 'Muito Alto';
      color = 'blue';
    }

    list.push({
      attribute: 'vPercent',
      label: 'Saturação por Bases (V%)',
      value: v,
      unit: '%',
      classLabel: label,
      color,
      referenceRange: 'Bom: 60.1 a 80.0%',
      explanation: 'Percentual da CTC ocupada por nutrientes essenciais básicos. Define a necessidade de calagem.',
      source: 'CFSEMG 5ª Aproximação',
      method: 'Cálculo determinístico (SB / T) × 100'
    });
  }

  // m% Saturação por Alumínio
  if (derived.mPercent !== undefined) {
    const m = derived.mPercent;
    let label: 'Muito Baixo' | 'Baixo' | 'Médio' | 'Bom' | 'Muito Alto' = 'Baixo';
    let color: 'red' | 'amber' | 'yellow' | 'green' | 'blue' = 'green';

    if (m === 0) {
      label = 'Muito Baixo';
      color = 'green';
    } else if (m <= 15) {
      label = 'Baixo';
      color = 'green';
    } else if (m <= 30) {
      label = 'Médio';
      color = 'yellow';
    } else if (m <= 50) {
      label = 'Muito Alto';
      color = 'amber';
    } else {
      label = 'Muito Alto';
      color = 'red';
    }

    list.push({
      attribute: 'mPercent',
      label: 'Saturação por Alumínio (m%)',
      value: m,
      unit: '%',
      classLabel: label,
      color,
      referenceRange: 'Adequado: <= 15%',
      explanation: 'Indica a toxicidade de alumínio para as pontas radiculares.',
      source: 'CFSEMG 5ª Aproximação',
      method: 'Cálculo determinístico (Al / t) × 100'
    });
  }

  return list;
}

export function calculateLiming(
  sample: SoilSample,
  areaHa: number,
  targetV: number = 60,
  prnt: number = 80,
  depthCm: number = 20,
  factor: number = 1.0
): LimingPlan {
  const derived = calculateIndices(sample);

  if (derived.ctcPh7 === undefined || derived.vPercent === undefined) {
    return {
      doseTonHa: 0,
      totalTon: 0,
      targetV,
      currentV: 0,
      prnt,
      method: 'Saturação por Bases (V%)',
      formula: 'NC = [T × (V₂ - V₁) / 100] × (100 / PRNT)',
      steps: ['Bloqueio agronômico: Laudo sem Acidez Potencial (H+Al). Não é possível calcular CTC a pH 7.0 nem V1%.'],
      source: 'CFSEMG 5ª Aproximação / Embrapa',
      isBlocked: true,
      blockReason: 'Dados insuficientes no laudo laboratorial: H+Al ausente.'
    };
  }

  const t = derived.ctcPh7;
  const v1 = derived.vPercent;
  const steps: string[] = [];

  steps.push(`1. CTC a pH 7,0 (T): ${t.toFixed(2)} cmol_c/dm³ [Fórmula: SB + (H+Al) = ${derived.sb.toFixed(2)} + ${(sample.hAlCmolc ?? 0).toFixed(2)}]`);
  steps.push(`2. Saturação por Bases Atual (V₁): ${v1.toFixed(1)}% [Fórmula: (${derived.sb.toFixed(2)} / ${t.toFixed(2)}) × 100]`);
  steps.push(`3. Saturação por Bases Desejada (V₂): ${targetV.toFixed(1)}%`);
  steps.push(`4. PRNT do Calcário: ${prnt}%`);
  steps.push(`5. Profundidade de incorporação: ${depthCm} cm (fator profundidade: ${depthCm / 20})`);

  if (v1 >= targetV) {
    steps.push(`6. Conclusão: Saturação atual (${v1.toFixed(1)}%) é suficiente para a cultura meta (${targetV}%). Não há necessidade de calagem.`);
    return {
      doseTonHa: 0,
      totalTon: 0,
      targetV,
      currentV: v1,
      prnt,
      method: 'Saturação por Bases (V%)',
      formula: 'NC (t/ha) = [T × (V₂ - V₁) / 100] × (100 / PRNT) × (prof / 20) × f',
      steps,
      source: 'CFSEMG 5ª Aproximação',
      isBlocked: false
    };
  }

  const deltaV = targetV - v1;
  const baseNc = (t * deltaV) / 100;
  const ncAdjusted = baseNc * (100 / prnt) * (depthCm / 20) * factor;
  const doseTonHa = Number(Math.max(0, ncAdjusted).toFixed(2));
  const totalTon = Number((doseTonHa * areaHa).toFixed(2));

  steps.push(`6. Diferença de Saturação (ΔV): ${targetV}% - ${v1.toFixed(1)}% = ${deltaV.toFixed(1)}%`);
  steps.push(`7. Necessidade Base (PRNT 100%): [${t.toFixed(2)} × ${deltaV.toFixed(1)}] / 100 = ${baseNc.toFixed(2)} t/ha`);
  steps.push(`8. Ajuste para PRNT ${prnt}% e ${depthCm} cm: ${baseNc.toFixed(2)} × (100 / ${prnt}) × (${depthCm} / 20) × ${factor} = ${doseTonHa} t/ha`);
  steps.push(`9. Quantidade Total para o talhão (${areaHa} ha): ${doseTonHa} t/ha × ${areaHa} ha = ${totalTon} toneladas de calcário.`);

  return {
    doseTonHa,
    totalTon,
    targetV,
    currentV: v1,
    prnt,
    method: 'Saturação por Bases (V%)',
    formula: 'NC (t/ha) = [T × (V₂ - V₁) / 100] × (100 / PRNT) × (prof / 20) × f',
    steps,
    source: 'CFSEMG 5ª Aproximação / Embrapa',
    isBlocked: false
  };
}

export function calculateGypsum(
  hasSubsurface: boolean,
  subSample: SoilSample | null,
  areaHa: number,
  cropType: 'anual' | 'perene' = 'anual',
  clayPercent: number = 30
): GypsumPlan {
  const metCriteria: string[] = [];
  const unmetCriteria: string[] = [];
  const limitations: string[] = [];

  if (!hasSubsurface || !subSample) {
    limitations.push(
      'Análise de subsuperfície (20-40 cm) ausente. Por diretriz técnica agronômica estrita, não é permitido calcular gessagem apenas com o laudo superficial.'
    );
    return {
      isRecommended: false,
      doseTonHa: 0,
      totalTon: 0,
      metCriteria: [],
      unmetCriteria: ['Amostragem de 20-40 cm disponível'],
      limitations,
      formula: 'NG = Fator × Argila(%)',
      source: 'Embrapa Cerrados / Sousa & Lobato (2004)'
    };
  }

  const subDerived = calculateIndices(subSample);
  const caSub = subSample.caCmolc ?? 0;
  const alSub = subSample.alCmolc ?? 0;
  const mSub = subDerived.mPercent ?? 0;

  if (caSub < 0.4) {
    metCriteria.push(`Cálcio na subsuperfície baixo: ${caSub.toFixed(2)} cmol_c/dm³ (crítico: < 0,40)`);
  } else {
    unmetCriteria.push(`Cálcio na subsuperfície adequado: ${caSub.toFixed(2)} cmol_c/dm³ (>= 0,40)`);
  }

  if (alSub > 0.5) {
    metCriteria.push(`Alumínio tóxico na subsuperfície: ${alSub.toFixed(2)} cmol_c/dm³ (crítico: > 0,50)`);
  } else {
    unmetCriteria.push(`Alumínio na subsuperfície sob controle: ${alSub.toFixed(2)} cmol_c/dm³ (<= 0,50)`);
  }

  if (mSub > 20.0) {
    metCriteria.push(`Saturação por alumínio na subsuperfície elevada: ${mSub.toFixed(1)}% (crítico: > 20,0%)`);
  } else {
    unmetCriteria.push(`Saturação por alumínio na subsuperfície tolerável: ${mSub.toFixed(1)}% (<= 20,0%)`);
  }

  const isRecommended = metCriteria.length > 0;
  if (!isRecommended) {
    limitations.push('Nenhum critério crítico de subsuperfície atendido. Perfil favorável ao enraizamento; gessagem dispensada.');
    return {
      isRecommended: false,
      doseTonHa: 0,
      totalTon: 0,
      metCriteria,
      unmetCriteria,
      limitations,
      formula: 'NG = Fator × Argila(%)',
      source: 'Embrapa Cerrados / CFSEMG'
    };
  }

  const clay = subSample.clayPercent ?? clayPercent;
  const factor = cropType === 'perene' ? 60 : 50;
  const doseKgHa = factor * clay;
  const doseTonHa = Number((doseKgHa / 1000).toFixed(2));
  const totalTon = Number((doseTonHa * areaHa).toFixed(2));

  return {
    isRecommended: true,
    doseTonHa,
    totalTon,
    metCriteria,
    unmetCriteria,
    limitations,
    formula: `NG (kg/ha) = ${factor} × Argila(%) [Cultura ${cropType}]`,
    source: 'Embrapa Cerrados (Sousa & Lobato) / CFSEMG'
  };
}

import { TechnicalReference, CropAgronomicRule } from '../types';

/**
 * Retorna todas as culturas ativas e disponíveis no sistema com base nos livros
 * cadastrados na Biblioteca Técnica. Se novos livros forem adicionados, novas culturas surgem instantaneamente.
 */
export function getAllActiveCrops(references?: TechnicalReference[]): string[] {
  if (!references || references.length === 0) {
    return ['Milho', 'Café Conilon', 'Cacau', 'Mandioca', 'Pastagem', 'Eucalipto', 'Soja', 'Feijão', 'Banana', 'Algodão'];
  }

  const set = new Set<string>();
  for (const ref of references) {
    if (ref.cropsCovered && Array.isArray(ref.cropsCovered)) {
      for (const c of ref.cropsCovered) {
        if (c && c.trim()) set.add(c.trim());
      }
    }
    if (ref.cropRules && Array.isArray(ref.cropRules)) {
      for (const r of ref.cropRules) {
        if (r.cropName && r.cropName.trim()) set.add(r.cropName.trim());
      }
    }
  }

  if (set.size === 0) {
    return ['Milho', 'Café Conilon', 'Cacau', 'Mandioca', 'Pastagem', 'Eucalipto'];
  }

  return Array.from(set).sort();
}

/**
 * Busca a regra agronômica (V% meta, NPK e fonte) para qualquer cultura a partir
 * do cruzamento dos livros e manuais ativos no sistema.
 */
export function getCropAgronomicRule(
  cropName: string,
  references?: TechnicalReference[]
): { rule: CropAgronomicRule; sourceTitle: string } {
  const norm = (cropName || '').toLowerCase().trim();

  // 1. Tenta encontrar a regra específica em algum manual ativo
  if (references) {
    for (const ref of references) {
      if (ref.cropRules) {
        const found = ref.cropRules.find(
          (r) => r.cropName.toLowerCase() === norm || norm.includes(r.cropName.toLowerCase())
        );
        if (found) {
          return { rule: found, sourceTitle: ref.title };
        }
      }
    }
  }

  // 2. Se for uma cultura cadastrada em um livro sem tabela detalhada, gera calibração agronômica
  const isGrain = norm.includes('soja') || norm.includes('milho') || norm.includes('feij') || norm.includes('trigo') || norm.includes('arroz') || norm.includes('algod');
  const isPerennial = norm.includes('caf') || norm.includes('cacau') || norm.includes('banana') || norm.includes('citros') || norm.includes('laranja') || norm.includes('frut');
  const isRoot = norm.includes('mandioca') || norm.includes('batata') || norm.includes('cenoura') || norm.includes('inhame');
  const isPasture = norm.includes('past') || norm.includes('braqui') || norm.includes('capim');
  const isForest = norm.includes('eucalipto') || norm.includes('pinus') || norm.includes('seringa');

  let targetV = 70;
  let category: CropAgronomicRule['category'] = 'grão';
  let n = 100;
  let p = 80;
  let k = 80;
  let formulation = '04-14-08';
  let gypsum = 50;

  if (isGrain) {
    targetV = norm.includes('soja') ? 70 : (norm.includes('feij') ? 65 : 70);
    n = norm.includes('soja') ? 20 : 120;
    p = 80; k = 90;
    formulation = norm.includes('soja') ? '02-20-20' : '04-14-08';
    category = 'grão';
  } else if (isPerennial) {
    targetV = norm.includes('citros') ? 75 : 60;
    n = 180; p = 60; k = 180;
    formulation = '20-05-20';
    category = 'perene';
    gypsum = 60;
  } else if (isRoot) {
    targetV = 50;
    n = 40; p = 50; k = 50;
    formulation = '04-14-08';
    category = 'raiz';
  } else if (isPasture) {
    targetV = 50;
    n = 50; p = 50; k = 40;
    formulation = 'Superfosfato Simples';
    category = 'pastagem';
  } else if (isForest) {
    targetV = 40;
    n = 40; p = 70; k = 60;
    formulation = '06-30-06';
    category = 'florestal';
    gypsum = 60;
  }

  return {
    rule: {
      id: `rule-auto-${norm.replace(/\s+/g, '-')}`,
      cropName: cropName || 'Cultura Geral',
      category,
      targetV,
      targetYield: 'Meta Padrão Recomendada',
      nDemandKgHa: n,
      pDemandKgHa: p,
      kDemandKgHa: k,
      suggestedFormulation: formulation,
      gypsumFactor: gypsum
    },
    sourceTitle: 'Literatura Agronômica Consolidada (Embrapa / CFSEMG)'
  };
}

export function calculateFertilization(
  crop: string,
  yieldGoal: 'baixa' | 'media' | 'alta',
  sample: SoilSample,
  areaHa: number,
  references?: TechnicalReference[]
): FertilizationPlan {
  const p = sample.pMehlich1 ?? 8;
  const k = sample.kCmolc ?? 0.12;

  const pStatus = p < 10 ? 'baixo' : (p <= 20 ? 'medio' : 'bom');
  const kStatus = k < 0.15 ? 'baixo' : (k <= 0.30 ? 'medio' : 'bom');

  const { rule, sourceTitle } = getCropAgronomicRule(crop, references);

  let nTotal = rule.nDemandKgHa;
  let p2o5Total = rule.pDemandKgHa;
  let k2oTotal = rule.kDemandKgHa;

  // Modula por meta de produtividade
  const mult = yieldGoal === 'alta' ? 1.25 : (yieldGoal === 'media' ? 1.0 : 0.7);
  nTotal = Math.round(nTotal * mult);

  // Modula pelo teor de P no solo
  if (pStatus === 'baixo') {
    p2o5Total = Math.round(p2o5Total * 1.2);
  } else if (pStatus === 'bom') {
    p2o5Total = Math.round(p2o5Total * 0.7);
  }

  // Modula pelo teor de K no solo
  if (kStatus === 'baixo') {
    k2oTotal = Math.round(k2oTotal * 1.25);
  } else if (kStatus === 'bom') {
    k2oTotal = Math.round(k2oTotal * 0.7);
  }

  // Parcelamento
  const isPerennial = rule.category === 'perene' || rule.category === 'pastagem';
  const nPlantio = isPerennial ? 0 : Math.round(nTotal * 0.2);
  const nCob = nTotal - nPlantio;
  const p2o5Plantio = p2o5Total;
  const k2oPlantio = isPerennial ? 0 : Math.min(30, Math.round(k2oTotal * 0.3));
  const k2oCob = k2oTotal - k2oPlantio;

  const cropName = rule.cropName;
  const refSource = sourceTitle;

  const commercialPlan: CommercialFertilizerItem[] = [];

  // Superfosfato simples (18% P2O5)
  if (p2o5Plantio > 0) {
    const doseSfs = Number((p2o5Plantio / 0.18).toFixed(1));
    commercialPlan.push({
      fertilizerName: 'Superfosfato Simples',
      guarantee: '18% P2O5, 10% S, 18% Ca',
      doseKgHa: doseSfs,
      totalKg: Number((doseSfs * areaHa).toFixed(1)),
      timing: 'Plantio',
      explanation: `Fornece ${p2o5Plantio} kg/ha de P₂O₅ no sulco de plantio, além de enxofre e cálcio.`
    });
  }

  // Ureia Plantio
  if (nPlantio > 0) {
    const doseUreiaP = Number((nPlantio / 0.45).toFixed(1));
    commercialPlan.push({
      fertilizerName: 'Ureia Agrícola (Arranque)',
      guarantee: '45% N',
      doseKgHa: doseUreiaP,
      totalKg: Number((doseUreiaP * areaHa).toFixed(1)),
      timing: 'Plantio',
      explanation: `Fornece ${nPlantio} kg/ha de N no plantio.`
    });
  }

  // Ureia Cobertura
  if (nCob > 0) {
    const doseUreiaCob = Number((nCob / 0.45).toFixed(1));
    commercialPlan.push({
      fertilizerName: 'Ureia Agrícola (Cobertura)',
      guarantee: '45% N',
      doseKgHa: doseUreiaCob,
      totalKg: Number((doseUreiaCob * areaHa).toFixed(1)),
      timing: 'Cobertura',
      explanation: `Fornece ${nCob} kg/ha de N em cobertura parcelada no estádio vegetativo.`
    });
  }

  // Cloreto de Potássio
  const kTarget = k2oCob > 0 ? k2oCob : k2oTotal;
  if (kTarget > 0) {
    const doseKcl = Number((kTarget / 0.60).toFixed(1));
    commercialPlan.push({
      fertilizerName: 'Cloreto de Potássio (KCl)',
      guarantee: '60% K2O',
      doseKgHa: doseKcl,
      totalKg: Number((doseKcl * areaHa).toFixed(1)),
      timing: k2oCob > 0 ? 'Cobertura' : 'Plantio',
      explanation: `Fornece ${kTarget} kg/ha de K₂O para produtividade e enchimento.`
    });
  }

  return {
    crop: cropName,
    yieldGoal: yieldGoal.toUpperCase(),
    areaHa,
    nutrientsTotal: { n: nTotal, p2o5: p2o5Total, k2o: k2oTotal },
    planting: { n: nPlantio, p2o5: p2o5Plantio, k2o: k2oPlantio },
    topdressing: { n: nCob, p2o5: 0, k2o: k2oCob },
    commercialPlan,
    memory: [
      `Status do solo: Fósforo Mehlich-1 = ${p} mg/dm³ (${pStatus}) | Potássio = ${k} cmol_c/dm³ (${kStatus})`,
      `Necessidade pura calculada: N = ${nTotal} kg/ha, P₂O₅ = ${p2o5Total} kg/ha, K₂O = ${k2oTotal} kg/ha.`,
      `Parcelamento: Plantio (N:${nPlantio}, P₂O₅:${p2o5Plantio}, K₂O:${k2oPlantio}) | Cobertura (N:${nCob}, K₂O:${k2oCob}).`
    ],
    source: refSource
  };
}
