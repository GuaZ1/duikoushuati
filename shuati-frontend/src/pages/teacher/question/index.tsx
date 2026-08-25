import React, { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { KnowledgePoint, Question, Subject } from '@/types';
import { useUserStore } from '@/store/user';
import {
  deleteQuestion,
  getKnowledgePoints,
  getQuestions,
  getSubjects
} from '@/services/api';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const TeacherQuestionPage: React.FC = () => {
  const { user } = useUserStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
  const [knowledgePointId, setKnowledgePointId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!user || user.role !== 'TEACHER') {
      Taro.showToast({ title: '无教师权限', icon: 'none' });
      setTimeout(() => Taro.switchTab({ url: '/pages/home/index' }), 1500);
    }
  }, [user]);

  useEffect(() => {
    getSubjects().then(setSubjects);
  }, []);

  // 切换学科：加载该学科知识点，清空已选题和题目列表（不直接查题）
  useEffect(() => {
    setKnowledgePointId(undefined);
    setQuestions([]);
    if (subjectId === undefined) {
      setKnowledgePoints([]);
      return;
    }
    getKnowledgePoints(subjectId)
      .then(setKnowledgePoints)
      .catch((e) => {
        console.error(e);
        setKnowledgePoints([]);
      });
  }, [subjectId]);

  // 点击具体知识点后，才按知识点查题（后端 ORDER BY id 升序）
  useEffect(() => {
    if (subjectId === undefined || knowledgePointId === undefined) {
      setQuestions([]);
      return;
    }
    loadQuestions();
  }, [knowledgePointId]);

  const loadQuestions = async () => {
    try {
      const list = await getQuestions({
        subjectId,
        knowledgePointId
      });
      setQuestions(list);
    } catch (e) {
      console.error(e);
    }
  };

  const goForm = (id?: number) => {
    const url = id
      ? `/pages/teacher/question/form?id=${id}`
      : '/pages/teacher/question/form';
    Taro.navigateTo({ url });
  };

  const handleDelete = (id: number) => {
    Taro.showModal({
      title: '确认删除',
      content: '删除后不可恢复，是否继续？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteQuestion(id);
            Taro.showToast({ title: '删除成功', icon: 'success' });
            loadQuestions();
          } catch (e) {
            Taro.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>题目管理</Text>
        <View className={styles.addButton} onClick={() => goForm()}>
          <Text className={styles.addText}>+ 新增</Text>
        </View>
      </View>

      <View className={styles.filter}>
        <View
          className={`${styles.filterItem} ${
            subjectId === undefined ? styles.filterActive : ''
          }`}
          onClick={() => setSubjectId(undefined)}
        >
          <Text>全部</Text>
        </View>
        {subjects.map((s) => (
          <View
            key={s.id}
            className={`${styles.filterItem} ${
              subjectId === s.id ? styles.filterActive : ''
            }`}
            onClick={() => setSubjectId(s.id)}
          >
            <Text>{s.name}</Text>
          </View>
        ))}
      </View>

      {subjectId !== undefined && (
        <View className={styles.filter}>
          {knowledgePoints.map((k) => (
            <View
              key={k.id}
              className={`${styles.filterItem} ${
                knowledgePointId === k.id ? styles.filterActive : ''
              }`}
              onClick={() => setKnowledgePointId(k.id)}
            >
              <Text>{k.name}</Text>
            </View>
          ))}
        </View>
      )}

      <View className={styles.list}>
        {subjectId === undefined ? (
          <EmptyState title="请先选择科目" />
        ) : knowledgePointId === undefined ? (
          <EmptyState title="请选择知识点" />
        ) : questions.length === 0 ? (
          <EmptyState title="暂无题目" />
        ) : (
          questions.map((q) => (
            <View key={q.id} className={styles.card}>
              <View className={styles.cardHeader}>
                <Text className={styles.subject}>{q.subjectName}</Text>
                <Text className={styles.type}>{q.type}</Text>
              </View>
              <Text className={styles.content}>{q.content}</Text>
              <Text className={styles.answer}>正确答案：{q.answer}</Text>
              <View className={styles.actions}>
                <View
                  className={`${styles.actionButton} ${styles.edit}`}
                  onClick={() => goForm(q.id)}
                >
                  <Text className={styles.actionText}>编辑</Text>
                </View>
                <View
                  className={`${styles.actionButton} ${styles.delete}`}
                  onClick={() => handleDelete(q.id)}
                >
                  <Text className={styles.actionText}>删除</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

export default TeacherQuestionPage;
