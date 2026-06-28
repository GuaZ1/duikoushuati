import React, { useEffect, useState } from 'react';
import { View, Text, Input, Textarea, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Question, QuestionOption, Subject } from '@/types';
import {
  createQuestion,
  getQuestionDetail,
  getSubjects,
  updateQuestion
} from '@/services/api';
import styles from './form.module.scss';

const typeOptions = [
  { value: 'SINGLE_CHOICE', label: '单选题' },
  { value: 'MULTIPLE_CHOICE', label: '多选题' },
  { value: 'FILL_BLANK', label: '填空题' },
  { value: 'ESSAY', label: '问答题' }
];

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

const isChoice = (type: string) =>
  type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE';

const defaultOptions = (): QuestionOption[] =>
  OPTION_KEYS.map((key) => ({
    id: 0,
    optionKey: key,
    content: '',
    isCorrect: false
  }));

const buildOptionsFromAnswer = (
  type: string,
  answer: string,
  existingOptions?: QuestionOption[]
): QuestionOption[] => {
  const correctKeys = answer
    .split(/[,，]/)
    .map((k) => k.trim().toUpperCase())
    .filter(Boolean);
  return OPTION_KEYS.map((key) => {
    const existing = existingOptions?.find((o) => o.optionKey === key);
    return {
      id: existing?.id || 0,
      optionKey: key,
      content: existing?.content || '',
      isCorrect: correctKeys.includes(key)
    };
  });
};

