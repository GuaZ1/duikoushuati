import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { ExamResultPayload } from '@/types';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

// 与答题页约定一致的本地缓存 key
const EXAM_RESULT_KEY = 'exam_result_payload';

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const ExamResultPage: React.FC = () => {
  const payload = Taro.getStorageSync<ExamResultPayload | ''>(EXAM_RESULT_KEY);

  if (!payload || !Array.isArray(payload.questions) || payload.questions.length === 0) {
    return (
      <View className={styles.page}>
        <EmptyState title="暂无考试记录" />
      </View>
    );
  }

  const total = payload.questions.length;
  const correct = payload.answers.filter((a) => a && a.correctStatus === 'CORRECT').length;
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0;

  const continueExam = () => {
    Taro.redirectTo({ url: `/pages/question/index?subjectId=${payload.subjectId}&mode=exam` });
  };

  const goHome = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.summary}>
        <Text className={styles.subjectName}>{payload.subjectName} · 考试报告</Text>
        <View className={styles.summaryStats}>
          <View className={styles.stat}>
            <Text className={styles.statValue}>
              {correct} / {total}
            </Text>
            <Text className={styles.statLabel}>答对</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.statValue}>{formatTime(payload.elapsedSeconds)}</Text>
            <Text className={styles.statLabel}>用时</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.statValue}>{rate}%</Text>
            <Text className={styles.statLabel}>正确率</Text>
          </View>
        </View>
      </View>

      <View className={styles.list}>
        {payload.questions.map((q, idx) => {
          const rec = payload.answers[idx];
          const correctOpt = rec?.correctAnswer;
          return (
            <View key={q.id} className={styles.item}>
              <View className={styles.itemHeader}>
                <Text className={styles.itemIndex}>第 {idx + 1} 题</Text>
                {rec && (
                  <Text
                    className={classnames(
                      styles.itemStatus,
                      rec.correctStatus === 'CORRECT'
                        ? styles.itemCorrect
                        : styles.itemWrong
                    )}
                  >
                    {rec.correctStatus === 'CORRECT' ? '正确' : '错误'}
                  </Text>
                )}
              </View>

              <Text className={styles.itemContent}>{q.content}</Text>

              {q.options?.map((opt) => {
                const isCorrectOpt = correctOpt === opt.optionKey;
                const isUserPick = rec?.selectedKey === opt.optionKey;
                const isWrongPick = isUserPick && rec?.correctStatus !== 'CORRECT';
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

              {rec && (
                <View className={styles.answerBlock}>
                  <Text className={styles.answerLine}>
                    你的答案：{rec.selectedKey || '未作答'}
                  </Text>
                  <Text className={styles.answerLine}>正确答案：{rec.correctAnswer}</Text>
                  <Text className={styles.analysis}>{rec.analysis}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View className={styles.footer}>
        <View className={styles.homeButton} onClick={goHome}>
          <Text className={styles.homeText}>返回首页</Text>
        </View>
        <View className={styles.continueButton} onClick={continueExam}>
          <Text className={styles.continueText}>继续答题</Text>
        </View>
      </View>
    </View>
  );
};

export default ExamResultPage;
