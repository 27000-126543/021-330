import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { IssueStatus, IssueStatusText } from '@/types';

interface StatusTagProps {
  status: IssueStatus;
  size?: 'sm' | 'md';
}

const StatusTag: React.FC<StatusTagProps> = ({ status, size = 'md' }) => {
  return (
    <View className={classnames(styles.tag, styles[`status-${status}`], styles[`size-${size}`])}>
      <Text className={styles.tagText}>{IssueStatusText[status]}</Text>
    </View>
  );
};

export default StatusTag;
