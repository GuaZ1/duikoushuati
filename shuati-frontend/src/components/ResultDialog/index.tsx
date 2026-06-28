import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface ResultDialogProps {
  visible: boolean;
  total: number;
  correct: number;
  rate: number;
  onConfirm: () => void;
}

const getComment = (rate: number) => {
  if (rate === 100) {
    const list = [
      '全对！太厉害了，继续保持！',
      '完美发挥，你是解题小能手！',
      '100分！今天的状态满分！',
    ];
    return list[Math.floor(Math.random() * list.length)];
  }
  if (rate >= 80) {
    const list = [
      '正确率很高，继续加油！',
      '做得很不错，再接再厉！',
      '优秀！再细心一点就能满分了！',
    ];
    return list[Math.floor(Math.random() * list.length)];
  }
  if (rate >= 60) {
    const list = [
      '及格啦，还有进步空间哦！',
      '继续练习，你会越来越棒！',
      '不错不错，错题记得复习～',
    ];
    return list[Math.floor(Math.random() * list.length)];
  }
  const list = [
    '别灰心，多刷题就能提高！',
    '错题是进步的阶梯，加油！',
    '再试一次，相信你可以更好！',
  ];
  return list[Math.floor(Math.random() * list.length)];
};

const ResultDialog: React.FC<ResultDialogProps> = ({
  visible,
  total,
  correct,
  rate,
  onConfirm,
}) => {
  if (!visible) return null;

  return (
    <View className={styles.overlay}>
      <View className={styles.dialog}>
        <Text className={styles.title}>练习完成</Text>
        <View className={styles.rateCircle}>
          <Text className={styles.rateValue}>{rate}%</Text>
          <Text className={styles.rateLabel}>正确率</Text>
        </View>
        <Text className={styles.summary}>
          共 {total} 题，正确 {correct} 题
        </Text>
        <Text className={styles.comment}>{getComment(rate)}</Text>
        <View className={styles.button} onClick={onConfirm}>
          <Text className={styles.buttonText}>知道了</Text>
        </View>
      </View>
    </View>
  );
};

export default ResultDialog;
