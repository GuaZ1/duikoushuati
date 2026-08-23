import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { AnswerResult, ExamRecord, ExamResultPayload, Question, WrongbookResultPayload } from '@/types';
import { useUserStore } from '@/store/user';
import {
  getPracticeQuestions,
  getChapterPracticeQuestions,
  getWrongbookPracticeQuestions,
  submitAnswer
} from '@/services/api';
import {
  startSession,
  startWrongbookSession,
  resumeSession,
  saveSessionIndex,
  savePracticeProgress,
  startExamSession,
  resumeExamSession,
  saveExamSessionProgress,
  clearExamSession,
  markExamUsed
} from '@/services/practiceSession';
import EmptyState from '@/components/EmptyState';
import ResultDialog from '@/components/ResultDialog';
import FeedbackDialog from '@/components/FeedbackDialog';
import styles from './index.module.scss';

// 错题本专项练习复用答题页，用固定的负数 id 作为其本地会话缓存 key，与真实科目区分开
const WRONGBOOK_SUBJECT_ID = -1;

// 考试模式结果报告的本地缓存 key
const EXAM_RESULT_KEY = 'exam_result_payload';

// 错题本结果报告的本地缓存 key
const WRONGBOOK_RESULT_KEY = 'wrongbook_result_payload';

