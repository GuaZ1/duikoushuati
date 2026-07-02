import React, { useEffect, useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useUserStore } from '@/store/user';
import { BASE_URL, getCurrentUser, getMyStatistics } from '@/services/api';
import { UserStatistics } from '@/types';
import StatCard from '@/components/StatCard';
import styles from './index.module.scss';

function toFullUrl(url?: string): string | undefined {
  if (!url) {
    return undefined;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${BASE_URL}${url}`;
}

const MinePage: React.FC = () => {
  const { user, setUser } = useUserStore();
  const [stats, setStats] = useState<UserStatistics>({ todayCount: 0, totalCount: 0, correctRate: 0 });

  useEffect(() => {
    getCurrentUser().then(setUser);
    getMyStatistics().then(setStats);
  }, []);

  return (
    <View className={styles.page}>
      <View className={styles.profile}>
        <View className={styles.avatar}>
          {user?.avatar ? (
            <Image className={styles.avatarImage} src={toFullUrl(user.avatar)} mode="aspectFill" />
          ) : (
            <Text className={styles.avatarText}>
              {user?.nickname ? user.nickname[0] : '同'}
            </Text>
          )}
        </View>
        <View className={styles.info}>
          <Text className={styles.name}>{user?.nickname || '同学'}</Text>
          <Text className={styles.meta}>
            {user?.grade} · {user?.school}
          </Text>
        </View>
      </View>

      <View className={styles.stats}>
        <StatCard title="练习次数" value={stats.totalCount} color="primary" />
      </View>

      <View className={styles.menuCard}>
        <View
          className={styles.menuItem}
          onClick={() => Taro.navigateTo({ url: '/pages/wrongbook/index' })}
        >
          <Text className={styles.menuText}>错题本</Text>
          <Text className={styles.arrow}>›</Text>
        </View>
      </View>
    </View>
  );
};

export default MinePage;
