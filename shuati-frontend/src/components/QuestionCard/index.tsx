import React from 'react';
import { View, Text } from '@tarojs/components';
import { Question, QuestionType } from '@/types';
import styles from './index.module.scss';

interface QuestionCardProps {
  question: Question;
  onClick?: () => void;
}

const typeMap: Record<QuestionType, string> = {
  SINGLE_CHOICE: '单选',
  MULTIPLE_CHOICE: '多选',
  JUDGEMENT: '判断',
  FILL_BLANK: '填空',
  ESSAY: '解答'
};

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onClick }) => {
  return (
    <View className={styles.card} onClick={onClick}>
      <View className={styles.header}>
        <Text className={styles.subject}>{question.subjectName}</Text>
        <Text className={styles.type}>{typeMap[question.type]}</Text>
      </View>
      <Text className={styles.content}>{question.content}</Text>
      <View className={styles.footer}>
        <Text className={styles.score}>分值 {question.score}分</Text>
        <Text className={styles.action}>去练习</Text>
      </View>
    </View>
  );
};

export default QuestionCard;
