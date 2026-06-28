import { AnswerResult, Question } from '@/types';
import { getQuestionDetailMock } from './questions';

export default function submitAnswerMock(
  questionId: number,
  answer: string
): AnswerResult {
  const question = getQuestionDetailMock(questionId);
  if (!question) {
    return {
      correctStatus: 'WRONG',
      correctAnswer: '',
      analysis: '题目不存在',
      score: 0
    };
  }

  const correctAnswer = question.answer || '';
  const isCorrect =
    question.type === 'MULTIPLE_CHOICE'
      ? normalize(answer) === normalize(correctAnswer)
      : answer.trim().toUpperCase() === correctAnswer.trim().toUpperCase();

  return {
    correctStatus: isCorrect ? 'CORRECT' : 'WRONG',
    correctAnswer,
    analysis: question.analysis || '',
    score: isCorrect ? question.score : 0
  };
}

function normalize(str: string): string {
  return str
    .toUpperCase()
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter((s) => s)
    .sort()
    .join(',');
}
