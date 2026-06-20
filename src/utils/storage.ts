import Taro from '@tarojs/taro';

const STORAGE_KEY_PREFIX = 'mep_inspector_';

export const storage = {
  set(key: string, value: any): Promise<void> {
    return Taro.setStorage({
      key: STORAGE_KEY_PREFIX + key,
      data: value
    });
  },

  get<T = any>(key: string, defaultValue?: T): Promise<T | undefined> {
    return Taro.getStorage({
      key: STORAGE_KEY_PREFIX + key
    })
      .then(res => res.data as T)
      .catch(() => defaultValue);
  },

  remove(key: string): Promise<void> {
    return Taro.removeStorage({
      key: STORAGE_KEY_PREFIX + key
    });
  },

  clear(): Promise<void> {
    return Taro.clearStorage();
  },

  setSync(key: string, value: any): void {
    try {
      Taro.setStorageSync(STORAGE_KEY_PREFIX + key, value);
    } catch (e) {
      console.error('[Storage] setSync error:', e);
    }
  },

  getSync<T = any>(key: string, defaultValue?: T): T | undefined {
    try {
      const value = Taro.getStorageSync(STORAGE_KEY_PREFIX + key);
      return value === '' ? defaultValue : value as T;
    } catch (e) {
      console.error('[Storage] getSync error:', e);
      return defaultValue;
    }
  }
};
