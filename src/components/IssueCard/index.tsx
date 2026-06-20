import React from 'react';
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

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.left}>
          <View className={styles.typeTag}>{IssueTypeText[issue.type]}</View>
          <Text className={styles.axis}>{issue.axisPosition}</Text>
        </View>
        <StatusTag status={issue.status} size="sm" />
      </View>

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
          <Text className={styles.category}>{IssueCategoryText[issue.category]}</Text>
          <Text className={styles.description}>{issue.description}</Text>

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
        <Text className={styles.projectName}>{issue.projectName}</Text>
        <Text className={styles.time}>{issue.createTime}</Text>
      </View>
    </View>
  );
};

export default IssueCard;
