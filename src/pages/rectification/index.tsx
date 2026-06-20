import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/issueStore';
import { IssueStatus, IssueCategory, IssueCategoryText } from '@/types';
import IssueCard from '@/components/IssueCard';
import EmptyState from '@/components/EmptyState';

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待整改' },
  { key: 'processing', label: '整改中' },
  { key: 'rejected', label: '已退回' },
  { key: 'design', label: '设计确认' },
  { key: 'done', label: '已通过' }
];

const categoryOptions: { key: IssueCategory | 'all'; label: string }[] = [
  { key: 'all', label: '全部类别' },
  { key: 'deviation', label: IssueCategoryText.deviation },
  { key: 'close_beam', label: IssueCategoryText.close_beam },
  { key: 'insufficient_space', label: IssueCategoryText.insufficient_space },
  { key: 'elevation', label: IssueCategoryText.elevation },
  { key: 'other', label: IssueCategoryText.other }
];

const timeFilterOptions = [
  { key: 'all', label: '全部' },
  { key: 'overdue', label: '已逾期' },
  { key: 'today', label: '今日到期' },
  { key: 'week', label: '本周到期' }
];

const sourceOptions = [
  { key: 'all', label: '全部来源' },
  { key: 'manual', label: '现场录入' },
  { key: 'elevation', label: '标高转入' }
];

const isOverdue = (planDeadline?: string, status?: string): boolean => {
  if (!planDeadline) return false;
  if (status === 'done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(planDeadline);
  deadline.setHours(0, 0, 0, 0);
  return deadline < today;
};

const isToday = (planDeadline?: string): boolean => {
  if (!planDeadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(planDeadline);
  deadline.setHours(0, 0, 0, 0);
  return deadline.getTime() === today.getTime();
};

const isThisWeek = (planDeadline?: string): boolean => {
  if (!planDeadline) return false;
  const today = new Date();
  const deadline = new Date(planDeadline);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return deadline >= weekStart && deadline <= weekEnd;
};

const RectificationPage: React.FC = () => {
  const { issues, projects } = useAppStore();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const stats = useMemo(() => {
    return {
      all: issues.length,
      pending: issues.filter(i => i.status === 'pending').length,
      processing: issues.filter(i => i.status === 'processing').length,
      rejected: issues.filter(i => i.status === 'rejected').length,
      design: issues.filter(i => i.status === 'design').length,
      done: issues.filter(i => i.status === 'done').length
    };
  }, [issues]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedProject !== 'all') count++;
    if (selectedCategory !== 'all') count++;
    if (selectedTimeFilter !== 'all') count++;
    if (selectedSource !== 'all') count++;
    return count;
  }, [selectedProject, selectedCategory, selectedTimeFilter, selectedSource]);

  const filteredIssues = useMemo(() => {
    let result = [...issues];

    if (activeTab !== 'all') {
      result = result.filter(i => i.status === activeTab);
    }

    if (selectedProject !== 'all') {
      result = result.filter(i => i.projectId === selectedProject);
    }

    if (selectedCategory !== 'all') {
      result = result.filter(i => i.category === selectedCategory);
    }

    if (selectedSource !== 'all') {
      result = result.filter(i => i.source === selectedSource);
    }

    if (selectedTimeFilter !== 'all') {
      result = result.filter(i => {
        if (selectedTimeFilter === 'overdue') {
          return isOverdue(i.planDeadline, i.status);
        } else if (selectedTimeFilter === 'today') {
          return isToday(i.planDeadline);
        } else if (selectedTimeFilter === 'week') {
          return isThisWeek(i.planDeadline);
        }
        return true;
      });
    }

    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase();
      result = result.filter(i =>
        i.axisPosition.toLowerCase().includes(keyword) ||
        i.description.toLowerCase().includes(keyword) ||
        (i.responsibleTeam && i.responsibleTeam.toLowerCase().includes(keyword))
      );
    }

    return result;
  }, [issues, activeTab, selectedProject, selectedCategory, selectedTimeFilter, selectedSource, searchText]);

  const overdueCount = useMemo(() => {
    return issues.filter(i => isOverdue(i.planDeadline, i.status)).length;
  }, [issues]);

  const handleResetFilters = () => {
    setSelectedProject('all');
    setSelectedCategory('all');
    setSelectedTimeFilter('all');
    setSelectedSource('all');
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
              placeholder="搜索轴线、描述、责任班组"
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
            <Text className={styles.filterLabel}>问题类别</Text>
            <View className={styles.filterGrid}>
              {categoryOptions.map(opt => (
                <View
                  key={opt.key}
                  className={classnames(styles.filterOption, selectedCategory === opt.key && styles.optionActive)}
                  onClick={() => setSelectedCategory(opt.key)}
                >
                  <Text>{opt.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.filterSection}>
            <Text className={styles.filterLabel}>时间筛选</Text>
            <View className={styles.filterGrid}>
              {timeFilterOptions.map(opt => (
                <View
                  key={opt.key}
                  className={classnames(styles.filterOption, selectedTimeFilter === opt.key && styles.optionActive)}
                  onClick={() => setSelectedTimeFilter(opt.key)}
                >
                  <Text>{opt.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.filterSection}>
            <Text className={styles.filterLabel}>问题来源</Text>
            <View className={styles.filterGrid}>
              {sourceOptions.map(opt => (
                <View
                  key={opt.key}
                  className={classnames(styles.filterOption, selectedSource === opt.key && styles.optionActive)}
                  onClick={() => setSelectedSource(opt.key)}
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

      {overdueCount > 0 && activeTab === 'all' && !showFilterPanel && (
        <View className={styles.overdueAlert} onClick={() => { setSelectedTimeFilter('overdue'); setActiveTab('all'); }}>
          <View className={styles.overdueAlertIcon}>⚠️</View>
          <View className={styles.overdueAlertText}>
            <Text className={styles.overdueAlertTitle}>有 {overdueCount} 条问题已逾期</Text>
            <Text className={styles.overdueAlertDesc}>请优先处理超期整改项</Text>
          </View>
          <Text className={styles.overdueAlertArrow}>›</Text>
        </View>
      )}

      {(activeFilterCount > 0 || searchText) && !showFilterPanel && (
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
