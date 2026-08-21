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
import getQuestionsMock, { getQuestionDetailMock } from '@/data/questions';
import getProgressMock from '@/data/progress';
import getWrongbookMock from '@/data/wrongbook';
import submitAnswerMock from '@/data/answer';
import { useUserStore } from '@/store/user';

const isWeapp = process.env.TARO_ENV === 'weapp';
const IS_DEV = process.env.NODE_ENV === 'development';

// H5 开发环境用本地 localhost，其他情况用环境变量或云托管地址
const BASE_URL = (() => {
  // H5 开发环境：强制使用 localhost
  if (!isWeapp && IS_DEV) {
    return 'http://localhost:8080';
  }
  // 其他情况：使用环境变量，如果没有则默认 localhost
  return process.env.TARO_APP_API_URL || 'http://localhost:8080';
})();

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

// H5 测试环境静默登录闸门：首次业务请求前自动用固定测试账号登录换取 token，
// 多个并发请求共享同一次登录，避免展示登录页与 401 反复跳转
let h5AuthPromise: Promise<void> | null = null;

function ensureH5Auth(): Promise<void> {
  if (isWeapp || getToken()) {
    return Promise.resolve();
  }
  if (!h5AuthPromise) {
    h5AuthPromise = loginByH5('', '')
      .then((data) => {
        Taro.setStorageSync('token', data.token);
        useUserStore.getState().setUser(data.user);
      })
      .catch((e) => {
        h5AuthPromise = null; // 登录失败允许下次重试
        console.warn('[API] H5 静默登录失败:', e);
      });
  }
  return h5AuthPromise;
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
  // 业务接口发起前，确保已完成 H5 静默登录拿到 token（后端强制鉴权，避免 401 被弹回登录页）
  if (!url.startsWith('/api/auth/')) {
    await ensureH5Auth();
  }
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

export async function loginByH5(
  nickname: string,
  avatarUrl: string
): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login/h5', 'POST', { nickname, avatarUrl });
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

// H5 专用：base64 上传头像
export async function uploadAvatarBase64(base64: string, ext: string): Promise<string> {
  return request<string>('/api/auth/upload/avatar/base64', 'POST', { base64, ext });
}

// ======================== 用户 ========================

export async function getCurrentUser(): Promise<User> {
  return request<User>('/api/users/me');
}

export async function updateProfile(nickname: string, avatar: string): Promise<User> {
  return request<User>('/api/users/me', 'PUT', { nickname, avatar });
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

// 学科列表：不传 fallback。冷启动失败就抛错，首页靠 ServerStartingDialog 提示用户，
// 后端就绪后自动刷新小程序重新拉取，避免显示与后端不一致的 mock 假学科。
export async function getSubjects(): Promise<Subject[]> {
  return request<Subject[]>('/api/subjects', 'GET');
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

// 错题本专项练习：拉取当前用户所有科目、未掌握的错题（含 weight），乱序在前端完成
export async function getWrongbookPracticeQuestions(): Promise<Question[]> {
  return request<Question[]>('/api/questions/wrongbook-practice', 'GET', undefined, () => getQuestionsMock());
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
  answer: string,
  mode?: 'WRONGBOOK'
): Promise<AnswerResult> {
  return request<AnswerResult>('/api/answers', 'POST', { questionId, answer, mode }, () =>
    submitAnswerMock(questionId, answer)
  );
}

// ======================== 题目反馈 ========================

// 学生做题时点击「题目有问题？点击反馈」提交文字反馈，写入 question_feedback 表。
// 不传 fallback：反馈必须落库，网络失败时让前端显示错误提示，不静默吞掉。
export async function submitQuestionFeedback(
  questionId: number,
  content: string
): Promise<number> {
  return request<number>('/api/feedback', 'POST', { questionId, content });
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
