import { Injectable, computed, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Alias,
  AliasSuggestion,
  AliasSuggestionStatus,
  AuditLog,
  Candidate,
  CandidateStatus,
  Document,
  ExtractedSubject,
  HotCacheSettings,
  JobStat,
  Mapping,
  ScoreBreakdown,
  SuggestionQueueState,
  TargetSubject,
  TaskItem,
  ThresholdSettings,
  WeightSettings
} from '../models';
import {
  aliasSuggestions as initialSuggestions,
  aliases as initialAliases,
  candidates as initialCandidates,
  documents as initialDocuments,
  extractedSubjects as initialExtractedSubjects,
  jobStats as initialJobs,
  mappings as initialMappings,
  targetSubjects as initialTargets,
  tasks as initialTasks
} from './mock-data';
import { nanoid } from './nanoid';

const DEFAULT_THRESHOLDS: ThresholdSettings = {
  globalAcceptance: 12,
  exactMin: 0.95,
  fuzzyOk: 0.85,
  fuzzyMaybe: 0.7,
  llmMin: 0.6,
  nearMissLow: 0.5
};

const DEFAULT_WEIGHTS: WeightSettings = {
  defaultCoefficient: 1,
  llmBonus: 0.2,
  penaltyLowConfidence: 0.5
};

const DEFAULT_HOT_CACHE: HotCacheSettings = {
  enabled: true,
  ttlMinutes: 180
};

@Injectable({ providedIn: 'root' })
export class DataStoreService {
  private readonly candidates$ = new BehaviorSubject<Candidate[]>([...initialCandidates]);
  private readonly documents$ = new BehaviorSubject<Document[]>([...initialDocuments]);
  private readonly extractedSubjects$ = new BehaviorSubject<ExtractedSubject[]>([
    ...initialExtractedSubjects
  ]);
  private readonly mappings$ = new BehaviorSubject<Mapping[]>([...initialMappings]);
  private readonly targetSubjects$ = new BehaviorSubject<TargetSubject[]>([...initialTargets]);
  private readonly aliases$ = new BehaviorSubject<Alias[]>([...initialAliases]);
  private readonly aliasSuggestions$ = new BehaviorSubject<AliasSuggestion[]>([
    ...initialSuggestions
  ]);
  private readonly tasks$ = new BehaviorSubject<TaskItem[]>([...initialTasks]);
  private readonly jobStats$ = new BehaviorSubject<JobStat[]>([...initialJobs]);
  private readonly auditLogs$ = new BehaviorSubject<AuditLog[]>([]);
  private readonly thresholds$ = new BehaviorSubject<ThresholdSettings>({ ...DEFAULT_THRESHOLDS });
  private readonly weights$ = new BehaviorSubject<WeightSettings>({ ...DEFAULT_WEIGHTS });
  private readonly hotCache = signal<HotCacheSettings>({ ...DEFAULT_HOT_CACHE });

  readonly candidatesWithDocuments$ = this.candidates$.pipe(
    map((cands) =>
      cands.map((candidate) => ({
        candidate,
        documents: this.documents$.value.filter((doc) => doc.candidateId === candidate.id)
      }))
    )
  );

  readonly suggestionQueue = computed<SuggestionQueueState>(() => ({
    suggestions: this.aliasSuggestions$.value,
    hotCache: this.hotCache()
  }));

  getCandidates(): Observable<Candidate[]> {
    return this.candidates$.asObservable();
  }

  snapshotCandidates(): Candidate[] {
    return [...this.candidates$.value];
  }

  getCandidateById(id: string): Observable<Candidate | undefined> {
    return this.candidates$.pipe(map((items) => items.find((item) => item.id === id)));
  }

  getDocumentsForCandidate(candidateId: string): Observable<Document[]> {
    return this.documents$.pipe(
      map((items) => items.filter((doc) => doc.candidateId === candidateId))
    );
  }

  getExtractedSubjectsByCandidate(candidateId: string): Observable<ExtractedSubject[]> {
    const docIds = this.documents$.value
      .filter((doc) => doc.candidateId === candidateId)
      .map((doc) => doc.id);
    return this.extractedSubjects$.pipe(
      map((items) => items.filter((subject) => docIds.includes(subject.documentId)))
    );
  }

