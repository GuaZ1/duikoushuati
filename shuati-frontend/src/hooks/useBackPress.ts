import { useEffect, useRef } from 'react';
import Taro from '@tarojs/taro';

/**
 * 微信小程序安卓物理返回键拦截。
 * 页面内有弹窗（如选择刷题模式、答题卡、知识点选择）打开时，
 * 按返回键优先关闭弹窗，而不是退出小程序/返回上一页。
 *
 * 用法：
 *   useBackPress(() => {
 *     if (有弹窗打开) { 关闭弹窗(); return true; }
 *     return false; // 无弹窗，走默认返回
 *   });
 *
 * 说明：
 *   Taro 4.1.9 未暴露 onBackPress 生命周期，这里直接往原生页面实例上挂 onBackPress。
 *   onBackPress 返回 true 时阻止默认返回行为（返回上一页/退出小程序）。
 */
export function useBackPress(handler: () => boolean) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    // 仅在微信小程序端生效；H5 无物理返回键
    if (process.env.TARO_ENV !== 'weapp') return;

    const page = Taro.getCurrentInstance().page as any;
    if (!page) return;

    const original = page.onBackPress;
    page.onBackPress = () => {
      if (handlerRef.current()) {
        // 已拦截：返回 true 阻止默认返回
        return true;
      }
      if (typeof original === 'function') return original();
      return false;
    };

    return () => {
      page.onBackPress = original;
    };
  }, []);
}
