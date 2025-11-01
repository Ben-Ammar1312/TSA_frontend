export type CandidateStatus = 'en_attente' | 'auto_evalue' | 'valide' | 'rejete';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  school: string;
  track: string;
  country: string;
  createdAt: string;
  status: CandidateStatus;
  overallScore: number;
  equivalencyPercent: number;
  threshold?: number;
}

export interface Document {
  id: string;
  candidateId: string;
  filename: string;
  type: 'pdf' | 'jpeg' | 'png';
  uploadedAt: string;
  rawText: string;
  previewUrl: string;
}

export interface ExtractedSubject {
  id: string;
  documentId: string;
  rawLabel: string;
  normalizedLabel: string;
  rawGrade: number;
  scale: number;
  year: number;
  sourceCoefficient: number;
}

export interface TargetSubject {
  id: string;
  code: string;
  titleFr: string;
  titleEn?: string;
  category: string;
  level?: string;
  coefficient: number;
  active: boolean;
}

export type MappingMethod = 'exact' | 'fuzzy' | 'llm';

export interface Mapping {
  id: string;
  extractedSubjectId: string;
  targetSubjectCode?: string;
  method: MappingMethod;
  confidence: number;
  auto: boolean;
  overriddenByAdmin?: boolean;
}

export type AliasSuggestionStatus = 'pending' | 'approved' | 'rejected' | 'snoozed';

export interface AliasSuggestion {
  id: string;
  rawLabel: string;
  normalizedLabel: string;
  language: 'fr' | 'en' | 'es';
  targetSubjectCode: string;
  confidence: number;
  status: AliasSuggestionStatus;
  occurrences: number;
  createdAt: string;
}

export interface Alias {
  id: string;
  targetSubjectCode: string;
  label: string;
  normalizedLabel: string;
  language: 'fr' | 'en';
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  at: string;
}

export interface ThresholdSettings {
  globalAcceptance: number;
  exactMin: number;
  fuzzyOk: number;
  fuzzyMaybe: number;
  llmMin: number;
  nearMissLow: number;
}

export interface WeightSettings {
  defaultCoefficient: number;
  llmBonus: number;
  penaltyLowConfidence: number;
}

export interface PipelineSettings {
  ocrEnabled: boolean;
  mlEnabled: boolean;
  llmEnabled: boolean;
}

export interface RetentionSettings {
  months: number;
}

export interface PreferencesState {
  darkMode: boolean;
  variant: AppVariant;
}

export type AppVariant = 1 | 2 | 3 | 4;

export interface ScoreBreakdown {
  totalCoefficient: number;
  weightedSum: number;
  overallScore: number;
  equivalencyPercent: number;
}

export interface TaskItem {
  id: string;
  label: string;
  type: 'mapping' | 'llm' | 'audit';
  description: string;
  severity: 'high' | 'medium' | 'low';
  candidateId?: string;
}

export interface ActivityLogItem {
  id: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  type: 'update' | 'mapping' | 'alias';
}

export interface JobStat {
  id: string;
  label: string;
  status: 'ok' | 'warning' | 'failed';
  ranAt: string;
  durationMs: number;
}

export interface HotCacheSettings {
  enabled: boolean;
  ttlMinutes: number;
}

export interface SuggestionQueueState {
  suggestions: AliasSuggestion[];
  hotCache: HotCacheSettings;
}
