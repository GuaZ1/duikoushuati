import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const PrivacyPage: React.FC = () => {
  const handleAgree = () => {
    Taro.setStorageSync('privacyAgreed', true);
    Taro.redirectTo({ url: '/pages/login/index' });
  };

  const handleRefuse = () => {
    Taro.showModal({
      title: '提示',
      content: '不同意隐私协议将无法使用本小程序。',
      showCancel: false
    });
  };

  return (
    <View className={styles.page}>
      <Text className={styles.title}>隐私协议与用户协议</Text>
      <View className={styles.content}>
        <Text className={styles.text}>
          欢迎使用刷题小助手。本小程序仅收集微信登录标识（openid）用于识别用户身份，
          记录您的答题进度、错题本等学习数据。我们不会将您的个人信息用于第三方营销。
        </Text>
        <Text className={styles.text}>
          点击“同意并继续”即表示您已阅读并同意本协议。
        </Text>
      </View>
      <View className={styles.actions}>
        <Button className={styles.primary} type="primary" onClick={handleAgree}>
          同意并继续
        </Button>
        <Button className={styles.secondary} onClick={handleRefuse}>
          不同意
        </Button>
      </View>
    </View>
  );
};

export default PrivacyPage;
