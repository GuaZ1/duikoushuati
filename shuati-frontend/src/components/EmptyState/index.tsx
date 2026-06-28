import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  title?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title = '暂无数据' }) => {
  return (
    <View className={styles.container}>
      <Text className={styles.icon}>--</Text>
      <Text className={styles.title}>{title}</Text>
    </View>
  );
};

export default EmptyState;
