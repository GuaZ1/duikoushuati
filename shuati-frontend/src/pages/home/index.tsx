import React, { useEffect, Component } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useUserStore } from '@/store/user';
import { getUserInfo } from '@/services/api';
import StatCard from '@/components/StatCard';
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

  useEffect(() => {
    getUserInfo(1).then(setUser).catch((e: Error) => {
      console.log('[HomePage] getUserInfo failed:', e.message);
    });
  }, []);

  const goBank = () => {
    Taro.switchTab({ url: '/pages/bank/index' });
  };

  return (
    <ErrorCatcher>
      <View className={styles.page}>
        <View className={styles.header}>
          <Text className={styles.greeting}>你好，{user?.nickname || '同学'}</Text>
          <Text className={styles.subtitle}>今天也来做几道题吧</Text>
        </View>

        <View className={styles.stats}>
          <StatCard title="今日练习" value="3" color="primary" />
          <StatCard title="累计答题" value="26" color="success" />
          <StatCard title="正确率" value="73%" color="warning" />
        </View>

        <View className={styles.card}>
          <Text className={styles.sectionTitle}>快速开始</Text>
          <View className={styles.quickButton} onClick={goBank}>
            <Text className={styles.quickText}>进入题库练习</Text>
          </View>
        </View>
      </View>
    </ErrorCatcher>
  );
};

console.log('[HomePage] module loaded');

export default HomePage;
