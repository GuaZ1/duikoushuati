import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface AnswerCardDialogProps {
  visible: boolean;
  total: number;
  currentIndex: number;
  // 与题目等长的数组：已答位置非 null，未答为 null（具体类型由调用方决定）
  answered: unknown[];
  onJump: (index: number) => void;
  onCancel: () => void;
}

// 答题卡弹窗：题号网格，点击题号跳转。
// 三种状态：当前题（高亮）、已答（实色填充）、未答（描边）。
// 仅自由练习 / 章节练习模式使用，考试模式不提供。
const AnswerCardDialog: React.FC<AnswerCardDialogProps> = ({
  visible,
  total,
  currentIndex,
  answered,
  onJump,
  onCancel
}) => {
  if (!visible) return null;

  const handleJump = (index: number) => {
    onJump(index);
    onCancel();
  };

  return (
    <View className={styles.overlay} onClick={onCancel}>
      <View className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <Text className={styles.title}>答题卡</Text>

        <View className={styles.legend}>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.dotCurrent)} />
            <Text className={styles.legendText}>当前题</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.dotAnswered)} />
            <Text className={styles.legendText}>已答</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.dotUnanswered)} />
            <Text className={styles.legendText}>未答</Text>
          </View>
        </View>

        <View className={styles.grid}>
          {Array.from({ length: total }).map((_, i) => {
            const isCurrent = i === currentIndex;
            const isAnswered = Boolean(answered[i]);
            return (
              <View
                key={i}
                className={classnames(
                  styles.cell,
                  isCurrent && styles.cellCurrent,
                  !isCurrent && isAnswered && styles.cellAnswered,
                  !isCurrent && !isAnswered && styles.cellUnanswered
                )}
                onClick={() => handleJump(i)}
              >
                <Text
                  className={classnames(
                    styles.cellText,
                    isCurrent && styles.cellTextCurrent,
                    !isCurrent && isAnswered && styles.cellTextAnswered,
                    !isCurrent && !isAnswered && styles.cellTextUnanswered
                  )}
                >
                  {i + 1}
                </Text>
              </View>
            );
          })}
        </View>

        <View className={styles.cancel} onClick={onCancel}>
          <Text className={styles.cancelText}>关闭</Text>
        </View>
      </View>
    </View>
  );
};

export default AnswerCardDialog;
