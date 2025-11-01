import { Injectable } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { DataStoreService } from './data-store.service';
import { ExtractedSubject, Mapping, ScoreBreakdown, TargetSubject } from '../models';

@Injectable({ providedIn: 'root' })
export class ScoringService {
  constructor(private readonly store: DataStoreService) {}

  breakdownForCandidate(candidateId: string): Observable<ScoreBreakdown> {
    return combineLatest([
      this.store.getExtractedSubjectsByCandidate(candidateId),
      this.store.getMappingsForCandidate(candidateId),
      this.store.getTargetSubjects()
    ]).pipe(
      map(([subjects, mappings, targets]) => this.calculate(subjects, mappings, targets))
    );
  }

  calculate(
    subjects: ExtractedSubject[],
    mappings: Mapping[],
    targets: TargetSubject[]
  ): ScoreBreakdown {
    const accepted = mappings.filter((mapping) => mapping.targetSubjectCode);
    if (!accepted.length) {
      return {
        totalCoefficient: 0,
        weightedSum: 0,
        overallScore: 0,
        equivalencyPercent: 0
      };
    }
    let weightedSum = 0;
    let totalCoefficient = 0;
    accepted.forEach((mapping) => {
      const subject = subjects.find((item) => item.id === mapping.extractedSubjectId);
      if (!subject) return;
      const target = targets.find((item) => item.code === mapping.targetSubjectCode);
      const normalized = this.normalizeGrade(subject.rawGrade, subject.scale);
      const coefficient = target?.coefficient ?? subject.sourceCoefficient ?? 1;
      totalCoefficient += coefficient;
      const penalty = mapping.confidence < 0.6 ? 0.7 : 1;
      weightedSum += normalized * coefficient * penalty;
    });
    const overallScore = totalCoefficient ? weightedSum / totalCoefficient : 0;
    return {
      totalCoefficient,
      weightedSum,
      overallScore,
      equivalencyPercent: Math.min(100, overallScore * 5)
    };
  }

  normalizeGrade(grade: number, scale: number): number {
    if (scale === 20) return grade;
    return (grade / scale) * 20;
  }
}
