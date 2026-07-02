import Taro from '@tarojs/taro';
import { create } from 'zustand';
import { User } from '@/types';

const storedUser = Taro.getStorageSync<User | null>('user') || null;

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: storedUser,
  setUser: (user) => {
    if (user) {
      Taro.setStorageSync('user', user);
    } else {
      Taro.removeStorageSync('user');
    }
    set({ user });
  },
  logout: () => {
    Taro.removeStorageSync('token');
    Taro.removeStorageSync('user');
    set({ user: null });
  }
}));
