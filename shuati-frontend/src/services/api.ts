import Taro from '@tarojs/taro';
import {
  AnswerResult,
      LoginResponse,
  ProgressItem,
  Question,
  Subject,
  User,
  UserStatistics,
  WrongNotebookItem
} from '@/types';
import getSubjectsMock from '@/data/subjects';
import getQuestionsMock, { getQuestionDetailMock } from '@/data/questions';
import getProgressMock from '@/data/progress';
import getWrongbookMock from '@/data/wrongbook';
import submitAnswerMock from '@/data/answer';

const BASE_URL = process.env.TARO_APP_API_URL || 'http://localhost:8080';
const IS_DEV = process.env.NODE_ENV === 'development';

function getToken(): string | undefined {
  return Taro.getStorageSync<string | undefined>('token') || undefined;
}

function toLogin() {
  Taro.removeStorageSync('token');
  Taro.removeStorageSync('user');
  Taro.redirectTo({ url: '/pages/login/index' });
}

async function request<T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  fallback?: () => T
): Promise<T> {
  const token = getToken();
  try {
    const res = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (res.statusCode === 401) {
      toLogin();
      throw new Error('登录已过期');
    }

    const result = res.data as { code: number; message: string; data: T };
    if (result.code !== 0) {
      throw new Error(result.message || '请求失败');
    }
    return result.data;
  } catch (err: any) {
    const statusCode = err?.statusCode || err?.response?.statusCode;
    if (statusCode === 401) {
      toLogin();
      throw new Error('登录已过期');
    }
    if (IS_DEV && fallback) {
      console.warn(`[API] ${url} 请求失败，回退到本地模拟数据`, err);
      return fallback();
    }
    throw err;
  }
}

export async function loginByCode(code: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', 'POST', { code });
}

export async function getCurrentUser(): Promise<User> {
  return request<User>('/api/users/me');
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

export async function getPracticeQuestions(params?: {
  subjectId?: number;
  difficulty?: number;
  type?: string;
}): Promise<Question[]> {
  return request<Question[]>('/api/questions/practice', 'GET', params, () =>
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
  questionId: number,
  answer: string
): Promise<AnswerResult> {
  return request<AnswerResult>(
    '/api/answers',
    'POST',
    { questionId, answer },
    () => submitAnswerMock(questionId, answer)
  );
}

export async function getMyProgress(): Promise<ProgressItem[]> {
  return request<ProgressItem[]>(
    '/api/users/me/progress',
    'GET',
    undefined,
    getProgressMock
  );
}

export async function getMyStatistics(): Promise<UserStatistics> {
  return request<UserStatistics>('/api/users/me/statistics');
}

export async function getMyWrongbook(): Promise<WrongNotebookItem[]> {
  return request<WrongNotebookItem[]>(
    '/api/users/me/wrongbook',
    'GET',
    undefined,
    getWrongbookMock
  );
}
