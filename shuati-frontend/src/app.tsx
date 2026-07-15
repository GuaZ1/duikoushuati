import React from 'react';
import { useLaunch } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import './app.scss';

const LOGIN_PATH = '/pages/login/index';
const PRIVACY_PATH = '/pages/privacy/index';

function App(props: { children: React.ReactNode }) {
  useLaunch(() => {
    // 微信小程序环境初始化云托管
    if (process.env.TARO_ENV === 'weapp') {
      Taro.cloud.init({
        env: 'prod-d3gi3mvu1d1660fe9',
        traceUser: true,
      });
    }

    const agreed = Taro.getStorageSync('privacyAgreed');
    const token = Taro.getStorageSync('token');

    if (!agreed) {
      Taro.redirectTo({ url: PRIVACY_PATH });
      return;
    }

    if (!token) {
      Taro.redirectTo({ url: LOGIN_PATH });
    }
  });

  return props.children;
}

export default App;
