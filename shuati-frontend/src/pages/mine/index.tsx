import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useUserStore } from '@/store/user';
import {
  BASE_URL,
  getCurrentUser,
  getMyStatistics,
  updateProfile,
  uploadAvatar,
  uploadAvatarBase64
} from '@/services/api';
import { UserStatistics } from '@/types';
import StatCard from '@/components/StatCard';
import styles from './index.module.scss';

const isWeapp = process.env.TARO_ENV === 'weapp';

function toFullUrl(url?: string): string | undefined {
  if (!url) {
    return undefined;
  }
  // data: 已经是完整 base64 头像；http(s): 是历史外链；其余视为后端相对路径
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${BASE_URL}${url}`;
}

const MinePage: React.FC = () => {
  const { user, setUser } = useUserStore();
  const [stats, setStats] = useState<UserStatistics>({ todayCount: 0, totalCount: 0, correctRate: 0 });

  const [editing, setEditing] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editAvatarPath, setEditAvatarPath] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
    getMyStatistics().then(setStats);
  }, []);

  const openEdit = () => {
    setEditNickname(user?.nickname || '');
    setEditAvatarUrl(user?.avatar || '');
    setEditAvatarPath(toFullUrl(user?.avatar) || '');
    setEditing(true);
  };

  // 微信小程序头像选择
  const handleChooseAvatarWeapp = async (e: { detail: { avatarUrl: string } }) => {
    const tempPath = e.detail.avatarUrl;
    if (!tempPath) return;
    setEditAvatarPath(tempPath);
    setUploading(true);
    try {
      const url = await uploadAvatar(tempPath);
      setEditAvatarUrl(url);
    } catch (err) {
      console.error('[mine] upload avatar error:', err);
      Taro.showToast({ title: '头像上传失败', icon: 'none' });
      setEditAvatarPath('');
    } finally {
      setUploading(false);
    }
  };

  // H5 头像选择（点击触发隐藏的文件输入）
  const handleChooseAvatarH5 = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setEditAvatarPath(previewUrl);
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const ext = file.name.split('.').pop() || 'jpg';
      const url = await uploadAvatarBase64(base64, ext);
      setEditAvatarUrl(url);
    } catch (err) {
      console.error('[mine] H5 upload avatar error:', err);
      Taro.showToast({ title: '头像上传失败', icon: 'none' });
      setEditAvatarPath('');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!editNickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile(editNickname.trim(), editAvatarUrl);
      setUser(updated);
      setEditing(false);
      Taro.showToast({ title: '保存成功', icon: 'success' });
    } catch (e) {
      console.error('[mine] save profile error:', e);
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.profile}>
        <View className={styles.avatar}>
          {user?.avatar ? (
            <Image className={styles.avatarImage} src={toFullUrl(user.avatar) || ''} mode="aspectFill" />
          ) : (
            <Text className={styles.avatarText}>
              {user?.nickname ? user.nickname[0] : '同'}
            </Text>
          )}
        </View>
        <View className={styles.info}>
          <Text className={styles.name}>{user?.nickname || '同学'}</Text>
          <Text className={styles.meta}>
            {user?.grade} · {user?.school}
          </Text>
        </View>
        <Text className={styles.editEntry} onClick={openEdit}>
          编辑
        </Text>
      </View>

      <View className={styles.stats}>
        <StatCard title="练习次数" value={stats.totalCount} color="primary" />
      </View>

      <View className={styles.menuCard}>
        <View
          className={styles.menuItem}
          onClick={() => Taro.navigateTo({ url: '/pages/wrongbook/index' })}
        >
          <Text className={styles.menuText}>错题本</Text>
          <Text className={styles.arrow}>›</Text>
        </View>
      </View>

      {editing && (
        <View className={styles.mask} onClick={() => setEditing(false)}>
          <View className={styles.editCard} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.editTitle}>编辑资料</Text>

            {isWeapp ? (
              <Button
                className={styles.avatarButton}
                openType="chooseAvatar"
                onChooseAvatar={handleChooseAvatarWeapp}
                loading={uploading}
              >
                {editAvatarPath ? (
                  <Image className={styles.avatarPreview} src={editAvatarPath} mode="aspectFill" />
                ) : (
                  <Text className={styles.avatarPlaceholder}>选择头像</Text>
                )}
              </Button>
            ) : (
              <Button
                className={styles.avatarButton}
                onClick={handleChooseAvatarH5}
                loading={uploading}
              >
                {editAvatarPath ? (
                  <Image className={styles.avatarPreview} src={editAvatarPath} mode="aspectFill" />
                ) : (
                  <Text className={styles.avatarPlaceholder}>选择头像</Text>
                )}
              </Button>
            )}

            <Input
              className={styles.editInput}
              type={isWeapp ? 'nickname' : 'text'}
              placeholder="请输入昵称"
              value={editNickname}
              onInput={(e) => setEditNickname(e.detail.value)}
              onBlur={(e) => setEditNickname(e.detail.value)}
            />

            {!isWeapp && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            )}

            <View className={styles.editActions}>
              <Button className={styles.cancelButton} onClick={() => setEditing(false)}>
                取消
              </Button>
              <Button className={styles.saveButton} type="primary" loading={saving} onClick={handleSave}>
                保存
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default MinePage;