  getMappingsForCandidate(candidateId: string): Observable<Mapping[]> {
    const extractedIds = this.extractedSubjects$.value
      .filter((subject) => this.documents$.value
        .find((doc) => doc.id === subject.documentId)?.candidateId === candidateId)
      .map((subject) => subject.id);
    return this.mappings$.pipe(
      map((items) => items.filter((mapping) => extractedIds.includes(mapping.extractedSubjectId)))
    );
  }

  getTargetSubjects(): Observable<TargetSubject[]> {
    return this.targetSubjects$.asObservable();
  }

  snapshotTargetSubjects(): TargetSubject[] {
    return [...this.targetSubjects$.value];
  }

  updateTargetSubject(code: string, changes: Partial<TargetSubject>, actor: string): void {
    this.targetSubjects$.next(
      this.targetSubjects$.value.map((subject) =>
        subject.code === code ? { ...subject, ...changes } : subject
      )
    );
    this.pushAudit({
      actor,
      action: 'update_target_subject',
      entity: 'target_subject',
      entityId: code,
      after: changes
    });
  }

  addTargetSubject(subject: TargetSubject, actor: string): void {
    this.targetSubjects$.next([...this.targetSubjects$.value, subject]);
    this.pushAudit({
      actor,
      action: 'create_target_subject',
      entity: 'target_subject',
      entityId: subject.code,
      after: subject
    });
  }

  getAliasesForTarget(code: string): Observable<Alias[]> {
    return this.aliases$.pipe(map((items) => items.filter((alias) => alias.targetSubjectCode === code)));
  }

  getAliasSuggestions(): Observable<AliasSuggestion[]> {
    return this.aliasSuggestions$.asObservable();
  }

  getAuditLogs(): Observable<AuditLog[]> {
    return this.auditLogs$.asObservable();
  }

  snapshotAuditLogs(): AuditLog[] {
    return [...this.auditLogs$.value];
  }

  getTasks(): Observable<TaskItem[]> {
    return this.tasks$.asObservable();
  }

  getJobStats(): Observable<JobStat[]> {
    return this.jobStats$.asObservable();
  }

  getThresholds(): Observable<ThresholdSettings> {
    return this.thresholds$.asObservable();
  }

  snapshotThresholds(): ThresholdSettings {
    return { ...this.thresholds$.value };
  }

  getWeights(): Observable<WeightSettings> {
    return this.weights$.asObservable();
  }

  snapshotWeights(): WeightSettings {
    return { ...this.weights$.value };
  }

  getHotCache(): HotCacheSettings {
    return this.hotCache();
  }

  updateCandidateStatus(id: string, status: CandidateStatus, actor: string): void {
    this.candidates$.next(
      this.candidates$.value.map((candidate) =>
        candidate.id === id ? { ...candidate, status } : candidate
      )
    );
    this.pushAudit({
      actor,
      action: 'mise_a_jour_statut',
      entity: 'candidate',
      entityId: id,
      after: { status }
    });
  }

  updateMapping(mappingId: string, changes: Partial<Mapping>, actor: string): void {
    const before = this.mappings$.value.find((m) => m.id === mappingId);
    this.mappings$.next(
      this.mappings$.value.map((mapping) =>
        mapping.id === mappingId ? { ...mapping, ...changes, overriddenByAdmin: true } : mapping
      )
    );
    this.pushAudit({
      actor,
      action: 'update_mapping',
      entity: 'mapping',
      entityId: mappingId,
      before,
      after: { ...before, ...changes }
    });
  }

  acceptMappingsByThreshold(candidateId: string, threshold: number, actor: string): void {
    const updatedIds: string[] = [];
    const candidateMappings = this.getCurrentMappingsForCandidate(candidateId);
    candidateMappings.forEach((mapping) => {
      if ((mapping.confidence ?? 0) >= threshold) {
        updatedIds.push(mapping.id);
      }
    });
    if (!updatedIds.length) return;
    this.mappings$.next(
      this.mappings$.value.map((mapping) =>
        updatedIds.includes(mapping.id)
          ? { ...mapping, overriddenByAdmin: true }
          : mapping
      )
    );
    updatedIds.forEach((id) =>
      this.pushAudit({
        actor,
        action: 'accept_threshold',
        entity: 'mapping',
        entityId: id
      })
    );
  }

