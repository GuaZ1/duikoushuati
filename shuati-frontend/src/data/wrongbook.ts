import { WrongNotebookItem } from '@/types';

const wrongItems: WrongNotebookItem[] = [
  {
    questionId: 2,
    content: '等边三角形的每个内角是多少度？',
    type: 'SINGLE_CHOICE',
    difficulty: 3,
    wrongCount: 1,
    mastered: false
  }
];

export default function getWrongbookMock(): WrongNotebookItem[] {
  return wrongItems;
}
