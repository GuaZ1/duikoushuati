import React from 'react';
import { View, Text } from '@tarojs/components';
import { KnowledgePoint } from '@/types';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

interface KnowledgePointDialogProps {
  visible: boolean;
  subjectName: string;
  // 由父组件预加载后传入，弹窗打开时直接展示，避免「加载中」过渡帧
  points: KnowledgePoint[];
  onCancel: () => void;
  // 点击某个知识点章节：进入该章节的答题页
  onSelect?: (point: KnowledgePoint) => void;
}

// 章节练习模式：点开学科后弹出本弹窗，展示父组件预加载好的知识点（章节）列表。
const KnowledgePointDialog: React.FC<KnowledgePointDialogProps> = ({
  visible,
  subjectName,
  points,
  onCancel,
  onSelect
}) => {
  if (!visible) return null;

  return (
    <View className={styles.overlay} onClick={onCancel}>
      <View className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <Text className={styles.title}>{subjectName} · 选择章节</Text>

        {points.length === 0 ? (
          <EmptyState title="暂无章节" />
        ) : (
          <View className={styles.list}>
            {points.map((p) => (
              <View
                key={p.id}
                className={styles.item}
                onClick={() => onSelect?.(p)}
              >
                <Text className={styles.itemName}>{p.name}</Text>
                <Text className={styles.itemArrow}>›</Text>
              </View>
            ))}
          </View>
        )}

        <View className={styles.cancel} onClick={onCancel}>
          <Text className={styles.cancelText}>取消</Text>
        </View>
      </View>
    </View>
  );
};

export default KnowledgePointDialog;
