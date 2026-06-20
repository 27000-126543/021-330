import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/issueStore';
import MarkedImageView from '@/components/MarkedImageView';
import {
  Issue,
  IssueTypeText,
  IssueCategoryText,
  IssueStatusText,
  RectifyMethodText,
  RectifyRecord,
  RectifyMethod,
  IssueMark
} from '@/types';

const IssueDetailPage: React.FC = () => {
  const router = useRouter();
  const { getIssueById, updateIssue, currentUser } = useAppStore();
  const [issue, setIssue] = useState<Issue | null>(null);

  const issueId = router.params.id;

  useEffect(() => {
    if (issueId) {
      const found = getIssueById(issueId);
      if (found) {
        setIssue(found);
      } else {
        Taro.showToast({ title: '问题不存在', icon: 'none' });
      }
    }
  }, [issueId, getIssueById]);

  const handleRectify = useCallback(() => {
    if (!issue) return;
    Taro.navigateTo({
      url: `/pages/rectify-submit/index?id=${issue.id}`
    });
  }, [issue]);

  const handleReviewPass = useCallback(() => {
    if (!issue) return;
    Taro.showModal({
      title: '确认通过',
      content: '确认该问题整改合格，予以通过？',
      success: (res) => {
        if (res.confirm) {
          const now = new Date();
          const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          const newRecord: RectifyRecord = {
            id: `r${Date.now()}`,
            time: timeStr,
            operator: currentUser,
            role: 'inspector',
            action: '复查通过',
            description: '经现场复查，整改符合要求，予以通过',
            images: [],
            result: 'pass'
          };

          const updatedIssue: Issue = {
            ...issue,
            status: 'done',
            records: [...issue.records, newRecord],
            updateTime: timeStr
          };

          updateIssue(updatedIssue);
          setIssue(updatedIssue);
          console.log('[IssueDetail] review pass:', issue.id);

          Taro.showToast({ title: '已通过', icon: 'success' });
        }
      }
    });
  }, [issue, updateIssue, currentUser]);

  const handleReviewReject = useCallback(() => {
    if (!issue) return;
    Taro.showModal({
      title: '确认退回',
      content: '确认退回该问题，要求重新整改？',
      success: (res) => {
        if (res.confirm) {
          const now = new Date();
          const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          const newRecord: RectifyRecord = {
            id: `r${Date.now()}`,
            time: timeStr,
            operator: currentUser,
            role: 'inspector',
            action: '复查退回',
            description: '整改不合格，需重新整改',
            images: [],
            result: 'reject'
          };

          const updatedIssue: Issue = {
            ...issue,
            status: 'rejected',
            records: [...issue.records, newRecord],
            updateTime: timeStr
          };

          updateIssue(updatedIssue);
          setIssue(updatedIssue);
          console.log('[IssueDetail] review reject:', issue.id);

          Taro.showToast({ title: '已退回', icon: 'none' });
        }
      }
    });
  }, [issue, updateIssue, currentUser]);

  const handleDesignConfirm = useCallback(() => {
    if (!issue) return;
    Taro.showModal({
      title: '提交设计确认',
      content: '将该问题标记为需设计确认？',
      success: (res) => {
        if (res.confirm) {
          const now = new Date();
          const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          const newRecord: RectifyRecord = {
            id: `r${Date.now()}`,
            time: timeStr,
            operator: currentUser,
            role: 'inspector',
            action: '提交设计确认',
            description: '该问题需设计院确认处理方案',
            images: [],
            result: 'design'
          };

          const updatedIssue: Issue = {
            ...issue,
            status: 'design',
            records: [...issue.records, newRecord],
            updateTime: timeStr
          };

          updateIssue(updatedIssue);
          setIssue(updatedIssue);
          console.log('[IssueDetail] design confirm:', issue.id);

          Taro.showToast({ title: '已提交', icon: 'success' });
        }
      }
    });
  }, [issue, updateIssue, currentUser]);

  if (!issue) {
    return (
      <View className={styles.pageContainer}>
        <View style={{ padding: '100rpx 0', textAlign: 'center' }}>
          <Text style={{ color: '#86909c' }}>加载中...</Text>
        </View>
      </View>
    );
  }

  const showActionBar = issue.status === 'pending' || issue.status === 'processing' || issue.status === 'rejected';

  return (
    <View className={styles.pageContainer}>
      <View className={styles.statusHeader}>
        <View className={styles.statusRow}>
          <View className={styles.statusBadge}>
            <Text>{IssueStatusText[issue.status]}</Text>
          </View>
        </View>
        <Text className={styles.issueTitle}>{IssueCategoryText[issue.category]}</Text>
        <Text className={styles.issueSubtitle}>{issue.axisPosition}</Text>
      </View>

      <ScrollView scrollY>
        <View className={styles.infoSection}>
          <Text className={styles.sectionTitle}>基本信息</Text>
          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>项目名称</Text>
              <Text className={styles.infoValue}>{issue.projectName}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>管道类型</Text>
              <Text className={styles.infoValue}>{IssueTypeText[issue.type]}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>问题类型</Text>
              <Text className={styles.infoValue}>{IssueCategoryText[issue.category]}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>提交人</Text>
              <Text className={styles.infoValue}>{issue.creator}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>提交时间</Text>
              <Text className={styles.infoValue}>{issue.createTime}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>更新时间</Text>
              <Text className={styles.infoValue}>{issue.updateTime}</Text>
            </View>
          </View>
        </View>

        {issue.designElevation !== undefined && (
          <View className={styles.infoSection}>
            <Text className={styles.sectionTitle}>标高信息</Text>
            <View className={styles.elevationCard}>
              <View className={styles.elevRow}>
                <View className={styles.elevCol}>
                  <Text className={styles.elevColLabel}>设计标高</Text>
                  <Text className={styles.elevColValue}>{issue.designElevation} m</Text>
                </View>
                <View className={styles.elevCol}>
                  <Text className={styles.elevColLabel}>实测标高</Text>
                  <Text className={styles.elevColValue}>{issue.measuredElevation} m</Text>
                </View>
                <View className={styles.elevCol}>
                  <Text className={styles.elevColLabel}>允许偏差</Text>
                  <Text className={styles.elevColValue}>{issue.allowableDeviation} mm</Text>
                </View>
              </View>
              <View className={styles.elevRow}>
                <View className={styles.elevCol}>
                  <Text className={styles.elevColLabel}>实际偏差</Text>
                  <Text className={classnames(styles.elevColValue, styles.deviation, issue.isQualified && styles.pass)}>
                    {issue.deviation} mm
                  </Text>
                </View>
                <View className={styles.elevCol}>
                  <Text className={styles.elevColLabel}>是否合格</Text>
                  <Text className={classnames(styles.elevColValue, issue.isQualified ? styles.pass : styles.deviation)}>
                    {issue.isQualified ? '✓ 合格' : '✗ 不合格'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View className={styles.photoSection}>
          <Text className={styles.sectionTitle}>照片资料</Text>

          <View className={styles.photoGroup}>
            <Text className={styles.photoLabel}>
              问题照片
              {issue.marks && issue.marks.length > 0 && (
                <Text style={{ color: '#165dff', marginLeft: '8rpx' }}>
                  (已标注 {issue.marks.length} 处问题)
                </Text>
              )}
            </Text>
            {issue.images.length > 0 ? (
              <View className={styles.photoList}>
                {issue.images.map((img, idx) => (
                  <View key={idx} className={styles.photoItem}>
                    <MarkedImageView
                      imageUrl={img}
                      marks={issue.marks || []}
                      width={200}
                      height={200}
                      mode="aspectFill"
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View className={styles.emptyPhotos}>暂无照片</View>
            )}
          </View>

          {issue.rectifyImages.length > 0 && (
            <View className={styles.photoGroup}>
              <Text className={styles.photoLabel}>整改后照片</Text>
              <View className={styles.photoList}>
                {issue.rectifyImages.map((img, idx) => (
                  <View key={idx} className={styles.photoItem}>
                    <Image className={styles.photoImg} src={img} mode="aspectFill" />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View className={styles.infoSection}>
          <Text className={styles.sectionTitle}>问题描述</Text>
          <Text className={styles.description}>{issue.description}</Text>
        </View>

        {issue.rectifyMethod && (
          <View className={styles.infoSection}>
            <Text className={styles.sectionTitle}>整改方式</Text>
            <View>
              <Text className={styles.methodTag}>{RectifyMethodText[issue.rectifyMethod as RectifyMethod]}</Text>
              {issue.rectifyDescription && (
                <Text className={styles.description} style={{ marginTop: '16rpx' }}>
                  {issue.rectifyDescription}
                </Text>
              )}
            </View>
          </View>
        )}

        <View className={styles.infoSection}>
          <Text className={styles.sectionTitle}>处理记录</Text>
          <View className={styles.recordList}>
            {issue.records.map(record => (
              <View key={record.id} className={styles.recordItem}>
                <View className={styles.recordDot} />
                <View className={styles.recordHeader}>
                  <Text className={styles.recordAction}>{record.action}</Text>
                  <Text className={styles.recordTime}>{record.time}</Text>
                </View>
                <Text className={styles.recordOperator}>{record.operator}</Text>
                <Text className={styles.recordDesc}>{record.description}</Text>
                {record.images.length > 0 && (
                  <View className={styles.recordPhotos}>
                    {record.images.map((img, idx) => (
                      <Image key={idx} className={styles.recordPhoto} src={img} mode="aspectFill" />
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {showActionBar && (
        <View className={styles.actionBar}>
          {issue.status === 'pending' && (
            <View className={classnames(styles.actionBtn, styles.primary)} onClick={handleRectify}>
              <Text>提交整改</Text>
            </View>
          )}

          {(issue.status === 'processing' || issue.status === 'rejected') && (
            <>
              <View className={classnames(styles.actionBtn, styles.danger)} onClick={handleReviewReject}>
                <Text>退回</Text>
              </View>
              <View className={classnames(styles.actionBtn, styles.secondary)} onClick={handleDesignConfirm}>
                <Text>设计确认</Text>
              </View>
              <View className={classnames(styles.actionBtn, styles.success)} onClick={handleReviewPass}>
                <Text>通过</Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default IssueDetailPage;
