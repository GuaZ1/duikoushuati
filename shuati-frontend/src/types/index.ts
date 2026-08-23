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

export interface KnowledgePoint {
  id: number;
  subjectId: number;
  parentId?: number;
  name: string;
  level?: number;
}

export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'TRUE_FALSE'
  | 'FILL_BLANK';

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
  // 错题本专项练习时返回：该题当前掌握权重（0~5），用于渲染 5 个点
  weight?: number;
}

export type CorrectStatus = 'CORRECT' | 'WRONG' | 'PARTIAL' | 'UNGRADED';

export interface AnswerResult {
  correctStatus: CorrectStatus;
  correctAnswer: string;
  analysis: string;
  score: number;
  // 错题本模式答题后返回：最新权重与是否已掌握
  weight?: number;
  mastered?: boolean;
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
  weight?: number;
  mastered: boolean;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
  user: User;
  // 微信登录时该 openid 尚未注册，前端需引导填写昵称头像
  needRegister?: boolean;
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

// 考试模式：单题作答记录（用于结果报告页）
export interface ExamRecord {
  selectedKey: string;
  correctStatus: CorrectStatus;
  correctAnswer: string;
  analysis: string;
  score: number;
}

// 考试模式：传给报告页的完整会话数据
// answers 与 questions 等长，未作答的题目槽位为 null（正常答完不会出现）
export interface ExamResultPayload {
  subjectId: number;
  subjectName: string;
  elapsedSeconds: number;
  questions: Question[];
  answers: (ExamRecord | null)[];
}

// 错题本：传给报告页的会话数据，报告只展示 answers 中答错的题
export interface WrongbookResultPayload {
  questions: Question[];
  answers: (ExamRecord | null)[];
}
