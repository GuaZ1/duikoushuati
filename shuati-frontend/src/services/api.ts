import Taro from '@tarojs/taro';
import {
  AnswerResult,
  LoginResponse,
  LastPracticePosition,
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

const isWeapp = process.env.TARO_ENV === 'weapp';
const BASE_URL = process.env.TARO_APP_API_URL || 'http://localhost:8080';
const IS_DEV = process.env.NODE_ENV === 'development';

// 微信云托管配置
const CLOUD_ENV = 'prod-d3gi3mvu1d1660fe9';
const CLOUD_SERVICE = 'shuati';

function getToken(): string | undefined {
  return Taro.getStorageSync<string | undefined>('token') || undefined;
}

function toLogin() {
  Taro.removeStorageSync('token');
  Taro.removeStorageSync('user');
  Taro.redirectTo({ url: '/pages/login/index' });
}

/**
 * 解析响应体，兼容 string / object 两种返回格式
 */
function parseBody<T>(raw: any): T {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }
  return raw as T;
}

/**
 * 统一请求函数：
 * - 微信小程序 → wx.cloud.callContainer（无需域名白名单）
 * - H5 / 本地   → Taro.request
 */
async function request<T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  fallback?: () => T
): Promise<T> {
  const token = getToken();

  // ── 微信小程序：走云托管 ──
  if (isWeapp) {
    try {
      const header: Record<string, string> = {
        'X-WX-SERVICE': CLOUD_SERVICE,
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // GET/DELETE 请求参数拼到 URL query string（后端 @RequestParam 从 URL 读）
      let path = url;
      let reqBody: string | undefined;
      if ((method === 'GET' || method === 'DELETE') && data != null) {
        const qs = Object.entries(data)
          .filter(([, v]) => v != null)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&');
        if (qs) path = `${url}?${qs}`;
      } else if (data != null) {
        reqBody = JSON.stringify(data);
      }

      const res = await Taro.cloud.callContainer({
        config: { env: CLOUD_ENV },
        path,
        method,
        header,
        data: reqBody,
      });

      if (res.statusCode === 401) {
        toLogin();
        throw new Error('登录已过期');
      }

      const result = parseBody<{ code: number; message: string; data: T }>(res.data);
      if (result.code !== 0) {
        throw new Error(result.message || '请求失败');
      }
      return result.data;
    } catch (err: any) {
      if (err?.message === '登录已过期') throw err;
      console.warn(`[API] callContainer ${method} ${url} failed:`, err);
      if (IS_DEV && fallback) return fallback();
      throw err;
    }
  }

  // ── H5 / 本地：走常规 HTTP ──
  try {
    const res = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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

// ======================== 登录 ========================

export async function loginByCode(
  code: string,
  nickname?: string,
  avatarUrl?: string
): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', 'POST', { code, nickname, avatarUrl });
}

// ======================== 头像上传 ========================

export async function uploadAvatar(filePath: string): Promise<string> {
  if (isWeapp) {
    // 小程序：读文件 → base64 → 通过 callContainer 发给后端，绕开域名限制
    const fs = Taro.getFileSystemManager();
    const base64 = await new Promise<string>((resolve, reject) => {
      fs.readFile({
        filePath,
        encoding: 'base64',
        success: (r) => resolve(r.data as string),
        fail: reject,
      });
    });
    const ext = filePath.split('.').pop() || 'jpg';
    return request<string>('/api/auth/upload/avatar/base64', 'POST', { base64, ext });
  }

  // H5：走常规 multipart 文件上传
  const token = getToken();
  const res = await Taro.uploadFile({
    url: `${BASE_URL}/api/auth/upload/avatar`,
    filePath,
    name: 'file',
    header: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.statusCode !== 200) {
    throw new Error('头像上传失败');
  }
  const result = JSON.parse(res.data) as { code: number; message: string; data: string };
  if (result.code !== 0) {
    throw new Error(result.message || '头像上传失败');
  }
  return result.data;
}

// ======================== 用户 ========================

export async function getCurrentUser(): Promise<User> {
  return request<User>('/api/users/me');
}

export async function getMyStatistics(): Promise<UserStatistics> {
  return request<UserStatistics>('/api/users/me/statistics');
}

export async function getMyProgress(): Promise<ProgressItem[]> {
  return request<ProgressItem[]>('/api/users/me/progress', 'GET', undefined, getProgressMock);
}

export async function getMyWrongbook(): Promise<WrongNotebookItem[]> {
  return request<WrongNotebookItem[]>('/api/users/me/wrongbook', 'GET', undefined, getWrongbookMock);
}

export async function getLastPracticePosition(): Promise<LastPracticePosition | null> {
  return request<LastPracticePosition | null>('/api/practice/last-position');
}

// ======================== 学科 & 题目 ========================

export async function getSubjects(): Promise<Subject[]> {
  return request<Subject[]>('/api/subjects', 'GET', undefined, getSubjectsMock);
}

export async function getQuestions(params?: {
  subjectId?: number;
  difficulty?: number;
  type?: string;
}): Promise<Question[]> {
  return request<Question[]>('/api/questions', 'GET', params, () => getQuestionsMock(params));
}

export async function getPracticeQuestions(params?: {
  subjectId?: number;
  difficulty?: number;
  type?: string;
}): Promise<Question[]> {
  return request<Question[]>('/api/questions/practice', 'GET', params, () => getQuestionsMock(params));
}

export async function getQuestionDetail(id: number): Promise<Question> {
  return request<Question>(`/api/questions/${id}`, 'GET', undefined, () => {
    const q = getQuestionDetailMock(id);
    if (!q) throw new Error('题目不存在');
    return q;
  });
}

export async function submitAnswer(questionId: number, answer: string): Promise<AnswerResult> {
  return request<AnswerResult>('/api/answers', 'POST', { questionId, answer }, () =>
    submitAnswerMock(questionId, answer)
  );
}

// ======================== 教师端 ========================

export async function createQuestion(data: Question): Promise<number> {
  return request<number>('/api/questions', 'POST', data);
}

export async function updateQuestion(id: number, data: Question): Promise<void> {
  return request<void>(`/api/questions/${id}`, 'PUT', data);
}

export async function deleteQuestion(id: number): Promise<void> {
  return request<void>(`/api/questions/${id}`, 'DELETE');
}

// 导出供其他模块使用（如 mine 页面拼接头像完整 URL）
export { BASE_URL };
