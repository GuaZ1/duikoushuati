import React, { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import { getKnowledgePoints } from '@/services/api';
import { KnowledgePoint } from '@/types';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

interface KnowledgePointDialogProps {
  visible: boolean;
  subjectId: number;
  subjectName: string;
  onCancel: () => void;
  // 点击某个知识点章节：当前阶段只做展示，刷题行为后续再定
  onSelect?: (point: KnowledgePoint) => void;
}

// 章节练习模式：点开学科后弹出本弹窗，按 subjectId 查询知识点（章节）列表并展示。
const KnowledgePointDialog: React.FC<KnowledgePointDialogProps> = ({
  visible,
  subjectId,
  subjectName,
  onCancel,
  onSelect
}) => {
  const [points, setPoints] = useState<KnowledgePoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    getKnowledgePoints(subjectId)
      .then((list) => {
        if (!cancelled) setPoints(list);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          console.log('[KnowledgePointDialog] 拉取知识点失败:', e.message);
          setPoints([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, subjectId]);

  if (!visible) return null;

  return (
    <View className={styles.overlay} onClick={onCancel}>
      <View className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <Text className={styles.title}>{subjectName} · 选择章节</Text>

        {loading ? (
          <View className={styles.loading}>
            <Text className={styles.loadingText}>加载中…</Text>
          </View>
        ) : points.length === 0 ? (
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
