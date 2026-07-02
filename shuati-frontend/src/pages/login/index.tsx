import React, { useState } from 'react';
import { View, Text, Button, Input, Image } from '@tarojs/components';
import Taro, { login as wxLogin } from '@tarojs/taro';
import { useUserStore } from '@/store/user';
import { loginByCode, uploadAvatar } from '@/services/api';
import styles from './index.module.scss';

const LoginPage: React.FC = () => {
  const { setUser } = useUserStore();
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPath, setAvatarPath] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChooseAvatar = async (e: {
    detail: { avatarUrl: string };
  }) => {
    const tempPath = e.detail.avatarUrl;
    if (!tempPath) {
      return;
    }
    setAvatarPath(tempPath);
    setUploading(true);
    try {
      const url = await uploadAvatar(tempPath);
      setAvatarUrl(url);
    } catch (err) {
      console.error('[login] upload avatar error:', err);
      Taro.showToast({ title: '头像上传失败', icon: 'none' });
      setAvatarPath('');
    } finally {
      setUploading(false);
    }
  };

  const handleNicknameChange = (e: { detail: { value: string } }) => {
    setNickname(e.detail.value);
  };

  const handleLogin = async () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (!avatarUrl) {
      Taro.showToast({ title: '请选择头像', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      const loginRes = await wxLogin();
      console.log('[login] wx.login response:', loginRes);
      if (!loginRes.code) {
        throw new Error(`获取微信登录凭证失败：${JSON.stringify(loginRes)}`);
      }
      const data = await loginByCode(loginRes.code, nickname.trim(), avatarUrl);
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
      <Text className={styles.subtitle}>完善资料，开启高效练习</Text>

      <View className={styles.form}>
        <Button
          className={styles.avatarButton}
          openType="chooseAvatar"
          onChooseAvatar={handleChooseAvatar}
          loading={uploading}
        >
          {avatarPath ? (
            <Image className={styles.avatarPreview} src={avatarPath} mode="aspectFill" />
          ) : (
            <Text className={styles.avatarPlaceholder}>点击选择头像</Text>
          )}
        </Button>

        <View className={styles.inputWrapper}>
          <Text className={styles.label}>昵称</Text>
          <Input
            className={styles.input}
            type="nickname"
            placeholder="请输入昵称"
            value={nickname}
            onBlur={handleNicknameChange}
          />
        </View>

        <Button
          className={styles.loginButton}
          type="primary"
          loading={loading}
          onClick={handleLogin}
        >
          微信一键登录
        </Button>
      </View>
    </View>
  );
};

export default LoginPage;
