import { Question } from '@/types';

const questions: Question[] = [
  {
    id: 1,
    subjectId: 1,
    subjectName: '数学',
    type: 'SINGLE_CHOICE',
    difficulty: 2,
    content: '函数 f(x)=x² 的图像开口方向是？',
    answer: 'A',
    analysis: '二次项系数为正，抛物线开口向上。',
    score: 5,
    options: [
      { id: 1, optionKey: 'A', content: '向上', isCorrect: true },
      { id: 2, optionKey: 'B', content: '向下', isCorrect: false },
      { id: 3, optionKey: 'C', content: '向左', isCorrect: false },
      { id: 4, optionKey: 'D', content: '向右', isCorrect: false }
    ]
  },
  {
    id: 2,
    subjectId: 1,
    subjectName: '数学',
    type: 'SINGLE_CHOICE',
    difficulty: 3,
    content: '等边三角形的每个内角是多少度？',
    answer: 'B',
    analysis: '等边三角形三个内角相等，和为180°，每个角60°。',
    score: 5,
    options: [
      { id: 5, optionKey: 'A', content: '45°', isCorrect: false },
      { id: 6, optionKey: 'B', content: '60°', isCorrect: true },
      { id: 7, optionKey: 'C', content: '90°', isCorrect: false },
      { id: 8, optionKey: 'D', content: '120°', isCorrect: false }
    ]
  },
  {
    id: 3,
    subjectId: 2,
    subjectName: '物理',
    type: 'SINGLE_CHOICE',
    difficulty: 2,
    content: '牛顿第一定律又称为？',
    answer: 'C',
    analysis: '牛顿第一定律揭示了物体保持原有运动状态的性质，又称惯性定律。',
    score: 5,
    options: [
      { id: 9, optionKey: 'A', content: '作用力与反作用力定律', isCorrect: false },
      { id: 10, optionKey: 'B', content: '万有引力定律', isCorrect: false },
      { id: 11, optionKey: 'C', content: '惯性定律', isCorrect: true },
      { id: 12, optionKey: 'D', content: '能量守恒定律', isCorrect: false }
    ]
  }
];

export default function getQuestionsMock(params?: {
  subjectId?: number;
  difficulty?: number;
  type?: string;
}): Question[] {
  return questions.filter((q) => {
    if (params?.subjectId && q.subjectId !== params.subjectId) return false;
    if (params?.difficulty && q.difficulty !== params.difficulty) return false;
    if (params?.type && q.type !== params.type) return false;
    return true;
  });
}

export function getQuestionDetailMock(id: number): Question | undefined {
  return questions.find((q) => q.id === Number(id));
}
