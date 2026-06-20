import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import StatusTag from '@/components/StatusTag';
import MarkedImageView from '@/components/MarkedImageView';
import { Issue, IssueTypeText, IssueCategoryText } from '@/types';

interface IssueCardProps {
  issue: Issue;
  onClick?: () => void;
}

const isOverdue = (planDeadline?: string, status?: string): boolean => {
  if (!planDeadline) return false;
  if (status === 'done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(planDeadline);
  deadline.setHours(0, 0, 0, 0);
  return deadline < today;
};

const getDaysRemaining = (planDeadline?: string): number => {
  if (!planDeadline) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(planDeadline);
  deadline.setHours(0, 0, 0, 0);
  const diffTime = deadline.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const IssueCard: React.FC<IssueCardProps> = ({ issue, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/issue-detail/index?id=${issue.id}`
      });
    }
  };

  const firstImageMarks = issue.marks && issue.marks.length > 0 ? issue.marks[0] : [];
  const totalMarkCount = issue.marks ? issue.marks.flat().length : 0;

  const hasElevationData = issue.designElevation !== undefined &&
                          issue.measuredElevation !== undefined &&
                          issue.allowableDeviation !== undefined;

  const overdue = useMemo(() => isOverdue(issue.planDeadline, issue.status), [issue.planDeadline, issue.status]);
  const daysRemaining = useMemo(() => getDaysRemaining(issue.planDeadline), [issue.planDeadline]);
  const isFromElevation = issue.source === 'elevation';

  return (
    <View className={classnames(styles.card, overdue && styles.overdue)} onClick={handleClick}>
      {overdue && (
        <View className={styles.overdueBadge}>
          <Text className={styles.overdueText}>逾期 {Math.abs(daysRemaining)} 天</Text>
        </View>
      )}

      <View className={styles.header}>
        <View className={styles.left}>
          <View className={styles.typeTag}>{IssueTypeText[issue.type]}</View>
          <View className={styles.categoryTag}>{IssueCategoryText[issue.category]}</View>
          {isFromElevation && (
            <View className={styles.sourceTag}>
              <Text className={styles.sourceTagText}>标高转入</Text>
            </View>
          )}
        </View>
        <StatusTag status={issue.status} size="sm" />
      </View>

      <Text className={styles.axis}>{issue.axisPosition}</Text>

      <View className={styles.content}>
        {issue.images.length > 0 && (
          <View className={styles.imageWrapper}>
            <MarkedImageView
              imageUrl={issue.images[0]}
              marks={firstImageMarks}
              width={180}
              height={180}
              mode="aspectFill"
            />
            {totalMarkCount > 0 && (
              <View className={styles.markIndicator}>
                <Text className={styles.markIndicatorText}>{totalMarkCount}</Text>
              </View>
            )}
          </View>
        )}
        <View className={styles.info}>
          <Text className={styles.description} numberOfLines={2}>{issue.description}</Text>

          {hasElevationData && (
            <View className={styles.elevationRow}>
              <View className={styles.elevationItem}>
                <Text className={styles.elevLabel}>设计</Text>
                <Text className={styles.elevValue}>{issue.designElevation}m</Text>
              </View>
              <View className={styles.elevationItem}>
                <Text className={styles.elevLabel}>实测</Text>
                <Text className={styles.elevValue}>{issue.measuredElevation}m</Text>
              </View>
              <View className={styles.elevationItem}>
                <Text className={styles.elevLabel}>偏差</Text>
                <Text className={classnames(styles.elevDeviation, issue.isQualified && styles.elevPass)}>
                  {issue.deviation}mm
                </Text>
              </View>
              <View className={styles.elevationItem}>
                <Text className={styles.elevLabel}>状态</Text>
                <Text className={classnames(styles.elevStatus, issue.isQualified ? styles.statusPass : styles.statusFail)}>
                  {issue.isQualified ? '合格' : '不合格'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View className={styles.footer}>
        <View className={styles.footerLeft}>
          <Text className={styles.teamText}>
            <Text style={{ color: '#86909c' }}>责任：</Text>
            {issue.responsibleTeam || '未分配'}
          </Text>
        </View>
        <View className={styles.footerRight}>
          {issue.planDeadline && (
            <Text className={classnames(styles.deadlineText, overdue && styles.deadlineOverdue)}>
              {overdue ? '已逾期' : `计划 ${issue.planDeadline.slice(5)}`}
            </Text>
          )}
        </View>
      </View>

      <View className={styles.footerSecondary}>
        <Text className={styles.projectName}>{issue.projectName}</Text>
        <Text className={styles.time}>{issue.createTime}</Text>
      </View>
    </View>
  );
};

export default IssueCard;
