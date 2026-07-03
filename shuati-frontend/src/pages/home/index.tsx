import React, { useEffect, useState, Component } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useUserStore } from '@/store/user';
import { getCurrentUser, getLastPracticePosition, getMyStatistics, getSubjects } from '@/services/api';
import { LastPracticePosition, Subject, UserStatistics } from '@/types';
import getSubjectsMock from '@/data/subjects';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

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
  const { user, setUser } = useUserStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<UserStatistics>({ todayCount: 0, totalCount: 0, correctRate: 0 });
  const [lastPosition, setLastPosition] = useState<LastPracticePosition | null>(null);

  const fetchLastPosition = () => {
    getLastPracticePosition()
      .then(setLastPosition)
      .catch((e: Error) => {
        console.log('[HomePage] getLastPracticePosition failed:', e.message);
      });
  };

  useEffect(() => {
    getCurrentUser().then(setUser).catch((e: Error) => {
      console.log('[HomePage] getCurrentUser failed:', e.message);
    });
    getMyStatistics()
      .then(setStats)
      .catch((e: Error) => {
        console.log('[HomePage] getMyStatistics failed:', e.message);
      });
    fetchLastPosition();
    getSubjects().then((res) => {
      const mock = getSubjectsMock();
      const base = res.length > 0 ? res : mock;
      const imageByName = new Map(mock.map((s) => [s.name, s.image]));
      const imageByCode = new Map(mock.map((s) => [s.code, s.image]));
      const nameByCode = new Map(mock.map((s) => [s.code, s.name]));
      setSubjects(
        base.map((s) => ({
          ...s,
          name: nameByCode.get(s.code) || s.name,
          image: s.image || imageByName.get(s.name) || imageByCode.get(s.code)
        }))
      );
    });
  }, []);

  useDidShow(() => {
    fetchLastPosition();
  });

  const goPractice = (subjectId: number) => {
    Taro.navigateTo({ url: `/pages/question/index?subjectId=${subjectId}` });
  };

  const resumePractice = () => {
    if (!lastPosition) return;
    Taro.navigateTo({
      url: `/pages/question/index?subjectId=${lastPosition.subjectId}&questionId=${lastPosition.questionId}`
    });
  };

  return (
    <ErrorCatcher>
      <View className={styles.page}>
        <View className={styles.header}>
          <Text className={styles.greeting}>你好，{user?.nickname || '同学'}</Text>
          <Text className={styles.subtitle}>今天也来做几道题吧</Text>
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
                  ? `继续刷 ${lastPosition.subjectName}`
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
      </View>
    </ErrorCatcher>
  );
};

console.log('[HomePage] module loaded');

export default HomePage;
