import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/issueStore';
import { IssueStatus } from '@/types';
import IssueCard from '@/components/IssueCard';
import EmptyState from '@/components/EmptyState';

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待整改' },
  { key: 'processing', label: '整改中' },
  { key: 'done', label: '已通过' },
  { key: 'rejected', label: '已退回' }
];

const RectificationPage: React.FC = () => {
  const { issues } = useAppStore();
  const [activeTab, setActiveTab] = useState<string>('all');

  const stats = useMemo(() => {
    return {
      all: issues.length,
      pending: issues.filter(i => i.status === 'pending').length,
      processing: issues.filter(i => i.status === 'processing').length,
      done: issues.filter(i => i.status === 'done').length,
      rejected: issues.filter(i => i.status === 'rejected').length,
      design: issues.filter(i => i.status === 'design').length
    };
  }, [issues]);

  const filteredIssues = useMemo(() => {
    if (activeTab === 'all') return issues;
    return issues.filter(i => i.status === activeTab);
  }, [issues, activeTab]);

  return (
    <View className={styles.pageContainer}>
      <View className={styles.tabsContainer}>
        <View className={styles.tabs}>
          {tabs.map(tab => (
            <View
              key={tab.key}
              className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text className={styles.tabText}>{tab.label}</Text>
              <Text className={styles.tabCount}>
                {tab.key === 'all' ? stats.all : stats[tab.key as IssueStatus] || 0}
              </Text>
              {activeTab === tab.key && <View className={styles.tabIndicator} />}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <Text className={classnames(styles.statNum, styles.pending)}>{stats.pending}</Text>
          <Text className={styles.statLabel}>待整改</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={classnames(styles.statNum, styles.processing)}>{stats.processing}</Text>
          <Text className={styles.statLabel}>整改中</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={classnames(styles.statNum, styles.done)}>{stats.done}</Text>
          <Text className={styles.statLabel}>已通过</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={classnames(styles.statNum, styles.rejected)}>{stats.rejected}</Text>
          <Text className={styles.statLabel}>已退回</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.listContainer}>
        <View className={styles.listContent}>
          {filteredIssues.length === 0 ? (
            <EmptyState
              icon="📋"
              title="暂无相关问题"
              description={activeTab === 'all' ? '还没有提交任何问题，快去现场拍照记录吧' : '当前状态下没有问题'}
            />
          ) : (
            filteredIssues.map(issue => (
              <IssueCard key={issue.id} issue={issue} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default RectificationPage;
