import React, { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import { getWrongbook } from '@/services/api';
import { WrongNotebookItem } from '@/types';
import styles from './index.module.scss';

const WrongbookPage: React.FC = () => {
  const [list, setList] = useState<WrongNotebookItem[]>([]);

  useEffect(() => {
    getWrongbook(1).then(setList);
  }, []);

  return (
    <View className={styles.page}>
      <Text className={styles.title}>我的错题本</Text>
      {list.length === 0 ? (
        <Text className={styles.empty}>暂无错题，继续保持</Text>
      ) : (
        list.map((item) => (
          <View key={item.questionId} className={styles.card}>
            <Text className={styles.content}>{item.content}</Text>
            <Text className={styles.meta}>
              错题次数：{item.wrongCount}
            </Text>
          </View>
        ))
      )}
    </View>
  );
};

export default WrongbookPage;
