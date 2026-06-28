import React, { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useUserStore } from '@/store/user';
import { getUserInfo, getProgress } from '@/services/api';
import { ProgressItem } from '@/types';
import StatCard from '@/components/StatCard';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const { user, setUser } = useUserStore();
  const [progress, setProgress] = useState<ProgressItem[]>([]);

  useEffect(() => {
    getUserInfo(1).then(setUser);
    getProgress(1).then(setProgress);
  }, []);

  const totalPracticed = progress.reduce((sum, p) => sum + p.practicedCount, 0);
  const totalCorrect = progress.reduce((sum, p) => sum + p.correctCount, 0);
  const avgRate = totalPracticed
    ? Math.round((totalCorrect / totalPracticed) * 100)
    : 0;

  return (
    <View className={styles.page}>
      <View className={styles.profile}>
        <View className={styles.avatar}>
          <Text className={styles.avatarText}>
            {user?.nickname ? user.nickname[0] : '同'}
          </Text>
        </View>
        <View className={styles.info}>
          <Text className={styles.name}>{user?.nickname || '同学'}</Text>
          <Text className={styles.meta}>
            {user?.grade} · {user?.school}
          </Text>
        </View>
      </View>

      <View className={styles.stats}>
        <StatCard title="练习次数" value={totalPracticed} color="primary" />
        <StatCard title="正确率" value={`${avgRate}%`} color="success" />
      </View>

      <View className={styles.menuCard}>
        <View
          className={styles.menuItem}
          onClick={() => Taro.navigateTo({ url: '/pages/wrongbook/index' })}
        >
          <Text className={styles.menuText}>错题本</Text>
          <Text className={styles.arrow}>›</Text>
        </View>
        <View className={styles.divider} />
        <View
          className={styles.menuItem}
          onClick={() => Taro.navigateTo({ url: '/pages/result/index' })}
        >
          <Text className={styles.menuText}>学习报告</Text>
          <Text className={styles.arrow}>›</Text>
        </View>
      </View>
    </View>
  );
};

export default MinePage;
