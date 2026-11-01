export type UserRole = 'produtor' | 'estudante' | 'profissional' | 'admin';
export type SubscriptionTier = 'free' | 'pro' | 'consultoria';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tier: SubscriptionTier;
  creaCrmv?: string;
  phone?: string;
  city?: string;
  state?: string;
  createdAt: string;
  avatarUrl?: string;
}

export interface Property {
  id: string;
  userId?: string;
  name: string;
  totalAreaHa: number;
  state: string;
  city: string;
  latitude?: number;
  longitude?: number;
  isDemo?: boolean;
}

export interface Plot {
  id: string;
  propertyId: string;
  name: string;
  areaHa: number;
  currentCrop: string;
  previousCrop?: string;
  soilTextureDeclared?: 'Arenoso' | 'Textura Média' | 'Argiloso' | 'Muito Argiloso';
  isDemo?: boolean;
}

export interface SoilSample {
  id: string;
  plotId: string;
  plotName: string;
  propertyName: string;
  labName: string;
  labReportNumber: string;
  sampleDate: string;
  depthStartCm: number;
  depthEndCm: number;
  extractedViaOcr?: boolean;
  ocrConfirmedByUser?: boolean;
  isDemo?: boolean;

  // Atributos Químicos
  phH2o?: number;
  phCacl2?: number;
  pMehlich1?: number; // mg/dm3
  pResina?: number;   // mg/dm3
  kCmolc?: number;    // cmol_c/dm3
  caCmolc?: number;   // cmol_c/dm3
  mgCmolc?: number;   // cmol_c/dm3
  alCmolc?: number;   // cmol_c/dm3
  hAlCmolc?: number;  // cmol_c/dm3
  moGKg?: number;     // g/kg
  moPercent?: number; // %
  sMgDm3?: number;    // mg/dm3
  clayPercent?: number; // %

  // Micronutrientes (mg/dm3)
  bMgDm3?: number;
  cuMgDm3?: number;
  feMgDm3?: number;
  mnMgDm3?: number;
  znMgDm3?: number;
}

export interface TechnicalReference {
  id: string;
  code: string;
  title: string;
  institution: string;
  year: number;
  status: string;
  scope: string;
  notes: string;
  officialUrl: string;
  institutionUrl: string;
  docType: 'Manual Oficial' | 'Boletim Técnico' | 'Circular Técnica' | 'Guia Estadual';
}

export interface DerivedIndices {
  sb: number;
  ctcEffective: number;
  ctcPh7?: number;
  vPercent?: number;
  mPercent?: number;
  caMgRatio?: number;
  caKRatio?: number;
  mgKRatio?: number;
  isConsistent: boolean;
  warnings: string[];
}

export interface AttributeDiagnostic {
  attribute: string;
  label: string;
  value: number;
  unit: string;
  classLabel: 'Muito Baixo' | 'Baixo' | 'Médio' | 'Bom' | 'Muito Alto';
  color: 'red' | 'amber' | 'yellow' | 'green' | 'blue';
  referenceRange: string;
  explanation: string;
  source: string;
  method: string;
}

export interface LimingPlan {
  doseTonHa: number;
  totalTon: number;
  targetV: number;
  currentV: number;
  prnt: number;
  method: string;
  formula: string;
  steps: string[];
  source: string;
  isBlocked: boolean;
  blockReason?: string;
}

export interface GypsumPlan {
  isRecommended: boolean;
  doseTonHa: number;
  totalTon: number;
  metCriteria: string[];
  unmetCriteria: string[];
  limitations: string[];
  formula: string;
  source: string;
}

export interface CommercialFertilizerItem {
  fertilizerName: string;
  guarantee: string;
  doseKgHa: number;
  totalKg: number;
  timing: 'Plantio' | 'Cobertura';
  explanation: string;
}

export interface FertilizationPlan {
  crop: string;
  yieldGoal: string;
  areaHa: number;
  nutrientsTotal: { n: number; p2o5: number; k2o: number };
  planting: { n: number; p2o5: number; k2o: number };
  topdressing: { n: number; p2o5: number; k2o: number };
  commercialPlan: CommercialFertilizerItem[];
  memory: string[];
  source: string;
}
