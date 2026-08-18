import { AnswerResult } from '@/types';
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
  const isCorrect = compareBlanks(answer, correctAnswer);

  return {
    correctStatus: isCorrect ? 'CORRECT' : 'WRONG',
    correctAnswer,
    analysis: question.analysis || '',
    score: isCorrect ? question.score : 0
  };
}

// 与后端 answer 规范一致：标准答案用 | 切空、每空可含 " or " 多个可选答案；学生答案用逗号（,，）切空
function splitTrim(text: string, regex: RegExp): string[] {
  return text
    .trim()
    .split(regex)
    .map((s) => s.trim())
    .filter((s) => s);
}

// 大小写不敏感，逐空比较；每空匹配任一可选答案即算对，空数不一致判错
function compareBlanks(student: string, correct: string): boolean {
  const studentBlanks = splitTrim(student, /[,，]/);
  const correctBlanks = splitTrim(correct, /\|/);
  if (studentBlanks.length !== correctBlanks.length) return false;
  return studentBlanks.every((blank, i) => {
    const alternatives = splitTrim(correctBlanks[i], /\s+or\s+/i);
    return alternatives.some((alt) => alt.toLowerCase() === blank.toLowerCase());
  });
}
