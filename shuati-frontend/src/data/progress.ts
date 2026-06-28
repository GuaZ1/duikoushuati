import { ProgressItem } from '@/types';

const progress: ProgressItem[] = [
  {
    subjectId: 1,
    subjectName: '数学',
    knowledgePointId: 1,
    knowledgePointName: '函数',
    practicedCount: 12,
    correctCount: 9,
    masteryRate: 75
  },
  {
    subjectId: 1,
    subjectName: '数学',
    knowledgePointId: 2,
    knowledgePointName: '几何',
    practicedCount: 8,
    correctCount: 5,
    masteryRate: 62
  },
  {
    subjectId: 2,
    subjectName: '物理',
    knowledgePointId: 3,
    knowledgePointName: '力学',
    practicedCount: 6,
    correctCount: 4,
    masteryRate: 66
  }
];

export default function getProgressMock(): ProgressItem[] {
  return progress;
}