const QuestionPage: React.FC = () => {
  const { user } = useUserStore();
  const [subjectId, setSubjectId] = useState(0);
  const [wrongbook, setWrongbook] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string>('');
  // 填空题答案输入框的内容；与 selected 分离，保证考试模式「选完即锁定」判断不受输入过程影响
  const [fillInput, setFillInput] = useState('');
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [subjectName, setSubjectName] = useState('');
  // 章节练习模式：当前所在章节名，显示在科目名右侧
  const [chapterName, setChapterName] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [exam, setExam] = useState(false);
  // 章节练习模式：标识当前是否为章节练习（与自由练习区分，用于答题时上报 mode）
  const [chapter, setChapter] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [answers, setAnswers] = useState<(ExamRecord | null)[]>([]);
  // 考试模式滑动切题的动画方向：next 从右滑入、prev 从左滑入
  const [slideDir, setSlideDir] = useState<'next' | 'prev' | null>(null);
  // 题目反馈弹窗：做题时点击「题目有问题？点击反馈」打开
  const [feedbackVisible, setFeedbackVisible] = useState(false);
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
    if (params?.mode === 'chapter') {
      const sid = Number(params?.subjectId);
      const kid = Number(params?.knowledgeId);
      if (sid && kid) {
        setSubjectId(sid);
        setChapter(true);
        setChapterName(params?.knowledgeName ? decodeURIComponent(params.knowledgeName) : '');
        loadChapterQuestions(sid, kid);
      }
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
      // 每次进入错题本都是一局全新会话：重新拉取（含最新 weight）并洗牌取 10 道。
      // 同局内尽量不重复，错题库不足 10 道时重复凑满；不同局之间同一道错题可以重复出现。
      const ordered = startWrongbookSession(list);
      setQuestions(ordered);
      setCurrentIndex(0);
      setAnswers([]);
      setCorrectCount(0);
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
        // 恢复作答记录与正确数，保证完成弹窗按整局统计；旧缓存无这两个字段时兜底
        const restoredAnswers =
          session.answers || new Array(session.questions.length).fill(null);
        setAnswers(restoredAnswers);
        setCorrectCount(session.correctCount || 0);
        // 恢复当前题已作答状态（选中项与解析），避免续做后看起来像未答
        const current = restoredAnswers[session.currentIndex];
        if (current) {
          setSelected(current.selectedKey);
          setFillInput(current.selectedKey);
          setResult({
            correctStatus: current.correctStatus,
            correctAnswer: current.correctAnswer,
            analysis: current.analysis,
            score: current.score
          });
        }
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

  // 章节练习模式：按知识点拉题 → 洗牌 → 写入缓存。
  // 复用练习模式的会话机制（sessionKey 用 subjectId），正确率统计与跳题逻辑一致；
  // 与自由练习共享同一份 subjectId 缓存，后开的会覆盖先开的续做位置，属可接受折衷。
  const loadChapterQuestions = async (sid: number, knowledgeId: number) => {
    try {
      const list = await getChapterPracticeQuestions(sid, knowledgeId);
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
        setSelected(session.answers[session.currentIndex]?.selectedKey || '');
        setFillInput(session.answers[session.currentIndex]?.selectedKey || '');
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
  // 已出结果（练习/错题本）或考试模式该题已作答：填空输入框与提交按钮锁定
  const locked = Boolean(result) || (exam && Boolean(answers[currentIndex]));

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // 考试模式：当前题已答（含返回上一题查看）→ 显示「下一题/提交答卷」；未答题答完自动跳转
  const examAnswered = Boolean(answers[currentIndex]);
  const footerVisible = exam ? examAnswered : Boolean(result);
  const footerText = isLast ? (exam ? '提交答卷' : wrongbook ? '查看错题报告' : '完成练习') : '下一题';

  const handleSelect = async (optionKey: string) => {
    if (!question || result) return;
    // 考试模式：一题一次选择机会，选完即锁定
    if (exam && selected) return;
    if (question.type === 'FILL_BLANK' && !optionKey.trim()) {
      Taro.showToast({ title: '请输入答案', icon: 'none' });
      return;
    }
    setSelected(optionKey);
    try {
      const res = await submitAnswer(
        question.id,
        optionKey,
        wrongbook ? 'WRONGBOOK' : exam ? 'EXAM' : chapter ? 'CHAPTER' : 'PRACTICE'
      );
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
        setFillInput('');
        saveExamSessionProgress(subjectId, {
          currentIndex: nextIndex,
          elapsedSeconds: elapsed
        });
        return;
      }
      setResult(res);
      // 练习/错题本统一记录本题作答（供正确率统计与续做恢复）。
      // 用「重算正确数」而非「累加」：箭头回看重新作答时旧记录被覆盖，不会重复计数。
      const nextAnswers = answers.slice();
      nextAnswers[currentIndex] = {
        selectedKey: optionKey,
        correctStatus: res.correctStatus,
        correctAnswer: res.correctAnswer,
        analysis: res.analysis,
        score: res.score
      };
      setAnswers(nextAnswers);
      const newCorrectCount = nextAnswers.filter((a) => a?.correctStatus === 'CORRECT').length;
      setCorrectCount(newCorrectCount);
      savePracticeProgress(subjectId, { answers: nextAnswers, correctCount: newCorrectCount });
      // 错题本模式：用后端回传的最新 weight 刷新 5 个点
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
    setFillInput(answers[nextIndex]?.selectedKey || '');
    saveExamSessionProgress(subjectId, { currentIndex: nextIndex, elapsedSeconds: elapsed });
  };

  // 考试模式：回到上一题
  const examPrev = () => {
    if (!exam || currentIndex <= 0) return;
    const prevIndex = currentIndex - 1;
    setSlideDir('prev');
    setCurrentIndex(prevIndex);
    setSelected(answers[prevIndex]?.selectedKey || '');
    setFillInput(answers[prevIndex]?.selectedKey || '');
    saveExamSessionProgress(subjectId, { currentIndex: prevIndex, elapsedSeconds: elapsed });
  };

  // 练习/错题本模式：跳转到指定题目，dir 控制切题动画方向（与考试模式滑动同款）。
  // 目标题已作答 → 恢复之前答案并锁定（显示解析，不可修改）；未作答 → 清空作答状态。
  const jumpTo = (index: number, dir: 'next' | 'prev') => {
    setSlideDir(dir);
    setCurrentIndex(index);
    saveSessionIndex(subjectId, index);
    const record = answers[index];
    if (record) {
      setSelected(record.selectedKey);
      setFillInput(record.selectedKey);
      setResult({
        correctStatus: record.correctStatus,
        correctAnswer: record.correctAnswer,
        analysis: record.analysis,
        score: record.score
      });
    } else {
      setSelected('');
      setFillInput('');
      setResult(null);
    }
  };

  // 练习/错题本模式：右箭头跳下一题。已出结果（出现「下一题」按钮）时禁用，避免与按钮重复
  const practiceNext = () => {
    if (exam || isLast || footerVisible) return;
    jumpTo(currentIndex + 1, 'next');
  };

  // 练习/错题本模式：左箭头返回上一题（已答过的题恢复答案并锁定，不可修改）
  const practicePrev = () => {
    if (exam || currentIndex <= 0) return;
    jumpTo(currentIndex - 1, 'prev');
  };

  // 考试模式滑动切题：右滑上一题、左滑下一题，未作答也可直接滑动
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
      examPrev();
    } else {
      examNext();
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
      if (wrongbook) {
        showWrongbookReport();
        return;
      }
      setShowDialog(true);
      return;
    }
    jumpTo(currentIndex + 1, 'next');
  };

  // 错题本：10 道刷完跳报告页，报告只展示本局做错的题
  const showWrongbookReport = () => {
    const payload: WrongbookResultPayload = {
      questions,
      answers
    };
    Taro.setStorageSync(WRONGBOOK_RESULT_KEY, payload);
    Taro.redirectTo({ url: '/pages/wrongbook/result/index' });
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
    <View className={styles.page} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <View className={styles.progress}>
        <View className={styles.progressLeft}>
          {exam && (
            <View className={styles.prevButton} onClick={goHome}>
              <Text className={styles.prevText}>‹ 返回主页</Text>
            </View>
          )}
          <Text className={styles.subject}>{subjectName}</Text>
          {chapterName && <Text className={styles.chapterName}>{chapterName}</Text>}
        </View>
        <View className={styles.progressRight}>
          {exam && <Text className={styles.timer}>{formatTime(elapsed)}</Text>}
          <View className={styles.feedbackEntry} onClick={() => setFeedbackVisible(true)}>
            <Text className={styles.feedbackEntryText}>题目有问题？点击反馈</Text>
          </View>
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
        key={`${exam ? 'exam' : 'practice'}-${currentIndex}`}
        className={classnames(
          slideDir === 'next' && styles.slideInRight,
          slideDir === 'prev' && styles.slideInLeft
        )}
      >
      <View className={styles.card}>
        {question.type === 'FILL_BLANK' && (
          <Text className={styles.fillHint}>如果有多个空，用逗号隔开，不区分大小写</Text>
        )}
        <Text className={styles.content}>{question.content}</Text>
      </View>

      <View className={styles.card}>
        {question.options && question.options.length > 0 ? (
          question.options.map((opt) => (
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
          ))
        ) : question.type === 'TRUE_FALSE' ? (
          [
            { key: 'T', label: '正确' },
            { key: 'F', label: '错误' }
          ].map(({ key, label }) => (
            <View
              key={key}
              className={classnames(
                styles.option,
                selected === key && styles.optionSelected,
                result && key === result.correctAnswer && styles.optionCorrect,
                result &&
                  selected === key &&
                  result.correctStatus !== 'CORRECT' &&
                  styles.optionWrong
              )}
              onClick={() => handleSelect(key)}
            >
              <Text className={styles.optionKey}>{key}</Text>
              <Text className={styles.optionContent}>{label}</Text>
            </View>
          ))
        ) : question.type === 'FILL_BLANK' ? (
          <View>
            <Input
              className={styles.fillInput}
              value={fillInput}
              disabled={locked}
              placeholder="请输入答案"
              onInput={(e) => setFillInput(e.detail.value)}
            />
            {!locked && (
              <View className={styles.fillSubmit} onClick={() => handleSelect(fillInput)}>
                <Text className={styles.fillSubmitText}>提交答案</Text>
              </View>
            )}
          </View>
        ) : null}
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
        <View className={styles.navRow}>
          <View
            className={classnames(styles.navArrow, currentIndex <= 0 && styles.navArrowDisabled)}
            onClick={() => (exam ? examPrev() : practicePrev())}
          >
            <Text className={styles.navArrowText}>‹</Text>
          </View>
          {footerVisible && (
            <View className={styles.submitButtonFlex} onClick={handleNext}>
              <Text className={styles.submitText}>{footerText}</Text>
            </View>
          )}
          <View
            className={classnames(
              styles.navArrow,
              (isLast || (!exam && footerVisible)) && styles.navArrowDisabled
            )}
            onClick={() => (exam ? examNext() : practiceNext())}
          >
            <Text className={styles.navArrowText}>›</Text>
          </View>
        </View>
      </View>

      <FeedbackDialog
        visible={feedbackVisible}
        questionId={question.id}
        onCancel={() => setFeedbackVisible(false)}
      />
    </View>
  );
};

export default QuestionPage;
