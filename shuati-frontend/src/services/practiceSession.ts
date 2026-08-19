import Taro from '@tarojs/taro';
import { ExamRecord, Question } from '@/types';

// 一份刷题会话缓存：乱序后的题目快照 + 当前进度 + 每题作答记录。
// 顺序以 questions 数组本身为准，续做时直接复用，绝不重新洗牌，
// 从而保证「返回上次刷题位置」时题目顺序与上次完全一致。
// answers 与 questions 等长，未作答的题目槽位为 null；
// correctCount 由 answers 推导，单独冗余存储以兼容旧缓存（无 answers 字段）。
export interface PracticeSession {
  subjectId: number;
  questions: Question[];
  currentIndex: number;
  correctCount: number;
  answers: (ExamRecord | null)[];
  updatedAt: number;
}

function sessionKey(subjectId: number): string {
  return `practice_session_${subjectId}`;
}

// Fisher-Yates 洗牌，返回新数组，不修改入参。
export function shuffle<T>(list: T[]): T[] {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 新开一局：对题目洗牌后写入缓存并返回乱序列表。
export function startSession(subjectId: number, list: Question[]): Question[] {
  const questions = shuffle(list);
  const session: PracticeSession = {
    subjectId,
    questions,
    currentIndex: 0,
    correctCount: 0,
    answers: new Array(questions.length).fill(null),
    updatedAt: Date.now()
  };
  Taro.setStorageSync(sessionKey(subjectId), session);
  return questions;
}

// 续做：读取上次缓存的乱序序列与进度；无缓存返回 null。
export function resumeSession(subjectId: number): PracticeSession | null {
  const session = Taro.getStorageSync<PracticeSession>(sessionKey(subjectId));
  if (!session || !Array.isArray(session.questions) || session.questions.length === 0) {
    return null;
  }
  return session;
}

// 错题本会话：洗牌后取前 limit 道；错题库不足 limit 时循环重复凑满 limit。
// 同局内尽量不重复（池足够大时取出的都是不同题），不同局之间同一道错题可以重复出现。
export function startWrongbookSession(list: Question[], limit = 10): Question[] {
  if (list.length === 0) return [];
  const shuffled = shuffle(list);
  if (shuffled.length >= limit) {
    return shuffled.slice(0, limit);
  }
  const result: Question[] = [];
  for (let i = 0; result.length < limit; i += 1) {
    result.push(shuffled[i % shuffled.length]);
  }
  return result;
}

// 更新当前进度，供答题推进时写回缓存。
export function saveSessionIndex(subjectId: number, currentIndex: number): void {
  const session = Taro.getStorageSync<PracticeSession>(sessionKey(subjectId));
  if (!session) return;
  session.currentIndex = currentIndex;
  session.updatedAt = Date.now();
  Taro.setStorageSync(sessionKey(subjectId), session);
}

// 更新练习会话的作答记录与正确数，供续做时完整恢复正确率统计（不覆盖 currentIndex）。
export function savePracticeProgress(
  subjectId: number,
  patch: Pick<PracticeSession, 'answers' | 'correctCount'>
): void {
  const session = Taro.getStorageSync<PracticeSession>(sessionKey(subjectId));
  if (!session) return;
  session.answers = patch.answers;
  session.correctCount = patch.correctCount;
  session.updatedAt = Date.now();
  Taro.setStorageSync(sessionKey(subjectId), session);
}

// ======================== 考试会话 ========================

// 考试模式的会话缓存：与练习互不干扰，保证「回到上次刷题位置」能续上同一场考试
// （同样的乱序题、已答记录、进度与计时）。key 用 exam_session_ 前缀与练习区分。
export interface ExamSession {
  subjectId: number;
  questions: Question[];
  answers: (ExamRecord | null)[];
  currentIndex: number;
  elapsedSeconds: number;
  updatedAt: number;
}

function examSessionKey(subjectId: number): string {
  return `exam_session_${subjectId}`;
}

// 已完成考试的题号记录（key: exam_used_），供下一场考试排除，避免连做重复题
function examUsedKey(subjectId: number): string {
  return `exam_used_${subjectId}`;
}

export function getExamUsedIds(subjectId: number): number[] {
  const ids = Taro.getStorageSync<number[]>(examUsedKey(subjectId));
  return Array.isArray(ids) ? ids : [];
}

// 考试完成时，把本场做过的题记为已用
export function markExamUsed(subjectId: number, questionIds: number[]): void {
  const used = new Set(getExamUsedIds(subjectId));
  questionIds.forEach((id) => used.add(id));
  Taro.setStorageSync(examUsedKey(subjectId), Array.from(used));
}

function resetExamUsed(subjectId: number): void {
  Taro.removeStorageSync(examUsedKey(subjectId));
}

// 新开一场考试：从全量题中排除已完成考试的题后洗牌截取 10 道；
// 若剩余未做的题不足 10 道，说明题库已基本刷完，清空记录重新一轮。
export function startExamSession(subjectId: number, list: Question[]): ExamSession {
  const used = new Set(getExamUsedIds(subjectId));
  let candidates = list.filter((q) => !used.has(q.id));
  if (candidates.length < 10) {
    resetExamUsed(subjectId);
    candidates = list;
  }
  const questions = shuffle(candidates).slice(0, 10);
  const session: ExamSession = {
    subjectId,
    questions,
    answers: new Array(questions.length).fill(null),
    currentIndex: 0,
    elapsedSeconds: 0,
    updatedAt: Date.now()
  };
  Taro.setStorageSync(examSessionKey(subjectId), session);
  return session;
}

// 续做考试：读取缓存的考试会话；无缓存返回 null。
export function resumeExamSession(subjectId: number): ExamSession | null {
  const session = Taro.getStorageSync<ExamSession>(examSessionKey(subjectId));
  if (!session || !Array.isArray(session.questions) || session.questions.length === 0) {
    return null;
  }
  return session;
}

// 推进考试进度并写回缓存（作答 / 切换题目 / 退出时调用）。
export function saveExamSessionProgress(subjectId: number, patch: Partial<ExamSession>): void {
  const session = Taro.getStorageSync<ExamSession>(examSessionKey(subjectId));
  if (!session) return;
  Object.assign(session, patch, { updatedAt: Date.now() });
  Taro.setStorageSync(examSessionKey(subjectId), session);
}

// 考试完成（已出报告）后清除会话，避免重复续做。
export function clearExamSession(subjectId: number): void {
  Taro.removeStorageSync(examSessionKey(subjectId));
}

// 判断该科目最近一次刷题是考试还是练习：比较两个会话缓存的 updatedAt。
export function getResumeKind(subjectId: number): 'exam' | 'practice' {
  const exam = resumeExamSession(subjectId);
  const practice = resumeSession(subjectId);
  if (exam && (!practice || exam.updatedAt > practice.updatedAt)) {
    return 'exam';
  }
  return 'practice';
}
