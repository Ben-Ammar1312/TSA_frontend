import {
  Alias,
  AliasSuggestion,
  Candidate,
  CandidateStatus,
  Document,
  ExtractedSubject,
  JobStat,
  Mapping,
  TargetSubject,
  TaskItem
} from '../models';

const statuses: CandidateStatus[] = ['en_attente', 'auto_evalue', 'valide', 'rejete'];

export const candidates: Candidate[] = Array.from({ length: 12 }).map((_, index) => {
  const status = statuses[index % statuses.length];
  return {
    id: `cand-${index + 1}`,
    name: `Candidat ${index + 1}`,
    email: `candidat${index + 1}@exemple.fr`,
    school: ['Université de Lyon', 'Polytechnique Montréal', 'ENS Paris', 'ULB Bruxelles'][index % 4],
    track: ['Informatique', 'Mathématiques', 'Génie Civil'][index % 3],
    country: ['France', 'Canada', 'Belgique'][index % 3],
    createdAt: new Date(Date.now() - index * 86400000).toISOString(),
    status,
    overallScore: 12 + (index % 5),
    equivalencyPercent: 65 + (index % 6) * 5,
    threshold: 12
  };
});

export const documents: Document[] = candidates.flatMap((candidate, index) => {
  const docId = `doc-${index + 1}`;
  return [
    {
      id: docId,
      candidateId: candidate.id,
      filename: `relevé-${candidate.id}.pdf`,
      type: 'pdf',
      uploadedAt: candidate.createdAt,
      rawText: 'Mathématiques appliquées, note 15/20',
      previewUrl: 'https://placehold.co/600x400/pdf'
    },
    {
      id: `${docId}-img`,
      candidateId: candidate.id,
      filename: `annexe-${candidate.id}.jpg`,
      type: 'jpeg',
      uploadedAt: candidate.createdAt,
      rawText: 'Cours de Probabilités, note 80/100',
      previewUrl: 'https://placehold.co/400x300/jpg'
    }
  ];
});

const subjectPool: Omit<TargetSubject, 'id'>[] = [
  {
    code: 'MAT101',
    titleFr: 'Analyse I',
    titleEn: 'Calculus I',
    category: 'Mathématiques',
    level: 'L1',
    coefficient: 4,
    active: true
  },
  {
    code: 'MAT201',
    titleFr: 'Algèbre Linéaire',
    titleEn: 'Linear Algebra',
    category: 'Mathématiques',
    level: 'L2',
    coefficient: 5,
    active: true
  },
  {
    code: 'PHY150',
    titleFr: 'Physique Générale',
    titleEn: 'Physics I',
    category: 'Physique',
    level: 'L1',
    coefficient: 3,
    active: true
  },
  {
    code: 'INF120',
    titleFr: 'Programmation Python',
    titleEn: 'Python Programming',
    category: 'Informatique',
    level: 'L1',
    coefficient: 4,
    active: true
  },
  {
    code: 'INF220',
    titleFr: 'Structures de Données',
    titleEn: 'Data Structures',
    category: 'Informatique',
    level: 'L2',
    coefficient: 4,
    active: true
  },
  {
    code: 'STA205',
    titleFr: 'Probabilités Avancées',
    titleEn: 'Advanced Probability',
    category: 'Statistiques',
    level: 'L2',
    coefficient: 4,
    active: true
  },
  {
    code: 'CHM101',
    titleFr: 'Chimie Générale',
    titleEn: 'General Chemistry',
    category: 'Chimie',
    level: 'L1',
    coefficient: 2,
    active: true
  },
  {
    code: 'MEC210',
    titleFr: 'Mécanique des Milieux Continus',
    titleEn: 'Continuum Mechanics',
    category: 'Génie Civil',
    level: 'L3',
    coefficient: 5,
    active: true
  },
  {
    code: 'MAT340',
    titleFr: 'Statistiques Inférentielles',
    titleEn: 'Statistical Inference',
    category: 'Mathématiques',
    level: 'M1',
    coefficient: 3,
    active: true
  },
  {
    code: 'INF340',
    titleFr: 'Apprentissage Automatique',
    titleEn: 'Machine Learning',
    category: 'Informatique',
    level: 'M1',
    coefficient: 5,
    active: true
  }
];

