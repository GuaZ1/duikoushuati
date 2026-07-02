import React from 'react';
import { CoverView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useUserStore } from '@/store/user';
import styles from './index.module.scss';

interface TabItem {
  pagePath: string;
  text: string;
}

const allTabs: TabItem[] = [
  { pagePath: 'pages/home/index', text: '首页' },
  { pagePath: 'pages/teacher/question/index', text: '教师' },
  { pagePath: 'pages/mine/index', text: '我的' }
];

const CustomTabBar: React.FC = () => {
  const { user } = useUserStore();
  const router = useRouter();

  const tabs = user?.role === 'TEACHER'
    ? allTabs
    : allTabs.filter(t => t.pagePath !== 'pages/teacher/question/index');

  const activePath = router?.path || '';

  const switchTab = (path: string) => {
    Taro.switchTab({ url: `/${path}` });
  };

  return (
    <CoverView className={styles.tabBar}>
      {tabs.map(item => {
        const active = activePath === item.pagePath;
        return (
          <CoverView
            key={item.pagePath}
            className={`${styles.tabItem} ${active ? styles.active : ''}`}
            onClick={() => switchTab(item.pagePath)}
          >
            <CoverView className={styles.text}>{item.text}</CoverView>
          </CoverView>
        );
      })}
    </CoverView>
  );
};

export default CustomTabBar;
