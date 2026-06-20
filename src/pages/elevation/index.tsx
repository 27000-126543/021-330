import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/issueStore';
import { ElevationRecord, IssueType, IssueTypeText, Issue, RectifyRecord } from '@/types';
import EmptyState from '@/components/EmptyState';

const ElevationPage: React.FC = () => {
  const { elevationRecords, addElevationRecord, addIssue, updateElevationRecord, currentProject, currentUser } = useAppStore();

  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [axisPosition, setAxisPosition] = useState('');
  const [recordType, setRecordType] = useState<IssueType>('duct');
  const [designElevation, setDesignElevation] = useState('');
  const [measuredElevation, setMeasuredElevation] = useState('');
  const [allowableDeviation, setAllowableDeviation] = useState('20');
  const [remark, setRemark] = useState('');
  const [previewDeviation, setPreviewDeviation] = useState<number | null>(null);
  const [previewQualified, setPreviewQualified] = useState<boolean | null>(null);

  const typeOptions: IssueType[] = ['duct', 'bridge', 'sprinkler', 'other'];

  const filteredRecords = elevationRecords.filter(r => {
    if (filterType === 'all') return true;
    if (filterType === 'pass') return r.isQualified;
    if (filterType === 'fail') return !r.isQualified;
    return r.type === filterType;
  });

  const totalCount = elevationRecords.length;
  const passCount = elevationRecords.filter(r => r.isQualified).length;
  const failCount = totalCount - passCount;

  useEffect(() => {
    if (designElevation && measuredElevation && allowableDeviation) {
      const design = parseFloat(designElevation);
      const measured = parseFloat(measuredElevation);
      const allow = parseFloat(allowableDeviation);
      if (!isNaN(design) && !isNaN(measured) && !isNaN(allow)) {
        const dev = Math.abs(measured - design) * 1000;
        setPreviewDeviation(Math.round(dev));
        setPreviewQualified(dev <= allow);
      }
    } else {
      setPreviewDeviation(null);
      setPreviewQualified(null);
    }
  }, [designElevation, measuredElevation, allowableDeviation]);

  const handleOpenAdd = useCallback(() => {
    setAxisPosition('');
    setDesignElevation('');
    setMeasuredElevation('');
    setAllowableDeviation('20');
    setRemark('');
    setPreviewDeviation(null);
    setPreviewQualified(null);
    setShowAddModal(true);
  }, []);

  const handleCloseAdd = useCallback(() => {
    setShowAddModal(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!currentProject) {
      Taro.showToast({ title: '请先选择项目', icon: 'none' });
      return;
    }
    if (!axisPosition.trim()) {
      Taro.showToast({ title: '请输入轴线位置', icon: 'none' });
      return;
    }
    if (!designElevation || !measuredElevation) {
      Taro.showToast({ title: '请填写标高数据', icon: 'none' });
      return;
    }

    const design = parseFloat(designElevation);
    const measured = parseFloat(measuredElevation);
    const allow = parseFloat(allowableDeviation);
    const dev = Math.round(Math.abs(measured - design) * 1000);
    const qualified = dev <= allow;

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const record: ElevationRecord = {
      id: `e${Date.now()}`,
      projectId: currentProject.id,
      projectName: currentProject.name,
      axisPosition: axisPosition.trim(),
      type: recordType,
      designElevation: design,
      measuredElevation: measured,
      allowableDeviation: allow,
      deviation: dev,
      isQualified: qualified,
      remark: remark.trim(),
      createTime: timeStr,
      images: [],
      isConverted: false
    };

    addElevationRecord(record);
    console.log('[Elevation] record added:', record.id);

    Taro.showToast({
      title: qualified ? '记录成功，合格' : '记录成功，不合格',
      icon: qualified ? 'success' : 'none',
      duration: 1500
    });

    setTimeout(() => {
      setShowAddModal(false);
    }, 1500);
  }, [currentProject, axisPosition, designElevation, measuredElevation, allowableDeviation, recordType, remark, addElevationRecord]);

  const handleConvertToIssue = useCallback((record: ElevationRecord) => {
    if (record.isConverted) {
      Taro.showToast({ title: '该记录已转待整改', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '转待整改问题',
      content: `确定将 ${record.axisPosition} 的不合格标高记录转为待整改问题吗？`,
      success: (res) => {
        if (res.confirm) {
          const now = new Date();
          const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          const newIssue: Issue = {
            id: `i${Date.now()}`,
            projectId: record.projectId,
            projectName: record.projectName,
            axisPosition: record.axisPosition,
            type: record.type,
            category: 'elevation',
            description: `标高偏差 ${record.deviation}mm，超出允许偏差 ${record.allowableDeviation}mm。${record.remark ? '备注：' + record.remark : ''}`,
            status: 'pending',
            designElevation: record.designElevation,
            measuredElevation: record.measuredElevation,
            allowableDeviation: record.allowableDeviation,
            deviation: record.deviation,
            isQualified: false,
            images: record.images || [],
            marks: (record.images || []).map(() => []),
            rectifyImages: [],
            source: 'elevation',
            sourceRecordId: record.id,
            records: [
              {
                id: `r${Date.now()}`,
                time: timeStr,
                operator: currentUser,
                role: 'inspector',
                action: '标高核对转待整改',
                description: `由标高核对记录生成。设计标高 ${record.designElevation}m，实测标高 ${record.measuredElevation}m，偏差 ${record.deviation}mm，超出允许偏差 ${record.allowableDeviation}mm。${record.remark ? '备注：' + record.remark : ''}`,
                images: record.images || []
              }
            ],
            creator: currentUser,
            createTime: timeStr,
            updateTime: timeStr
          };

          addIssue(newIssue);
          updateElevationRecord(record.id, {
            isConverted: true,
            convertedIssueId: newIssue.id
          });
          console.log('[Elevation] converted to issue:', newIssue.id, 'from record:', record.id);

          Taro.showToast({
            title: '已生成待整改问题',
            icon: 'success',
            duration: 1500
          });
        }
      }
    });
  }, [addIssue, updateElevationRecord, currentUser]);

  const handleSelectProject = () => {
    Taro.navigateTo({ url: '/pages/project-select/index' });
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.statsBar}>
        <View className={styles.statItem}>
          <Text className={classnames(styles.statValue, styles.total)}>{totalCount}</Text>
          <Text className={styles.statLabel}>总记录</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classnames(styles.statValue, styles.pass)}>{passCount}</Text>
          <Text className={styles.statLabel}>合格</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classnames(styles.statValue, styles.fail)}>{failCount}</Text>
          <Text className={styles.statLabel}>不合格</Text>
        </View>
      </View>

      <View className={styles.filterBar}>
        <View className={styles.typeFilter}>
          {[
            { key: 'all', label: '全部' },
            { key: 'pass', label: '合格' },
            { key: 'fail', label: '不合格' }
          ].map(item => (
            <View
              key={item.key}
              className={classnames(styles.filterTag, filterType === item.key && styles.active)}
              onClick={() => setFilterType(item.key)}
            >
              <Text>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView scrollY className={styles.listContainer}>
        {filteredRecords.length === 0 ? (
          <EmptyState
            icon="📏"
            title="暂无标高记录"
            description="点击右下角按钮添加标高核对记录"
          />
        ) : (
          filteredRecords.map(record => (
            <View key={record.id} className={styles.recordCard}>
              <View className={styles.cardHeader}>
                <View className={styles.typeBadge}>{IssueTypeText[record.type]}</View>
                <View className={classnames(styles.statusBadge, record.isQualified ? styles.pass : styles.fail)}>
                  {record.isQualified ? '合格' : '不合格'}
                </View>
              </View>

              <Text className={styles.axisText}>{record.axisPosition}</Text>
              <Text className={styles.projectText}>{record.projectName}</Text>

              <View className={styles.elevationGrid}>
                <View className={styles.elevItem}>
                  <Text className={styles.elevLabel}>设计标高</Text>
                  <Text className={styles.elevValue}>
                    {record.designElevation}
                    <Text className={styles.elevUnit}>m</Text>
                  </Text>
                </View>
                <View className={styles.elevItem}>
                  <Text className={styles.elevLabel}>实测标高</Text>
                  <Text className={styles.elevValue}>
                    {record.measuredElevation}
                    <Text className={styles.elevUnit}>m</Text>
                  </Text>
                </View>
                <View className={styles.elevItem}>
                  <Text className={styles.elevLabel}>偏差值</Text>
                  <Text className={classnames(styles.elevValue, styles.deviation, record.isQualified && styles.pass)}>
                    {record.deviation}
                    <Text className={styles.elevUnit}>mm</Text>
                  </Text>
                </View>
              </View>

              {record.remark && (
                <Text className={styles.remarkText}>备注：{record.remark}</Text>
              )}

              <View className={styles.cardFooter}>
                <Text className={styles.timeText}>{record.createTime}</Text>
                {record.isConverted ? (
                  <View
                    className={styles.viewIssueBtn}
                    onClick={() => {
                      if (record.convertedIssueId) {
                        Taro.navigateTo({ url: `/pages/issue-detail/index?id=${record.convertedIssueId}` });
                      }
                    }}
                  >
                    <Text className={styles.viewIssueBtnText}>查看问题</Text>
                  </View>
                ) : !record.isQualified ? (
                  <View className={styles.convertBtn} onClick={() => handleConvertToIssue(record)}>
                    <Text className={styles.convertBtnText}>转待整改</Text>
                  </View>
                ) : null}
              </View>
              {record.isConverted && (
                <View className={styles.convertedTag}>
                  <Text className={styles.convertedTagText}>✓ 已转待整改</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <View className={styles.fabButton} onClick={handleOpenAdd}>
        <Text className={styles.fabIcon}>+</Text>
      </View>

      {showAddModal && (
        <View className={styles.addModal} onClick={handleCloseAdd}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>新增标高核对</Text>
              <Text className={styles.modalClose} onClick={handleCloseAdd}>×</Text>
            </View>

            <View className={styles.modalFormItem}>
              <Text className={styles.modalLabel}>当前项目</Text>
              <View className={styles.modalInput} onClick={handleSelectProject}>
                <Text style={{ lineHeight: '80rpx', color: currentProject ? '#1d2129' : '#c9cdd4' }}>
                  {currentProject ? currentProject.name : '请选择项目'}
                </Text>
              </View>
            </View>

            <View className={styles.modalFormItem}>
              <Text className={styles.modalLabel}>轴线位置</Text>
              <Input
                className={styles.modalInput}
                placeholder="如：B2层 A轴/3轴 交叉口"
                value={axisPosition}
                onInput={(e) => setAxisPosition(e.detail.value)}
              />
            </View>

            <View className={styles.modalFormItem}>
              <Text className={styles.modalLabel}>管道类型</Text>
              <View className={styles.typeSelector}>
                {typeOptions.map(type => (
                  <View
                    key={type}
                    className={classnames(styles.typeOption, recordType === type && styles.active)}
                    onClick={() => setRecordType(type)}
                  >
                    <Text>{IssueTypeText[type]}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.modalFormItem}>
              <Text className={styles.modalLabel}>标高数据</Text>
              <View className={styles.elevInputGroup}>
                <View className={styles.elevInputItem}>
                  <Input
                    className={styles.modalInput}
                    type="digit"
                    placeholder="设计标高(m)"
                    value={designElevation}
                    onInput={(e) => setDesignElevation(e.detail.value)}
                  />
                </View>
                <View className={styles.elevInputItem}>
                  <Input
                    className={styles.modalInput}
                    type="digit"
                    placeholder="实测标高(m)"
                    value={measuredElevation}
                    onInput={(e) => setMeasuredElevation(e.detail.value)}
                  />
                </View>
              </View>
            </View>

            <View className={styles.modalFormItem}>
              <Text className={styles.modalLabel}>允许偏差 (mm)</Text>
              <Input
                className={styles.modalInput}
                type="digit"
                placeholder="20"
                value={allowableDeviation}
                onInput={(e) => setAllowableDeviation(e.detail.value)}
              />
            </View>

            {previewDeviation !== null && (
              <View className={classnames(styles.deviationPreview, previewQualified ? styles.pass : styles.fail)}>
                <Text className={classnames(styles.deviationPreviewText, previewQualified ? styles.pass : styles.fail)}>
                  偏差 {previewDeviation}mm {previewQualified ? '✓ 合格' : '✗ 不合格'}
                </Text>
              </View>
            )}

            <View className={styles.modalFormItem}>
              <Text className={styles.modalLabel}>备注</Text>
              <Textarea
                className={styles.modalTextarea}
                placeholder="可填写备注信息（选填）"
                value={remark}
                onInput={(e) => setRemark(e.detail.value)}
                maxlength={200}
              />
            </View>

            <View className={styles.modalSubmit} onClick={handleSubmit}>
              <Text>保存记录</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ElevationPage;
