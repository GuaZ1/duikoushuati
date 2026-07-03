export type UserRole = 'STUDENT' | 'TEACHER';

export interface User {
  id: number;
  role: UserRole;
  nickname: string;
  avatar?: string;
  grade?: string;
  school?: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  image?: string;
}

export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'JUDGEMENT'
  | 'FILL_BLANK'
  | 'ESSAY';

export interface QuestionOption {
  id: number;
  optionKey: string;
  content: string;
  isCorrect?: boolean;
}

export interface Question {
  id: number;
  subjectId: number;
  subjectName: string;
  type: QuestionType;
  difficulty: number;
  content: string;
  answer?: string;
  analysis?: string;
  score: number;
  options?: QuestionOption[];
}

export type CorrectStatus = 'CORRECT' | 'WRONG' | 'PARTIAL' | 'UNGRADED';

export interface AnswerResult {
  correctStatus: CorrectStatus;
  correctAnswer: string;
  analysis: string;
  score: number;
}

export interface ProgressItem {
  subjectId: number;
  subjectName: string;
  knowledgePointId: number;
  knowledgePointName: string;
  practicedCount: number;
  correctCount: number;
  masteryRate: number;
}

export interface WrongNotebookItem {
  questionId: number;
  content: string;
  type: QuestionType;
  difficulty: number;
  wrongCount: number;
  mastered: boolean;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
  user: User;
}

export interface UserStatistics {
  todayCount: number;
  totalCount: number;
  correctRate: number;
}

export interface LastPracticePosition {
  subjectId: number;
  subjectName: string;
  questionId: number;
  lastPracticeAt: string;
  valid: boolean;
}
