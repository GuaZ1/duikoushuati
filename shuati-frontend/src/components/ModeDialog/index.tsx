import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface ModeDialogProps {
  visible: boolean;
  onSelect: (mode: 'practice' | 'exam') => void;
  onCancel: () => void;
}

const ModeDialog: React.FC<ModeDialogProps> = ({ visible, onSelect, onCancel }) => {
  if (!visible) return null;

  return (
    <View className={styles.overlay} onClick={onCancel}>
      <View className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <Text className={styles.title}>选择刷题模式</Text>
        <View className={styles.modeCard} onClick={() => onSelect('exam')}>
          <View className={styles.modeNameRow}>
            <Text className={styles.modeName}>考试模式</Text>
            <Text className={styles.modeTag}>（推荐）</Text>
          </View>
          <Text className={styles.modeDesc}>随机 10 题，计时作答，答完看报告</Text>
        </View>
        <View className={styles.modeCard} onClick={() => onSelect('practice')}>
          <Text className={styles.modeName}>练习模式</Text>
          <Text className={styles.modeDesc}>随机乱序，逐题看解析，答完看正确率</Text>
        </View>
        <View className={styles.cancel} onClick={onCancel}>
          <Text className={styles.cancelText}>取消</Text>
        </View>
      </View>
    </View>
  );
};

export default ModeDialog;
