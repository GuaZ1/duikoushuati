import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

const ResultPage: React.FC = () => {
  return (
    <View className={styles.page}>
      <Text className={styles.title}>学习报告</Text>
      <Text className={styles.tip}>功能开发中，敬请期待</Text>
    </View>
  );
};

export default ResultPage;
