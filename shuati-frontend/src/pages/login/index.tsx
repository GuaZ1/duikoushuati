import React, { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { login as wxLogin } from '@tarojs/taro';
import { useUserStore } from '@/store/user';
import { loginByCode } from '@/services/api';
import styles from './index.module.scss';

const LoginPage: React.FC = () => {
  const { setUser } = useUserStore();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const loginRes = await wxLogin();
      console.log('[login] wx.login response:', loginRes);
      if (!loginRes.code) {
        throw new Error(`获取微信登录凭证失败：${JSON.stringify(loginRes)}`);
      }
      const data = await loginByCode(loginRes.code);
      Taro.setStorageSync('token', data.token);
      Taro.setStorageSync('user', data.user);
      setUser(data.user);
      Taro.switchTab({ url: '/pages/home/index' });
    } catch (e) {
      console.error('[login] error:', e);
      const message = e instanceof Error ? e.message : JSON.stringify(e);
      Taro.showToast({
        title: message.length > 30 ? '登录失败，请查看控制台' : message,
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.logo}>
        <Text className={styles.logoText}>刷</Text>
      </View>
      <Text className={styles.title}>刷题小助手</Text>
      <Text className={styles.subtitle}>微信一键登录，开启高效练习</Text>
      <Button
        className={styles.loginButton}
        type="primary"
        loading={loading}
        onClick={handleLogin}
      >
        微信一键登录
      </Button>
    </View>
  );
};

export default LoginPage;
