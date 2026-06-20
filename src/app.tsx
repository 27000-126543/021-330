import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useAppStore } from './store/issueStore';
import './app.scss';

function App(props) {
  const initData = useAppStore(state => state.initData);

  useEffect(() => {
    initData();
    console.log('[App] data initialized');
  }, [initData]);

  useDidShow(() => {
    console.log('[App] onShow');
  });

  useDidHide(() => {
    console.log('[App] onHide');
  });

  return props.children;
}

export default App;
