import React, { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { AnswerResult, Question } from '@/types';
import { getQuestions, submitAnswer } from '@/services/api';
import EmptyState from '@/components/EmptyState';
import ResultDialog from '@/components/ResultDialog';
import styles from './index.module.scss';

const QuestionPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string>('');
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [subjectName, setSubjectName] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const subjectId = Taro.getCurrentInstance().router?.params?.subjectId;
    if (subjectId) {
      loadQuestions(Number(subjectId));
    }
  }, []);

  const loadQuestions = async (subjectId: number) => {
    try {
      const list = await getQuestions({ subjectId });
      setQuestions(list);
      if (list.length > 0) {
        setSubjectName(list[0].subjectName);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const question = questions[currentIndex];
  const isLast = currentIndex >= questions.length - 1;

  const handleSelect = async (optionKey: string) => {
    if (!question || result) return;
    setSelected(optionKey);
    try {
      const res = await submitAnswer(1, question.id, optionKey);
      setResult(res);
      if (res.correctStatus === 'CORRECT') {
        setCorrectCount((prev) => prev + 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNext = () => {
    if (isLast) {
      setShowDialog(true);
      return;
    }
    setCurrentIndex(currentIndex + 1);
    setSelected('');
    setResult(null);
  };

  const handleFinish = () => {
    setShowDialog(false);
    Taro.navigateBack();
  };

  if (questions.length === 0) {
    return (
      <View className={styles.page}>
        <EmptyState title="该学科暂无题目" />
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.progress}>
        <Text className={styles.subject}>{subjectName}</Text>
        <Text className={styles.count}>
          {currentIndex + 1} / {questions.length}
        </Text>
      </View>

      <View className={styles.card}>
        <Text className={styles.content}>{question.content}</Text>
      </View>

      <View className={styles.card}>
        {question.options?.map((opt) => (
          <View
            key={opt.id}
            className={classnames(
              styles.option,
              selected === opt.optionKey && styles.optionSelected,
              result &&
                opt.optionKey === result.correctAnswer &&
                styles.optionCorrect,
              result &&
                selected === opt.optionKey &&
                result.correctStatus !== 'CORRECT' &&
                styles.optionWrong
            )}
            onClick={() => handleSelect(opt.optionKey)}
          >
            <Text className={styles.optionKey}>{opt.optionKey}</Text>
            <Text className={styles.optionContent}>{opt.content}</Text>
          </View>
        ))}
      </View>

      {result && (
        <View
          className={classnames(
            styles.resultCard,
            result.correctStatus === 'CORRECT'
              ? styles.resultCorrect
              : styles.resultWrong
          )}
        >
          <Text className={styles.resultTitle}>
            {result.correctStatus === 'CORRECT' ? '回答正确' : '回答错误'}
          </Text>
          <Text className={styles.resultAnswer}>
            正确答案：{result.correctAnswer}
          </Text>
          <Text className={styles.resultAnalysis}>{result.analysis}</Text>
        </View>
      )}

      <ResultDialog
        visible={showDialog}
        total={questions.length}
        correct={correctCount}
        rate={Math.round((correctCount / questions.length) * 100)}
        onConfirm={handleFinish}
      />

      <View className={styles.footer}>
        {result && (
          <View className={styles.submitButton} onClick={handleNext}>
            <Text className={styles.submitText}>
              {isLast ? '完成练习' : '下一题'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default QuestionPage;
