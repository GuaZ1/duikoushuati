import React, { useState } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { submitQuestionFeedback } from '@/services/api';
import styles from './index.module.scss';

interface FeedbackDialogProps {
  visible: boolean;
  questionId: number;
  onCancel: () => void;
}

const MAX_LEN = 500;

// 做题时点击「题目有问题？点击反馈」弹出，学生输入文字反馈后写入 question_feedback 表。
// 后端校验：questionId 必填、content 非空且 ≤500 字。
const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ visible, questionId, onCancel }) => {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!visible) return null;

  const handleSubmit = async () => {
    const text = content.trim();
    if (!text) {
      Taro.showToast({ title: '请输入反馈内容', icon: 'none' });
      return;
    }
    setSubmitting(true);
    try {
      await submitQuestionFeedback(questionId, text);
      Taro.showToast({ title: '反馈已提交，感谢！', icon: 'success' });
      setContent('');
      onCancel();
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '提交失败', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (submitting) return;
    setContent('');
    onCancel();
  };

  return (
    <View className={styles.overlay} onClick={handleCancel}>
      <View className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <Text className={styles.title}>题目反馈</Text>
        <Text className={styles.subtitle}>
          发现题目有问题？请描述具体问题。
        </Text>
        <Textarea
          className={styles.textarea}
          value={content}
          onInput={(e) => setContent(e.detail.value.slice(0, MAX_LEN))}
          placeholder="例如：答案错误、题干有错别字、解析有误……"
          maxlength={MAX_LEN}
          disabled={submitting}
        />
        <View className={styles.counterRow}>
          <Text className={styles.counter}>{content.length}/{MAX_LEN}</Text>
        </View>
        <View className={styles.buttonRow}>
          <View className={styles.cancelButton} onClick={handleCancel}>
            <Text className={styles.cancelText}>取消</Text>
          </View>
          <View
            className={submitting ? styles.submitButtonDisabled : styles.submitButton}
            onClick={submitting ? undefined : handleSubmit}
          >
            <Text className={styles.submitText}>{submitting ? '提交中…' : '提交'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default FeedbackDialog;
