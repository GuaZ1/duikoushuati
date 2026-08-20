import React, { useEffect, useState, useRef, Component } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useUserStore } from '@/store/user';
import { getCurrentUser, getLastPracticePosition, getMyStatistics, getSubjects } from '@/services/api';
import { LastPracticePosition, Subject, UserStatistics } from '@/types';
import { getResumeKind, resumeExamSession, resumeSession } from '@/services/practiceSession';
import getSubjectsMock from '@/data/subjects';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import ModeDialog from '@/components/ModeDialog';
import ServerStartingDialog from '@/components/ServerStartingDialog';
import styles from './index.module.scss';

// 专业考试日期：2027-03-13（month 从 0 开始，2 表示三月）
const EXAM_DATE_MS = new Date(2027, 2, 13).getTime();
// 单招考试日期：2027-03-21
const DANZHAO_DATE_MS = new Date(2027, 2, 21).getTime();
// 初始化请求超过该时长仍未返回，判定云托管实例为 0、后端正在冷启动，弹出提示
const SERVER_STARTUP_TIMEOUT_MS = 3000;
// 弹窗弹出后，每隔该时长轮询一次后端是否就绪，就绪后自动刷新小程序
const SERVER_HEALTH_POLL_INTERVAL_MS = 3000;
const wrongbookImg = require('../../assets/subjects/wrongbook.jpg');

class ErrorCatcher extends Component<{ children: React.ReactNode }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    console.log('[ErrorCatcher] 捕获到渲染错误:', error.message);
    console.log('[ErrorCatcher] Stack:', error.stack);
    return { error };
  }
  render() {
    if (this.state.error) {
      return <View style={{ padding: '40rpx' }}><Text>渲染错误: {this.state.error.message}</Text></View>;
    }
    return this.props.children;
  }
}

