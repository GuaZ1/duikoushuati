import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { Question, WrongbookResultPayload } from '@/types';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

// 与答题页约定一致的本地缓存 key
const WRONGBOOK_RESULT_KEY = 'wrongbook_result_payload';

const WrongbookResultPage: React.FC = () => {
  const payload = Taro.getStorageSync<WrongbookResultPayload | ''>(WRONGBOOK_RESULT_KEY);

  const continuePractice = () => {
    Taro.redirectTo({ url: '/pages/question/index?mode=wrongbook' });
  };

  const goHome = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  if (!payload || !Array.isArray(payload.questions) || payload.questions.length === 0) {
    return (
      <View className={styles.page}>
        <EmptyState title="暂无错题记录" />
      </View>
    );
  }

  const total = payload.questions.length;
  const correct = payload.answers.filter((a) => a && a.correctStatus === 'CORRECT').length;
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
  // 报告只展示本局做错的题
  const wrongList = payload.questions
    .map((q, idx) => ({ q, rec: payload.answers[idx] }))
    .filter(({ rec }) => rec && rec.correctStatus !== 'CORRECT');

  return (
    <View className={styles.page}>
      <View className={styles.summary}>
        <Text className={styles.subjectName}>错题本 · 错题报告</Text>
        <View className={styles.summaryStats}>
          <View className={styles.stat}>
            <Text className={styles.statValue}>
              {correct} / {total}
            </Text>
            <Text className={styles.statLabel}>答对</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.statValue}>{rate}%</Text>
            <Text className={styles.statLabel}>正确率</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.statValue}>{wrongList.length}</Text>
            <Text className={styles.statLabel}>待复习</Text>
          </View>
        </View>
      </View>

      {wrongList.length === 0 ? (
        <View className={styles.allCorrect}>
          <Text className={styles.allCorrectText}>全部答对，错题已消灭，继续保持！</Text>
        </View>
      ) : (
        <View className={styles.list}>
          {wrongList.map(({ q, rec }, idx) => (
            <WrongItem key={q.id} question={q} selectedKey={rec!.selectedKey} correctAnswer={rec!.correctAnswer} analysis={rec!.analysis} index={idx} />
          ))}
        </View>
      )}

      <View className={styles.footer}>
        <View className={styles.homeButton} onClick={goHome}>
          <Text className={styles.homeText}>返回首页</Text>
        </View>
        <View className={styles.continueButton} onClick={continuePractice}>
          <Text className={styles.continueText}>继续刷错题</Text>
        </View>
      </View>
    </View>
  );
};

interface WrongItemProps {
  question: Question;
  selectedKey: string;
  correctAnswer: string;
  analysis: string;
  index: number;
}

const WrongItem: React.FC<WrongItemProps> = ({
  question: q,
  selectedKey,
  correctAnswer,
  analysis,
  index
}) => (
  <View className={styles.item}>
    <View className={styles.itemHeader}>
      <Text className={styles.itemIndex}>第 {index + 1} 题</Text>
      <Text className={classnames(styles.itemStatus, styles.itemWrong)}>答错</Text>
    </View>

    <Text className={styles.itemContent}>{q.content}</Text>

    {q.options?.map((opt) => {
      const isCorrectOpt = correctAnswer === opt.optionKey;
      const isUserPick = selectedKey === opt.optionKey;
      const isWrongPick = isUserPick && !isCorrectOpt;
      return (
        <View
          key={opt.id}
          className={classnames(
            styles.opt,
            isCorrectOpt && styles.optCorrect,
            isWrongPick && styles.optWrong
          )}
        >
          <Text className={styles.optKey}>{opt.optionKey}</Text>
          <Text className={styles.optContent}>{opt.content}</Text>
          {isUserPick && <Text className={styles.optFlag}>你的选择</Text>}
        </View>
      );
    })}

    <View className={styles.answerBlock}>
      <Text className={styles.answerLine}>
        你的答案：{selectedKey || '未作答'}
      </Text>
      <Text className={styles.answerLine}>正确答案：{correctAnswer}</Text>
      <Text className={styles.analysis}>{analysis}</Text>
    </View>
  </View>
);

export default WrongbookResultPage;