export const targetSubjects: TargetSubject[] = Array.from({ length: 20 }).map((_, index) => {
  const base = subjectPool[index % subjectPool.length];
  return {
    ...base,
    id: `target-${index + 1}`,
    code: `${base.code}-${index + 1}`,
    coefficient: base.coefficient + (index % 3),
    active: index % 7 !== 0
  };
});

export const aliases: Alias[] = targetSubjects.slice(0, 8).map((subject, index) => ({
  id: `alias-${index + 1}`,
  targetSubjectCode: subject.code,
  label: `${subject.titleFr} (${index + 1})`,
  normalizedLabel: subject.titleFr.toLowerCase(),
  language: index % 2 === 0 ? 'fr' : 'en'
}));

export const extractedSubjects: ExtractedSubject[] = documents.flatMap((doc, index) => {
  return Array.from({ length: 5 }).map((_, idx) => {
    const grade = 10 + ((index + idx) % 7) * 1.5;
    const scale = 20;
    return {
      id: `ext-${index + 1}-${idx + 1}`,
      documentId: doc.id,
      rawLabel: `Matière ${idx + 1} du doc ${index + 1}`,
      normalizedLabel: `matiere_${idx + 1}_${index + 1}`,
      rawGrade: grade,
      scale,
      year: 2020 + ((index + idx) % 4),
      sourceCoefficient: 1 + (idx % 3)
    } satisfies ExtractedSubject;
  });
});

export const mappings: Mapping[] = extractedSubjects.map((subject, index) => ({
  id: `map-${index + 1}`,
  extractedSubjectId: subject.id,
  targetSubjectCode: targetSubjects[(index + 3) % targetSubjects.length]?.code,
  method: (['exact', 'fuzzy', 'llm'] as const)[index % 3],
  confidence: 0.55 + ((index * 3) % 45) / 100,
  auto: index % 4 !== 0,
  overriddenByAdmin: false
}));

export const aliasSuggestions: AliasSuggestion[] = Array.from({ length: 10 }).map((_, index) => ({
  id: `suggest-${index + 1}`,
  rawLabel: `Alias brut ${index + 1}`,
  normalizedLabel: `alias_normalise_${index + 1}`,
  language: index % 3 === 0 ? 'en' : 'fr',
  targetSubjectCode: targetSubjects[index % targetSubjects.length].code,
  confidence: 0.7 + (index / 20),
  status: 'pending',
  occurrences: 3 + index,
  createdAt: new Date(Date.now() - index * 3600_000).toISOString()
}));

export const jobStats: JobStat[] = [
  {
    id: 'job-1',
    label: 'Ingestion OCR nocturne',
    status: 'ok',
    ranAt: new Date().toISOString(),
    durationMs: 42000
  },
  {
    id: 'job-2',
    label: 'LLM suggestions 04h',
    status: 'warning',
    ranAt: new Date(Date.now() - 10 * 3600_000).toISOString(),
    durationMs: 72000
  },
  {
    id: 'job-3',
    label: 'API Equivalence sync',
    status: 'failed',
    ranAt: new Date(Date.now() - 28 * 3600_000).toISOString(),
    durationMs: 12000
  }
];

export const tasks: TaskItem[] = [
  {
    id: 'task-1',
    label: 'Vérifier les mappings à faible confiance',
    type: 'mapping',
    description: '3 candidats en attente de validation manuelle',
    severity: 'high'
  },
  {
    id: 'task-2',
    label: 'Confirmer les alias LLM (≥0.90)',
    type: 'llm',
    description: '5 propositions prêtes à être approuvées',
    severity: 'medium'
  },
  {
    id: 'task-3',
    label: 'Analyser l’audit du candidat 7',
    type: 'audit',
    description: 'Changements multiples détectés ce matin',
    severity: 'low',
    candidateId: 'cand-7'
  }
];
