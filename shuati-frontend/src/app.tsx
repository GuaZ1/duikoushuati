import React from 'react';
import { useLaunch } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import './app.scss';

const LOGIN_PATH = '/pages/login/index';
const PRIVACY_PATH = '/pages/privacy/index';
const isWeapp = process.env.TARO_ENV === 'weapp';

function App(props: { children: React.ReactNode }) {
  useLaunch(() => {
    // 微信小程序：初始化云托管，并按隐私协议 / 登录态跳转
    if (isWeapp) {
      Taro.cloud.init({
        env: 'prod-d3gi3mvu1d1660fe9',
        traceUser: true,
      });

      const agreed = Taro.getStorageSync('privacyAgreed');
      const token = Taro.getStorageSync('token');
      if (!agreed) {
        Taro.redirectTo({ url: PRIVACY_PATH });
        return;
      }
      if (!token) {
        Taro.redirectTo({ url: LOGIN_PATH });
      }
      return;
    }

    // H5 测试环境：不展示登录页，token 由 api 层在首次请求前静默登录自动获取
  });

  return props.children;
}

export default App;
