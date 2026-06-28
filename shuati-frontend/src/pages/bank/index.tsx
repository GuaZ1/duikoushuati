import React, { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Subject } from '@/types';
import { getSubjects } from '@/services/api';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const BankPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    getSubjects().then(setSubjects);
  }, []);

  const goPractice = (subjectId: number) => {
    Taro.navigateTo({ url: `/pages/question/index?subjectId=${subjectId}` });
  };

  return (
    <View className={styles.page}>
      <Text className={styles.title}>选择学科</Text>
      <Text className={styles.subtitle}>选择一门学科后开始刷题</Text>

      <View className={styles.grid}>
        {subjects.length === 0 && <EmptyState title="暂无学科" />}
        {subjects.map((s) => (
          <View
            key={s.id}
            className={styles.subjectCard}
            onClick={() => goPractice(s.id)}
          >
            <Text className={styles.subjectName}>{s.name}</Text>
            <Text className={styles.subjectCode}>{s.code}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default BankPage;
