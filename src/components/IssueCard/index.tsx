import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import StatusTag from '@/components/StatusTag';
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
          <Image
            className={styles.image}
            src={issue.images[0]}
            mode="aspectFill"
          />
        )}
        <View className={styles.info}>
          <Text className={styles.category}>{IssueCategoryText[issue.category]}</Text>
          <Text className={styles.description}>{issue.description}</Text>

          {issue.designElevation !== undefined && (
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
                <Text className={styles.elevDeviation}>
                  {issue.deviation}mm
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