const HomePage: React.FC = () => {
  const { setUser } = useUserStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<UserStatistics>({ todayCount: 0, totalCount: 0, correctRate: 0 });
  const [lastPosition, setLastPosition] = useState<LastPracticePosition | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [serverStarting, setServerStarting] = useState(false);
  const [modeSubject, setModeSubject] = useState<number | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLastPosition = () => {
    return getLastPracticePosition()
      .then(setLastPosition)
      .catch((e: Error) => {
        console.log('[HomePage] getLastPracticePosition failed:', e.message);
      });
  };

  useEffect(() => {
    // 学科列表：仅在后端返回有效数据时显示，不回退 mock（mock 数据对用户无意义）。
    // 后端冷启动失败时学科列表保持空，由 ServerStartingDialog 引导用户等待并自动刷新。
    const applySubjects = (list: Subject[]) => {
      const mock = getSubjectsMock();
      const imageByName = new Map(mock.map((s) => [s.name, s.image]));
      const imageByCode = new Map(mock.map((s) => [s.code, s.image]));
      const nameByCode = new Map(mock.map((s) => [s.code, s.name]));
      setSubjects(
        list.map((s) => ({
          ...s,
          name: nameByCode.get(s.code) || s.name,
          image: s.image || imageByName.get(s.name) || imageByCode.get(s.code)
        }))
      );
    };

    const tasks = [
      getCurrentUser().then(setUser).catch((e: Error) => {
        console.log('[HomePage] getCurrentUser failed:', e.message);
      }),
      getMyStatistics()
        .then(setStats)
        .catch((e: Error) => {
          console.log('[HomePage] getMyStatistics failed:', e.message);
        }),
      fetchLastPosition(),
      getSubjects()
        .then(applySubjects)
        .catch((e: Error) => {
          console.log('[HomePage] getSubjects failed, 等待后端就绪后自动刷新:', e.message);
        })
    ];

    // 5 秒内若请求仍未全部返回，判定云托管冷启动，弹出「服务器启动中」提示；
    // 之后每隔 3 秒轮询一次后端，一旦 getSubjects 成功响应说明后端就绪，
    // 自动 reLaunch 重新进入首页，重新拉取全部真实数据。
    const startupTimer = setTimeout(() => {
      console.log('[HomePage] 初始化超时，判定服务器正在启动，开始轮询后端');
      setServerStarting(true);
      pollTimerRef.current = setInterval(() => {
        getSubjects()
          .then(() => {
            console.log('[HomePage] 后端已就绪，自动刷新小程序');
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            Taro.reLaunch({ url: '/pages/home/index' });
          })
          .catch(() => {
            console.log('[HomePage] 后端仍未就绪，继续轮询');
          });
      }, SERVER_HEALTH_POLL_INTERVAL_MS);
    }, SERVER_STARTUP_TIMEOUT_MS);

    Promise.all(tasks).then(() => {
      clearTimeout(startupTimer);
      setServerStarting(false);
      setInitializing(false);
    });
    return () => {
      clearTimeout(startupTimer);
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  useDidShow(() => {
    fetchLastPosition();
  });

  const goPractice = (subjectId: number) => {
    setModeSubject(subjectId);
  };

  const handleModeSelect = (mode: 'practice' | 'exam') => {
    const sid = modeSubject;
    setModeSubject(null);
    if (sid == null) return;
    Taro.navigateTo({ url: `/pages/question/index?subjectId=${sid}&mode=${mode}` });
  };

  // 该学科存在未完成的练习或考试会话时，在模式弹窗里显示「回到上次刷题位置」
  const modeResumeAvailable =
    modeSubject != null &&
    (resumeSession(modeSubject) !== null || resumeExamSession(modeSubject) !== null);

  const handleResume = () => {
    const sid = modeSubject;
    setModeSubject(null);
    if (sid == null) return;
    // 最近一次是未完成的考试 → 续做考试；否则续做练习
    if (getResumeKind(sid) === 'exam') {
      Taro.navigateTo({ url: `/pages/question/index?subjectId=${sid}&mode=exam&resume=1` });
    } else {
      Taro.navigateTo({ url: `/pages/question/index?subjectId=${sid}&resume=1` });
    }
  };

  const goWrongbookPractice = () => {
    Taro.navigateTo({ url: '/pages/question/index?mode=wrongbook' });
  };

  // 服务器冷启动中：用户手动点「重新进入小程序」时触发。
  // 清掉轮询定时器，reLaunch 重置页面栈重新走首页初始化流程。
  const restartApp = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setServerStarting(false);
    Taro.reLaunch({ url: '/pages/home/index' });
  };

  const resumePractice = () => {
    if (!lastPosition) return;
    const sid = lastPosition.subjectId;
    // 最近一次是未完成的考试 → 直接续做考试；否则续做练习
    if (getResumeKind(sid) === 'exam') {
      Taro.navigateTo({ url: `/pages/question/index?subjectId=${sid}&mode=exam&resume=1` });
    } else {
      Taro.navigateTo({ url: `/pages/question/index?subjectId=${sid}&resume=1` });
    }
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const daysUntilExam = Math.max(0, Math.round((EXAM_DATE_MS - todayStart) / 86400000));
  const daysUntilDanzhao = Math.max(0, Math.round((DANZHAO_DATE_MS - todayStart) / 86400000));

  return (
    <ErrorCatcher>
      <View className={styles.page}>
        <View className={styles.header}>
          <View className={styles.countdownCard}>
            <Text className={styles.countdownTitle}>考试倒计时</Text>
            <View className={styles.examList}>
              <View className={styles.examItem}>
                <Text className={styles.examName}>专业考试</Text>
                <View className={styles.examDays}>
                  <Text className={styles.daysLabel}>还剩</Text>
                  <Text className={styles.daysNum}>{daysUntilExam}</Text>
                  <Text className={styles.daysUnit}>天</Text>
                </View>
              </View>
              <View className={styles.examItem}>
                <Text className={styles.examName}>单招考试</Text>
                <View className={styles.examDays}>
                  <Text className={styles.daysLabel}>还剩</Text>
                  <Text className={styles.daysNum}>{daysUntilDanzhao}</Text>
                  <Text className={styles.daysUnit}>天</Text>
                </View>
              </View>
            </View>
          </View>
          {initializing && <Text className={styles.serverHint}>服务器初始化中。。</Text>}
        </View>

        <View className={styles.stats}>
          <StatCard title="今日练习" value={stats.todayCount} color="primary" />
          <StatCard title="累计答题" value={stats.totalCount} color="success" />
        </View>

        {lastPosition && (
          <View className={styles.resumeCard} onClick={resumePractice}>
            <View className={styles.resumeInfo}>
              <Text className={styles.resumeTitle}>回到上次刷题的位置</Text>
              <Text className={styles.resumeSub}>
                {lastPosition.valid
                  ? `继续${getResumeKind(lastPosition.subjectId) === 'exam' ? '考试' : '刷'} ${lastPosition.subjectName}`
                  : '题目已失效，点击重新选择'}
              </Text>
            </View>
            <Text className={styles.resumeArrow}>›</Text>
          </View>
        )}

        <View className={styles.card}>
          <Text className={styles.sectionTitle}>选择学科</Text>
          <View className={styles.grid}>
            {subjects.length === 0 && <EmptyState title="暂无学科" />}
            <View
              className={styles.subjectCard}
              onClick={goWrongbookPractice}
            >
              <Image className={styles.wrongbookImage} src={wrongbookImg} mode="aspectFill" />
              <Text className={styles.subjectName}>错题本</Text>
            </View>
            {subjects.map((s) => (
              <View
                key={s.id}
                className={styles.subjectCard}
                onClick={() => goPractice(s.id)}
              >
                {s.image ? (
                  <Image className={styles.subjectImage} src={s.image} mode="aspectFill" />
                ) : (
                  <View className={styles.subjectFallback}>
                    <Text className={styles.subjectFallbackText}>{s.name}</Text>
                  </View>
                )}
                <Text className={styles.subjectName}>{s.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <ModeDialog
          visible={modeSubject !== null}
          onSelect={handleModeSelect}
          onCancel={() => setModeSubject(null)}
          resumeAvailable={modeResumeAvailable}
          onResume={handleResume}
        />
        <ServerStartingDialog visible={serverStarting} onRestart={restartApp} />
      </View>
    </ErrorCatcher>
  );
};

console.log('[HomePage] module loaded');

export default HomePage;
