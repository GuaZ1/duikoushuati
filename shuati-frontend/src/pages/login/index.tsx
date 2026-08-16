import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Button, Input, Image } from '@tarojs/components';
import Taro, { login as wxLogin } from '@tarojs/taro';
import { useUserStore } from '@/store/user';
import { loginByCode, loginByH5, uploadAvatar, uploadAvatarBase64 } from '@/services/api';
import styles from './index.module.scss';

const isWeapp = process.env.TARO_ENV === 'weapp';

const LoginPage: React.FC = () => {
  const { setUser } = useUserStore();
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPath, setAvatarPath] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  // 小程序进入登录页先静默登录：老用户直接换 token 进入首页，仅新用户展示资料表单
  const [checking, setChecking] = useState(isWeapp);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const goHome = (user: Parameters<typeof setUser>[0], token: string) => {
    Taro.setStorageSync('token', token);
    Taro.setStorageSync('user', user);
    setUser(user);
    Taro.switchTab({ url: '/pages/home/index' });
  };

  useEffect(() => {
    if (!isWeapp) return;
    (async () => {
      try {
        const loginRes = await wxLogin();
        if (!loginRes.code) {
          throw new Error('获取微信登录凭证失败');
        }
        const data = await loginByCode(loginRes.code);
        if (data.needRegister) {
          // 全新用户：展示资料表单完成注册
          setChecking(false);
          return;
        }
        goHome(data.user, data.token);
      } catch (e) {
        console.error('[login] silent login error:', e);
        // 静默登录失败时回退到表单，允许用户手动重试
        setChecking(false);
        Taro.showToast({ title: '登录失败，请重试', icon: 'none' });
      }
    })();
  }, []);


  // 微信小程序头像选择
  const handleChooseAvatarWeapp = async (e: {
    detail: { avatarUrl: string };
  }) => {
    const tempPath = e.detail.avatarUrl;
    if (!tempPath) return;
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

  // H5 头像选择（点击触发隐藏的文件输入）
  const handleChooseAvatarH5 = () => {
    fileInputRef.current?.click();
  };

  // H5 文件选择后转 base64 上传
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 显示预览
    const previewUrl = URL.createObjectURL(file);
    setAvatarPath(previewUrl);
    setUploading(true);

    try {
      // 读取文件为 base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // 去掉 data:image/xxx;base64, 前缀
          const pureBase64 = result.split(',')[1];
          resolve(pureBase64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 获取扩展名
      const ext = file.name.split('.').pop() || 'jpg';

      // 调用 base64 上传接口
      const url = await uploadAvatarBase64(base64, ext);
      setAvatarUrl(url);
    } catch (err) {
      console.error('[login] H5 upload avatar error:', err);
      Taro.showToast({ title: '头像上传失败', icon: 'none' });
      setAvatarPath('');
    } finally {
      setUploading(false);
      // 清空 input，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleNicknameChange = (e: { detail: { value: string } }) => {
    setNickname(e.detail.value);
  };

  // H5 昵称实时更新
  const handleNicknameInput = (e: { detail: { value: string } }) => {
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
      if (isWeapp) {
        // 微信小程序：注册需重新获取一次性 code（静默登录已消耗上一个）
        const loginRes = await wxLogin();
        if (!loginRes.code) {
          throw new Error(`获取微信登录凭证失败：${JSON.stringify(loginRes)}`);
        }
        const data = await loginByCode(loginRes.code, nickname.trim(), avatarUrl);
        goHome(data.user, data.token);
      } else {
        // H5：走开发登录接口
        const data = await loginByH5(nickname.trim(), avatarUrl);
        goHome(data.user, data.token);
      }
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
      {/* 顶部视觉区 */}
      <View className={styles.hero}>
        <View className={styles.logo}>
          <Text className={styles.logoIcon}>✏️</Text>
        </View>
        <Text className={styles.title}>guazi对口刷题</Text>
        <Text className={styles.subtitle}>完善资料，开启高效练习</Text>
      </View>

      {checking ? (
        <View className={styles.checking}>
          <Text className={styles.checkingText}>正在登录…</Text>
        </View>
      ) : (
      /* 表单卡片 */
      <View className={styles.formCard}>
        {isWeapp ? (
          <Button
            className={styles.avatarButton}
            openType="chooseAvatar"
            onChooseAvatar={handleChooseAvatarWeapp}
            loading={uploading}
          >
            {avatarPath ? (
              <Image className={styles.avatarPreview} src={avatarPath} mode="aspectFill" />
            ) : (
              <View className={styles.avatarPlaceholder}>
                <Text className={styles.avatarPlaceholderIcon}>👤</Text>
                <Text className={styles.avatarPlaceholderText}>选择头像</Text>
              </View>
            )}
          </Button>
        ) : (
          <Button
            className={styles.avatarButton}
            onClick={handleChooseAvatarH5}
            loading={uploading}
          >
            {avatarPath ? (
              <Image className={styles.avatarPreview} src={avatarPath} mode="aspectFill" />
            ) : (
              <View className={styles.avatarPlaceholder}>
                <Text className={styles.avatarPlaceholderIcon}>👤</Text>
                <Text className={styles.avatarPlaceholderText}>选择头像</Text>
              </View>
            )}
          </Button>
        )}

        <View className={styles.inputWrapper}>
          <Text className={styles.label}>昵称</Text>
          <Input
            className={styles.input}
            type={isWeapp ? 'nickname' : 'text'}
            placeholder="请输入昵称"
            value={nickname}
            onBlur={handleNicknameChange}
            onInput={handleNicknameInput}
          />
        </View>

        {/* H5 隐藏的文件输入框 */}
        {!isWeapp && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        )}

        <Button
          className={styles.loginButton}
          type="primary"
          loading={loading}
          onClick={handleLogin}
        >
          {isWeapp ? '完成注册' : '登录'}
        </Button>
      </View>
      )}
    </View>
  );
};

export default LoginPage;
