import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface StatCardProps {
  title: string;
  value: string | number;
  color?: 'primary' | 'success' | 'warning';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color = 'primary' }) => {
  return (
    <View className={styles.card}>
      <Text className={styles.value}>{value}</Text>
      <Text className={styles.title}>{title}</Text>
      <View className={`${styles.bar} ${styles[color]}`} />
    </View>
  );
};

export default StatCard;