const QuestionFormPage: React.FC = () => {
  const id = Number(Taro.getCurrentInstance().router?.params?.id);
  const isEdit = !!id;
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState<Question>({
    id: 0,
    subjectId: 0,
    subjectName: '',
    type: 'SINGLE_CHOICE',
    content: '',
    answer: '',
    analysis: '',
    score: 5,
    difficulty: 3,
    source: '',
    options: defaultOptions()
  });

  useEffect(() => {
    getSubjects().then(setSubjects);
    if (isEdit) {
      getQuestionDetail(id).then((q) => {
        const nextOptions = isChoice(q.type)
          ? buildOptionsFromAnswer(q.type, q.answer, q.options)
          : [];
        setForm({
          ...q,
          options: nextOptions
        });
      });
    }
  }, []);

  const updateField = <K extends keyof Question>(key: K, value: Question[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value } as Question;
      if (key === 'type') {
        const nextType = value as string;
        if (isChoice(nextType)) {
          next.options = buildOptionsFromAnswer(nextType, prev.answer, prev.options);
        } else {
          next.options = [];
        }
      }
      return next;
    });
  };

  const updateOptionContent = (key: string, content: string) => {
    setForm((prev) => {
      const options = (prev.options || []).map((o) =>
        o.optionKey === key ? { ...o, content } : o
      );
      return { ...prev, options };
    });
  };

  const toggleSingleAnswer = (key: string) => {
    setForm((prev) => {
      const options = (prev.options || []).map((o) => ({
        ...o,
        isCorrect: o.optionKey === key
      }));
      return { ...prev, answer: key, options };
    });
  };

  const toggleMultipleAnswer = (key: string) => {
    setForm((prev) => {
      const options = (prev.options || []).map((o) =>
        o.optionKey === key ? { ...o, isCorrect: !o.isCorrect } : o
      );
      const answer = options
        .filter((o) => o.isCorrect)
        .map((o) => o.optionKey)
        .join(',');
      return { ...prev, answer, options };
    });
  };

  const submit = async () => {
    if (!form.subjectId) {
      Taro.showToast({ title: '请选择学科', icon: 'none' });
      return;
    }
    if (!form.content.trim()) {
      Taro.showToast({ title: '请输入题干', icon: 'none' });
      return;
    }
    if (isChoice(form.type) && !form.answer.trim()) {
      Taro.showToast({ title: '请选择正确答案', icon: 'none' });
      return;
    }
    if (!isChoice(form.type) && !form.answer.trim()) {
      Taro.showToast({ title: '请输入正确答案', icon: 'none' });
      return;
    }

    try {
      const payload = {
        ...form,
        options: isChoice(form.type) ? form.options : []
      };
      if (isEdit) {
        await updateQuestion(id, payload);
        Taro.showToast({ title: '更新成功', icon: 'success' });
      } else {
        await createQuestion(payload);
        Taro.showToast({ title: '创建成功', icon: 'success' });
      }
      setTimeout(() => Taro.navigateBack(), 1000);
    } catch (e) {
      Taro.showToast({ title: '保存失败', icon: 'none' });
    }
  };

  return (
    <View className={styles.page}>
      <Text className={styles.title}>{isEdit ? '编辑题目' : '新增题目'}</Text>

      <View className={styles.field}>
        <Text className={styles.label}>学科</Text>
        <Picker
          mode="selector"
          range={subjects.map((s) => s.name)}
          value={subjects.findIndex((s) => s.id === form.subjectId)}
          onChange={(e) =>
            updateField('subjectId', subjects[Number(e.detail.value)]?.id || 0)
          }
        >
          <View className={styles.picker}>
            <Text>
              {subjects.find((s) => s.id === form.subjectId)?.name || '请选择学科'}
            </Text>
          </View>
        </Picker>
      </View>

      <View className={styles.field}>
        <Text className={styles.label}>题型</Text>
        <Picker
          mode="selector"
          range={typeOptions.map((t) => t.label)}
          value={typeOptions.findIndex((t) => t.value === form.type)}
          onChange={(e) =>
            updateField(
              'type',
              typeOptions[Number(e.detail.value)].value as Question['type']
            )
          }
        >
          <View className={styles.picker}>
            <Text>
              {typeOptions.find((t) => t.value === form.type)?.label || '请选择题型'}
            </Text>
          </View>
        </Picker>
      </View>

      <View className={styles.field}>
        <Text className={styles.label}>题干</Text>
        <Textarea
          className={styles.textarea}
          value={form.content}
          onInput={(e) => updateField('content', e.detail.value)}
          placeholder="请输入题目内容"
        />
      </View>

      {isChoice(form.type) && (
        <View className={styles.field}>
          <Text className={styles.label}>正确答案</Text>
          <View className={styles.answerGroup}>
            {OPTION_KEYS.map((key) => {
              const checked =
                form.type === 'SINGLE_CHOICE'
                  ? form.answer === key
                  : form.answer.split(/[,，]/).includes(key);
              return (
                <View
                  key={key}
                  className={`${styles.answerItem} ${checked ? styles.answerChecked : ''}`}
                  onClick={() =>
                    form.type === 'SINGLE_CHOICE'
                      ? toggleSingleAnswer(key)
                      : toggleMultipleAnswer(key)
                  }
                >
                  <View className={styles.selectorBox}>
                    <View
                      className={
                        form.type === 'SINGLE_CHOICE'
                          ? styles.radioInner
                          : styles.checkboxInner
                      }
                      style={{ opacity: checked ? 1 : 0 }}
                    />
                  </View>
                  <Text className={styles.answerKey}>{key}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {!isChoice(form.type) && (
        <View className={styles.field}>
          <Text className={styles.label}>正确答案</Text>
          <Input
            className={styles.input}
            value={form.answer}
            onInput={(e) => updateField('answer', e.detail.value)}
            placeholder="请输入正确答案"
          />
        </View>
      )}

      <View className={styles.field}>
        <Text className={styles.label}>解析</Text>
        <Textarea
          className={styles.textarea}
          value={form.analysis}
          onInput={(e) => updateField('analysis', e.detail.value)}
          placeholder="请输入答案解析"
        />
      </View>

      <View className={styles.field}>
        <Text className={styles.label}>分值</Text>
        <Input
          className={styles.input}
          type="number"
          value={String(form.score)}
          onInput={(e) => updateField('score', Number(e.detail.value))}
          placeholder="请输入分值"
        />
      </View>

      {isChoice(form.type) && (
        <View className={styles.field}>
          <Text className={styles.label}>选项内容</Text>
          {form.options?.map((opt) => (
            <View key={opt.optionKey} className={styles.optionRow}>
              <Text className={styles.fixedKey}>{opt.optionKey}</Text>
              <Input
                className={styles.optionContent}
                value={opt.content}
                onInput={(e) =>
                  updateOptionContent(opt.optionKey, e.detail.value)
                }
                placeholder={`请输入选项 ${opt.optionKey} 内容`}
              />
            </View>
          ))}
        </View>
      )}

      <View className={styles.submitButton} onClick={submit}>
        <Text className={styles.submitText}>保存</Text>
      </View>
    </View>
  );
};

export default QuestionFormPage;
