import { Subject } from '@/types';

const subjects: Subject[] = [
  { id: 1, name: '数学', code: 'math' },
  { id: 2, name: '物理', code: 'physics' },
  { id: 3, name: '英语', code: 'english' }
];

export default function getSubjectsMock(): Subject[] {
  return subjects;
}