  rejectMappingsBelow(candidateId: string, threshold: number, actor: string): void {
    const updated: string[] = [];
    const candidateMappings = this.getCurrentMappingsForCandidate(candidateId);
    candidateMappings.forEach((mapping) => {
      if ((mapping.confidence ?? 0) < threshold) {
        updated.push(mapping.id);
      }
    });
    if (!updated.length) return;
    this.mappings$.next(
      this.mappings$.value.map((mapping) =>
        updated.includes(mapping.id)
          ? { ...mapping, targetSubjectCode: undefined, overriddenByAdmin: true }
          : mapping
      )
    );
    updated.forEach((id) =>
      this.pushAudit({
        actor,
        action: 'reject_threshold',
        entity: 'mapping',
        entityId: id
      })
    );
  }

  updateCandidateScore(candidateId: string, breakdown: ScoreBreakdown, actor: string): void {
    this.candidates$.next(
      this.candidates$.value.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              overallScore: Number(breakdown.overallScore.toFixed(2)),
              equivalencyPercent: Number(breakdown.equivalencyPercent.toFixed(1))
            }
          : candidate
      )
    );
    this.pushAudit({
      actor,
      action: 'update_scores',
      entity: 'candidate',
      entityId: candidateId,
      after: breakdown
    });
  }

  addAlias(alias: Alias, actor: string): void {
    this.aliases$.next([...this.aliases$.value, alias]);
    this.pushAudit({
      actor,
      action: 'create_alias',
      entity: 'alias',
      entityId: alias.id,
      after: alias
    });
  }

  updateAliasSuggestionStatus(id: string, status: AliasSuggestionStatus, actor: string): void {
    this.aliasSuggestions$.next(
      this.aliasSuggestions$.value.map((suggestion) =>
        suggestion.id === id ? { ...suggestion, status } : suggestion
      )
    );
    this.pushAudit({
      actor,
      action: 'update_alias_suggestion',
      entity: 'alias_suggestion',
      entityId: id,
      after: { status }
    });
  }

  approveSuggestion(id: string, actor: string): void {
    const suggestion = this.aliasSuggestions$.value.find((item) => item.id === id);
    if (!suggestion) return;
    const alias: Alias = {
      id: nanoid(),
      targetSubjectCode: suggestion.targetSubjectCode,
      label: suggestion.rawLabel,
      normalizedLabel: suggestion.normalizedLabel,
      language: suggestion.language === 'en' ? 'en' : 'fr'
    };
    this.addAlias(alias, actor);
    this.updateAliasSuggestionStatus(id, 'approved', actor);
  }

  removeSuggestionFromQueue(id: string): void {
    this.aliasSuggestions$.next(this.aliasSuggestions$.value.filter((item) => item.id !== id));
  }

  updateThresholds(value: ThresholdSettings, actor: string): void {
    this.thresholds$.next({ ...value });
    this.pushAudit({
      actor,
      action: 'update_thresholds',
      entity: 'settings',
      entityId: 'thresholds',
      after: value
    });
  }

  updateWeights(value: WeightSettings, actor: string): void {
    this.weights$.next({ ...value });
    this.pushAudit({
      actor,
      action: 'update_weights',
      entity: 'settings',
      entityId: 'weights',
      after: value
    });
  }

  updateHotCache(value: HotCacheSettings, actor: string): void {
    this.hotCache.set({ ...value });
    this.pushAudit({
      actor,
      action: 'update_hot_cache',
      entity: 'settings',
      entityId: 'hot_cache',
      after: value
    });
  }

  private getCurrentMappingsForCandidate(candidateId: string): Mapping[] {
    const docIds = this.documents$.value
      .filter((doc) => doc.candidateId === candidateId)
      .map((doc) => doc.id);
    const extractedIds = this.extractedSubjects$.value
      .filter((subject) => docIds.includes(subject.documentId))
      .map((subject) => subject.id);
    return this.mappings$.value.filter((mapping) => extractedIds.includes(mapping.extractedSubjectId));
  }

  private pushAudit(entry: Omit<AuditLog, 'id' | 'at'>): void {
    const log: AuditLog = {
      id: nanoid(),
      at: new Date().toISOString(),
      ...entry
    };
    this.auditLogs$.next([log, ...this.auditLogs$.value]);
  }
}
