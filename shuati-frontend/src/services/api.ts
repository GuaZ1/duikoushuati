import Taro from '@tarojs/taro';
import {
  AnswerResult,
  ProgressItem,
  Question,
  Subject,
  User,
  WrongNotebookItem
} from '@/types';
import getSubjectsMock from '@/data/subjects';
import getQuestionsMock, { getQuestionDetailMock } from '@/data/questions';
import getProgressMock from '@/data/progress';
import getWrongbookMock from '@/data/wrongbook';
import submitAnswerMock from '@/data/answer';

const BASE_URL = process.env.TARO_ENV === 'weapp'
  ? (process.env.TARO_APP_API_URL || 'http://localhost:8080')
  : 'http://localhost:8080';

async function request<T>(
  url: string,
  method: 'GET' | 'POST' = 'GET',
  data?: any,
  fallback?: () => T
): Promise<T> {
  try {
    const res = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json'
      }
    });
    const result = res.data as { code: number; message: string; data: T };
    if (result.code !== 0) {
      throw new Error(result.message || '请求失败');
    }
    return result.data;
  } catch (err) {
    console.warn(`[API] ${url} 请求失败，回退到本地模拟数据`, err);
    if (fallback) {
      return fallback();
    }
    throw err;
  }
}

export async function getUserInfo(id: number): Promise<User> {
  return request<User>(`/api/users/${id}`, 'GET');
}

export async function getSubjects(): Promise<Subject[]> {
  return request<Subject[]>('/api/subjects', 'GET', undefined, getSubjectsMock);
}

export async function getQuestions(params?: {
  subjectId?: number;
  difficulty?: number;
  type?: string;
}): Promise<Question[]> {
  return request<Question[]>('/api/questions', 'GET', params, () =>
    getQuestionsMock(params)
  );
}

export async function createQuestion(data: Question): Promise<number> {
  return request<number>('/api/questions', 'POST', data);
}

export async function updateQuestion(id: number, data: Question): Promise<void> {
  return request<void>(`/api/questions/${id}`, 'PUT', data);
}

export async function deleteQuestion(id: number): Promise<void> {
  return request<void>(`/api/questions/${id}`, 'DELETE');
}

export async function getQuestionDetail(id: number): Promise<Question> {
  return request<Question>(`/api/questions/${id}`, 'GET', undefined, () => {
    const q = getQuestionDetailMock(id);
    if (!q) throw new Error('题目不存在');
    return q;
  });
}

export async function submitAnswer(
  studentId: number,
  questionId: number,
  answer: string
): Promise<AnswerResult> {
  return request<AnswerResult>(
    '/api/answers',
    'POST',
    { studentId, questionId, answer },
    () => submitAnswerMock(questionId, answer)
  );
}

export async function getProgress(userId: number): Promise<ProgressItem[]> {
  return request<ProgressItem[]>(
    `/api/users/${userId}/progress`,
    'GET',
    undefined,
    getProgressMock
  );
}

export async function getWrongbook(
  userId: number
): Promise<WrongNotebookItem[]> {
  return request<WrongNotebookItem[]>(
    `/api/users/${userId}/wrongbook`,
    'GET',
    undefined,
    getWrongbookMock
  );
}
