import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/issueStore';
import { IssueStatus, IssueType, IssueTypeText } from '@/types';
import IssueCard from '@/components/IssueCard';
import EmptyState from '@/components/EmptyState';

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待整改' },
  { key: 'processing', label: '整改中' },
  { key: 'done', label: '已通过' },
  { key: 'rejected', label: '已退回' }
];

const typeOptions: { key: IssueType | 'all'; label: string }[] = [
  { key: 'all', label: '全部类型' },
  { key: 'duct', label: IssueTypeText.duct },
  { key: 'bridge', label: IssueTypeText.bridge },
  { key: 'sprinkler', label: IssueTypeText.sprinkler },
  { key: 'cable', label: IssueTypeText.cable }
];

const deviationOptions = [
  { key: 'all', label: '全部' },
  { key: 'unqualified', label: '超标不合格' },
  { key: 'qualified', label: '合格' }
];

const RectificationPage: React.FC = () => {
  const { issues, projects } = useAppStore();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDeviation, setSelectedDeviation] = useState<string>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedProject !== 'all') count++;
    if (selectedType !== 'all') count++;
    if (selectedDeviation !== 'all') count++;
    return count;
  }, [selectedProject, selectedType, selectedDeviation]);

  const filteredIssues = useMemo(() => {
    let result = [...issues];

    if (activeTab !== 'all') {
      result = result.filter(i => i.status === activeTab);
    }

    if (selectedProject !== 'all') {
      result = result.filter(i => i.projectId === selectedProject);
    }

    if (selectedType !== 'all') {
      result = result.filter(i => i.type === selectedType);
    }

    if (selectedDeviation !== 'all') {
      if (selectedDeviation === 'unqualified') {
        result = result.filter(i => i.isQualified === false);
      } else if (selectedDeviation === 'qualified') {
        result = result.filter(i => i.isQualified === true);
      }
    }

    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase();
      result = result.filter(i =>
        i.axisPosition.toLowerCase().includes(keyword) ||
        i.description.toLowerCase().includes(keyword)
      );
    }

    return result;
  }, [issues, activeTab, selectedProject, selectedType, selectedDeviation, searchText]);

  const handleResetFilters = () => {
    setSelectedProject('all');
    setSelectedType('all');
    setSelectedDeviation('all');
    setSearchText('');
    setShowFilterPanel(false);
    Taro.showToast({ title: '已重置筛选', icon: 'none' });
  };

  const handleApplyFilters = () => {
    setShowFilterPanel(false);
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.tabsContainer}>
        <View className={styles.searchRow}>
          <View className={styles.searchBox}>
            <Text className={styles.searchIcon}>🔍</Text>
            <Input
              className={styles.searchInput}
              placeholder="搜索轴线位置或问题描述"
              value={searchText}
              onInput={(e) => setSearchText(e.detail.value)}
              confirmType="search"
            />
            {searchText && (
              <Text className={styles.searchClear} onClick={() => setSearchText('')}>✕</Text>
            )}
          </View>
          <View
            className={classnames(styles.filterBtn, activeFilterCount > 0 && styles.filterActive)}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Text>筛选</Text>
            {activeFilterCount > 0 && (
              <View className={styles.filterBadge}>
                <Text className={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </View>
        </View>

        <View className={styles.tabs}>
          {statusTabs.map(tab => (
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

      {showFilterPanel && (
        <View className={styles.filterPanel}>
          <View className={styles.filterSection}>
            <Text className={styles.filterLabel}>项目</Text>
            <ScrollView scrollX className={styles.filterOptions}>
              <View
                className={classnames(styles.filterOption, selectedProject === 'all' && styles.optionActive)}
                onClick={() => setSelectedProject('all')}
              >
                <Text>全部项目</Text>
              </View>
              {projects.map(p => (
                <View
                  key={p.id}
                  className={classnames(styles.filterOption, selectedProject === p.id && styles.optionActive)}
                  onClick={() => setSelectedProject(p.id)}
                >
                  <Text>{p.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View className={styles.filterSection}>
            <Text className={styles.filterLabel}>问题类型</Text>
            <View className={styles.filterGrid}>
              {typeOptions.map(opt => (
                <View
                  key={opt.key}
                  className={classnames(styles.filterOption, selectedType === opt.key && styles.optionActive)}
                  onClick={() => setSelectedType(opt.key)}
                >
                  <Text>{opt.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.filterSection}>
            <Text className={styles.filterLabel}>标高偏差</Text>
            <View className={styles.filterGrid}>
              {deviationOptions.map(opt => (
                <View
                  key={opt.key}
                  className={classnames(styles.filterOption, selectedDeviation === opt.key && styles.optionActive)}
                  onClick={() => setSelectedDeviation(opt.key)}
                >
                  <Text>{opt.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.filterActions}>
            <View className={styles.resetBtn} onClick={handleResetFilters}>
              <Text>重置</Text>
            </View>
            <View className={styles.applyBtn} onClick={handleApplyFilters}>
              <Text>确定 ({filteredIssues.length}条)</Text>
            </View>
          </View>
        </View>
      )}

      {activeFilterCount > 0 && !showFilterPanel && (
        <View className={styles.activeFiltersBar}>
          <Text className={styles.filterResultText}>
            共找到 {filteredIssues.length} 条结果
          </Text>
          <Text className={styles.clearAllText} onClick={handleResetFilters}>清除筛选</Text>
        </View>
      )}

      <ScrollView scrollY className={styles.listContainer}>
        <View className={styles.listContent}>
          {filteredIssues.length === 0 ? (
            <EmptyState
              icon="📋"
              title="暂无相关问题"
              description={searchText ? '没有找到匹配的问题，请换个关键词试试' : '还没有符合条件的问题'}
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
