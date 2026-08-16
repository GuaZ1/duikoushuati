import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { AnswerResult, ExamRecord, ExamResultPayload, Question } from '@/types';
import { useUserStore } from '@/store/user';
import { getPracticeQuestions, getWrongbookPracticeQuestions, submitAnswer } from '@/services/api';
import {
  startSession,
  resumeSession,
  saveSessionIndex,
  startExamSession,
  resumeExamSession,
  saveExamSessionProgress,
  clearExamSession,
  markExamUsed
} from '@/services/practiceSession';
import EmptyState from '@/components/EmptyState';
import ResultDialog from '@/components/ResultDialog';
import styles from './index.module.scss';

// 错题本专项练习复用答题页，用固定的负数 id 作为其本地会话缓存 key，与真实科目区分开
const WRONGBOOK_SUBJECT_ID = -1;

// 考试模式结果报告的本地缓存 key
const EXAM_RESULT_KEY = 'exam_result_payload';

const QuestionPage: React.FC = () => {
  const { user } = useUserStore();
  const [subjectId, setSubjectId] = useState(0);
  const [wrongbook, setWrongbook] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string>('');
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [subjectName, setSubjectName] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [exam, setExam] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [answers, setAnswers] = useState<(ExamRecord | null)[]>([]);
  // 考试模式滑动切题的动画方向：next 从右滑入、prev 从左滑入
  const [slideDir, setSlideDir] = useState<'next' | 'prev' | null>(null);
  const touchStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!user) {
      Taro.redirectTo({ url: '/pages/login/index' });
    }
  }, [user]);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params?.mode === 'exam') {
      const sid = Number(params?.subjectId);
      if (sid) {
        setExam(true);
        setSubjectId(sid);
        loadExamQuestions(sid, params?.resume === '1');
      }
      return;
    }
    if (params?.mode === 'wrongbook') {
      setWrongbook(true);
      setSubjectId(WRONGBOOK_SUBJECT_ID);
      setSubjectName('错题本');
      loadWrongbookQuestions();
      return;
    }
    const sid = params?.subjectId;
    const resume = params?.resume === '1';
    if (sid) {
      setSubjectId(Number(sid));
      loadQuestions(Number(sid), resume);
    }
  }, []);

  // 考试模式计时：每秒 +1，离开页面自动清除
  useEffect(() => {
    if (!exam) return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [exam]);

  // 供页面卸载时回写考试进度用的最新值引用
  const examRef = useRef(exam);
  const subjectIdRef = useRef(subjectId);
  const elapsedRef = useRef(elapsed);
  useEffect(() => { examRef.current = exam; }, [exam]);
  useEffect(() => { subjectIdRef.current = subjectId; }, [subjectId]);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  // 考试中途退出（返回首页）：把已用时长写回缓存，保证续做时计时连续
  useEffect(() => {
    return () => {
      if (examRef.current) {
        saveExamSessionProgress(subjectIdRef.current, { elapsedSeconds: elapsedRef.current });
      }
    };
  }, []);

  const applyQuestions = (list: Question[], index: number) => {
    setQuestions(list);
    if (list.length > 0) {
      setSubjectName(list[0].subjectName);
    }
    setCurrentIndex(Math.min(index, Math.max(list.length - 1, 0)));
  };

  const loadWrongbookQuestions = async () => {
    try {
      const list = await getWrongbookPracticeQuestions();
      if (list.length === 0) {
        setQuestions([]);
        return;
      }
      // 每次进入错题本都是一局全新会话：重新拉取（含最新 weight）并洗牌，
      // 保证同一道错题一局只出现一次，刷满 5 次需连续开 5 局。
      const ordered = startSession(WRONGBOOK_SUBJECT_ID, list);
      setQuestions(ordered);
      setCurrentIndex(0);
    } catch (e) {
      console.error(e);
    }
  };

  const loadQuestions = async (sid: number, resume: boolean) => {
    // 续做：直接复用上次缓存的乱序序列与进度，不重新洗牌、不请求网络，
    // 保证题目顺序与上次完全一致。
    if (resume) {
      const session = resumeSession(sid);
      if (session) {
        applyQuestions(session.questions, session.currentIndex);
        return;
      }
    }
    // 新开一局（或续做时本地缓存已丢失）：拉题 → 洗牌 → 写入缓存。
    try {
      const list = await getPracticeQuestions({ subjectId: sid });
      if (list.length === 0) {
        setQuestions([]);
        return;
      }
      const ordered = startSession(sid, list);
      applyQuestions(ordered, 0);
    } catch (e) {
      console.error(e);
    }
  };

  // 考试模式：拉全量 → 洗牌 → 截取前 10 题，每场随机且不重复
  // resume=1 时直接续做缓存里的同一场考试（题目、已答记录、进度、计时），不重新洗牌
  const loadExamQuestions = async (sid: number, resume: boolean) => {
    if (resume) {
      const session = resumeExamSession(sid);
      if (session) {
        setQuestions(session.questions);
        setSubjectName(session.questions[0]?.subjectName || '');
        setCurrentIndex(session.currentIndex);
        setAnswers(session.answers);
        setElapsed(session.elapsedSeconds);
        return;
      }
    }
    try {
      const list = await getPracticeQuestions({ subjectId: sid });
      if (list.length === 0) {
        setQuestions([]);
        return;
      }
      const session = startExamSession(sid, list);
      setQuestions(session.questions);
      setSubjectName(session.questions[0]?.subjectName || '');
      setCurrentIndex(0);
      setAnswers(session.answers);
      setElapsed(0);
    } catch (e) {
      console.error(e);
    }
  };

  const question = questions[currentIndex];
  const isLast = currentIndex >= questions.length - 1;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // 考试模式：当前题已答（含返回上一题查看）→ 显示「下一题/提交答卷」；未答题答完自动跳转
  const examAnswered = Boolean(answers[currentIndex]);
  const footerVisible = exam ? examAnswered : Boolean(result);
  const footerText = isLast ? (exam ? '提交答卷' : '完成练习') : '下一题';

  const handleSelect = async (optionKey: string) => {
    if (!question || result) return;
    // 考试模式：一题一次选择机会，选完即锁定
    if (exam && selected) return;
    setSelected(optionKey);
    try {
      const res = await submitAnswer(question.id, optionKey, wrongbook ? 'WRONGBOOK' : undefined);
      if (res.correctStatus === 'CORRECT') {
        setCorrectCount((prev) => prev + 1);
      }
      if (exam) {
        // 考试模式：不立即展示解析，仅记录作答供报告页使用，并写入考试会话缓存；
        // 未答题答完自动跳下一题，最后一题停留展示「提交答卷」
        const nextAnswers = answers.slice();
        nextAnswers[currentIndex] = {
          selectedKey: optionKey,
          correctStatus: res.correctStatus,
          correctAnswer: res.correctAnswer,
          analysis: res.analysis,
          score: res.score
        };
        setAnswers(nextAnswers);
        saveExamSessionProgress(subjectId, {
          currentIndex,
          answers: nextAnswers,
          elapsedSeconds: elapsed
        });
        if (isLast) {
          return;
        }
        const nextIndex = currentIndex + 1;
        setSlideDir('next');
        setCurrentIndex(nextIndex);
        setSelected('');
        saveExamSessionProgress(subjectId, {
          currentIndex: nextIndex,
          elapsedSeconds: elapsed
        });
        return;
      }
      setResult(res);
      // 错题本模式：用后端回传的最新 weight 刷新当前题的 5 个点（答对亮一个，答错清零）
      if (wrongbook && res.weight != null) {
        setQuestions((prev) =>
          prev.map((q, idx) => (idx === currentIndex ? { ...q, weight: res.weight } : q))
        );
      }
    } catch (e) {
      console.error(e);
      if (exam) setSelected('');
    }
  };

  // 考试模式：跳到下一题（最后一题时仅 allowFinish=true 才提交答卷，滑动触发不提交）
  const examNext = (allowFinish = false) => {
    if (!exam) return;
    if (isLast) {
      if (allowFinish) finishExam();
      return;
    }
    const nextIndex = currentIndex + 1;
    setSlideDir('next');
    setCurrentIndex(nextIndex);
    setSelected(answers[nextIndex]?.selectedKey || '');
    saveExamSessionProgress(subjectId, { currentIndex: nextIndex, elapsedSeconds: elapsed });
  };

  // 考试模式：回到上一题
  const examPrev = () => {
    if (!exam || currentIndex <= 0) return;
    const prevIndex = currentIndex - 1;
    setSlideDir('prev');
    setCurrentIndex(prevIndex);
    setSelected(answers[prevIndex]?.selectedKey || '');
    saveExamSessionProgress(subjectId, { currentIndex: prevIndex, elapsedSeconds: elapsed });
  };

  // 考试模式滑动切题：右滑下一题、左滑上一题，未作答也可直接滑动
  const onTouchStart = (e: any) => {
    const t = e.touches?.[0];
    if (!t) return;
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: any) => {
    if (!exam) return;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    // 位移过小视为点按，纵向位移大视为滚动，均不触发切题
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) {
      examNext();
    } else {
      examPrev();
    }
  };

  const goHome = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  const handleNext = () => {
    if (exam) {
      examNext(true);
      return;
    }
    if (isLast) {
      setShowDialog(true);
      return;
    }
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    saveSessionIndex(subjectId, nextIndex);
    setSelected('');
    setResult(null);
  };

  const handleFinish = () => {
    setShowDialog(false);
    Taro.navigateBack();
  };

  const finishExam = () => {
    const payload: ExamResultPayload = {
      subjectId,
      subjectName,
      elapsedSeconds: elapsed,
      questions,
      answers
    };
    Taro.setStorageSync(EXAM_RESULT_KEY, payload);
    // 考试已完成：把本场做过的题记为已用，供下一场考试排除；同时清除会话缓存
    markExamUsed(subjectId, questions.map((q) => q.id));
    clearExamSession(subjectId);
    Taro.redirectTo({ url: '/pages/exam/result/index' });
  };

  if (questions.length === 0) {
    return (
      <View className={styles.page}>
        <EmptyState title={wrongbook ? '暂无错题，继续保持' : '该学科暂无题目'} />
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.progress}>
        <View className={styles.progressLeft}>
          {exam && (
            <View className={styles.prevButton} onClick={goHome}>
              <Text className={styles.prevText}>‹ 返回主页</Text>
            </View>
          )}
          <Text className={styles.subject}>{subjectName}</Text>
        </View>
        <View className={styles.progressRight}>
          {exam && <Text className={styles.timer}>{formatTime(elapsed)}</Text>}
          <Text className={styles.count}>
            {currentIndex + 1} / {questions.length}
          </Text>
        </View>
      </View>

      {wrongbook && (
        <View className={styles.weightRow}>
          <Text className={styles.weightLabel}>掌握进度</Text>
          <View className={styles.weightDots}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                className={classnames(
                  styles.weightDot,
                  i < (question.weight || 0) && styles.weightDotActive
                )}
              />
            ))}
          </View>
        </View>
      )}

      <View
        key={exam ? `exam-${currentIndex}` : 'content'}
        className={classnames(
          exam && slideDir === 'next' && styles.slideInRight,
          exam && slideDir === 'prev' && styles.slideInLeft
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
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
        {footerVisible && (
          <View className={styles.submitButton} onClick={handleNext}>
            <Text className={styles.submitText}>{footerText}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default QuestionPage;
