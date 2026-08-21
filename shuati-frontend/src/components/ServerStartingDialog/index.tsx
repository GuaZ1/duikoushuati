import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface ServerStartingDialogProps {
  visible: boolean;
  onRestart: () => void;
}

// 云托管最小实例为 0：后端无人访问会自动关闭，再次访问需冷启动，
// 期间初始化请求会长时间挂起，首页据此判定后弹出本提示。
// 弹窗弹出后首页会每 3 秒轮询后端，就绪后自动关闭弹窗并刷新小程序。
const ServerStartingDialog: React.FC<ServerStartingDialogProps> = ({ visible, onRestart }) => {
  if (!visible) return null;

  return (
    <View className={styles.overlay}>
      <View className={styles.dialog}>
        <Text className={styles.title}>服务器启动中</Text>
        <View className={styles.content}>
          <Text className={styles.contentText}>
            因为节省成本的原因，如果没有人访问小程序服务器会自动关闭，现在服务器正在启动中。。
          </Text>
          <Text className={styles.contentText}>
            请等待1分钟左右尝试重新进入小程序。。。
          </Text>
          <Text className={styles.contentText}>感谢！！！刷题愉快~祝你考高分</Text>
        </View>
        <View className={styles.button} onClick={onRestart}>
          <Text className={styles.buttonText}>重新进入小程序</Text>
        </View>
      </View>
    </View>
  );
};

export default ServerStartingDialog;
