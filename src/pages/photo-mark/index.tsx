import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Input, Textarea, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/issueStore';
import { IssueType, IssueCategory, IssueTypeText, IssueCategoryText, Issue } from '@/types';

const PhotoMarkPage: React.FC = () => {
  const { currentProject, addIssue, currentUser } = useAppStore();

  const [axisPosition, setAxisPosition] = useState('');
  const [issueType, setIssueType] = useState<IssueType>('duct');
  const [category, setCategory] = useState<IssueCategory>('deviation');
  const [description, setDescription] = useState('');
  const [designElevation, setDesignElevation] = useState('');
  const [measuredElevation, setMeasuredElevation] = useState('');
  const [allowableDeviation, setAllowableDeviation] = useState('20');
  const [images, setImages] = useState<string[]>([]);
  const [deviation, setDeviation] = useState<number | null>(null);
  const [isQualified, setIsQualified] = useState<boolean | null>(null);

  const issueTypes: IssueType[] = ['duct', 'bridge', 'sprinkler', 'other'];
  const categories: IssueCategory[] = ['deviation', 'close_beam', 'insufficient_space', 'elevation', 'other'];

  useEffect(() => {
    if (designElevation && measuredElevation && allowableDeviation) {
      const design = parseFloat(designElevation);
      const measured = parseFloat(measuredElevation);
      const allow = parseFloat(allowableDeviation);
      if (!isNaN(design) && !isNaN(measured) && !isNaN(allow)) {
        const dev = Math.abs(measured - design) * 1000;
        setDeviation(Math.round(dev));
        setIsQualified(dev <= allow);
      }
    } else {
      setDeviation(null);
      setIsQualified(null);
    }
  }, [designElevation, measuredElevation, allowableDeviation]);

  const handleChooseImage = useCallback(() => {
    Taro.chooseImage({
      count: 3 - images.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFilePaths;
        setImages(prev => [...prev, ...newImages]);
        console.log('[PhotoMark] chooseImage success:', newImages.length);
      },
      fail: (err) => {
        console.error('[PhotoMark] chooseImage error:', err);
        Taro.showToast({ title: '选择图片失败', icon: 'none' });
      }
    });
  }, [images.length]);

  const handleDeleteImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSelectProject = () => {
    Taro.navigateTo({ url: '/pages/project-select/index' });
  };

  const handleSubmit = useCallback(() => {
    if (!currentProject) {
      Taro.showToast({ title: '请先选择项目', icon: 'none' });
      return;
    }
    if (!axisPosition.trim()) {
      Taro.showToast({ title: '请输入轴线位置', icon: 'none' });
      return;
    }
    if (images.length === 0) {
      Taro.showToast({ title: '请至少拍摄一张照片', icon: 'none' });
      return;
    }
    if (!description.trim()) {
      Taro.showToast({ title: '请填写问题描述', icon: 'none' });
      return;
    }

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newIssue: Issue = {
      id: `i${Date.now()}`,
      projectId: currentProject.id,
      projectName: currentProject.name,
      axisPosition: axisPosition.trim(),
      type: issueType,
      category: category,
      description: description.trim(),
      status: 'pending',
      designElevation: designElevation ? parseFloat(designElevation) : undefined,
      measuredElevation: measuredElevation ? parseFloat(measuredElevation) : undefined,
      allowableDeviation: allowableDeviation ? parseFloat(allowableDeviation) : undefined,
      deviation: deviation ?? undefined,
      isQualified: isQualified ?? undefined,
      images: images,
      marks: [],
      rectifyImages: [],
      records: [
        {
          id: `r${Date.now()}`,
          time: timeStr,
          operator: currentUser,
          role: 'worker',
          action: '提交问题',
          description: description.trim(),
          images: []
        }
      ],
      creator: currentUser,
      createTime: timeStr,
      updateTime: timeStr
    };

    addIssue(newIssue);
    console.log('[PhotoMark] issue submitted:', newIssue.id);

    Taro.showToast({
      title: '提交成功',
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      setAxisPosition('');
      setDescription('');
      setDesignElevation('');
      setMeasuredElevation('');
      setImages([]);
      setDeviation(null);
      setIsQualified(null);
    }, 1500);
  }, [currentProject, axisPosition, images, description, issueType, category, designElevation, measuredElevation, allowableDeviation, deviation, isQualified, addIssue, currentUser]);

  return (
    <View className={styles.pageContainer}>
      <View className={styles.projectBar} onClick={handleSelectProject}>
        <View className={styles.projectInfo}>
          <Text className={styles.projectName}>
            {currentProject ? currentProject.name : '请选择项目'}
          </Text>
          <Text className={styles.projectFloor}>
            {currentProject ? `${currentProject.building} ${currentProject.floor}` : '点击选择项目'}
          </Text>
        </View>
        <Text className={styles.arrowIcon}>›</Text>
      </View>

      <ScrollView scrollY style={{ height: '100%' }}>
        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>位置信息</Text>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>轴线位置</Text>
            <Input
              className={styles.formInput}
              placeholder="如：B2层 A轴/3轴 交叉口"
              placeholderClass="placeholder"
              value={axisPosition}
              onInput={(e) => setAxisPosition(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>管道类型</Text>
          <View className={styles.typeTags}>
            {issueTypes.map(type => (
              <View
                key={type}
                className={classnames(styles.typeTag, issueType === type && styles.active)}
                onClick={() => setIssueType(type)}
              >
                <Text>{IssueTypeText[type]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>问题类型</Text>
          <View className={styles.typeTags}>
            {categories.map(cat => (
              <View
                key={cat}
                className={classnames(styles.typeTag, category === cat && styles.active)}
                onClick={() => setCategory(cat)}
              >
                <Text>{IssueCategoryText[cat]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>现场照片</Text>
          <View className={styles.photoArea} onClick={handleChooseImage}>
            <Text className={styles.photoIcon}>📷</Text>
            <Text className={styles.photoText}>点击拍照或从相册选择</Text>
            <Text className={styles.markTip}>可在照片上圈注问题位置</Text>
          </View>
          {images.length > 0 && (
            <View className={styles.photoPreview}>
              {images.map((img, index) => (
                <View key={index} className={styles.photoItem}>
                  <Image className={styles.photoImg} src={img} mode="aspectFill" />
                  <View className={styles.photoDelete} onClick={() => handleDeleteImage(index)}>
                    <Text>×</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>标高核对</Text>
          <View className={styles.elevationGroup}>
            <View className={styles.elevationItem}>
              <Text className={styles.formLabel}>设计标高</Text>
              <Input
                className={styles.elevationInput}
                type="digit"
                placeholder="-3.20"
                value={designElevation}
                onInput={(e) => setDesignElevation(e.detail.value)}
              />
              <Text className={styles.elevationUnit}>米 (m)</Text>
            </View>
            <View className={styles.elevationItem}>
              <Text className={styles.formLabel}>实测标高</Text>
              <Input
                className={styles.elevationInput}
                type="digit"
                placeholder="-3.05"
                value={measuredElevation}
                onInput={(e) => setMeasuredElevation(e.detail.value)}
              />
              <Text className={styles.elevationUnit}>米 (m)</Text>
            </View>
            <View className={styles.elevationItem}>
              <Text className={styles.formLabel}>允许偏差</Text>
              <Input
                className={styles.elevationInput}
                type="digit"
                placeholder="20"
                value={allowableDeviation}
                onInput={(e) => setAllowableDeviation(e.detail.value)}
              />
              <Text className={styles.elevationUnit}>毫米 (mm)</Text>
            </View>
          </View>
          {deviation !== null && (
            <View className={classnames(styles.deviationResult, isQualified && styles.pass)}>
              <Text className={classnames(styles.deviationText, isQualified && styles.pass)}>
                偏差 {deviation}mm {isQualified ? '✓ 合格' : '✗ 不合格'}
              </Text>
            </View>
          )}
        </View>

        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>问题描述</Text>
          <Textarea
            className={styles.formTextarea}
            placeholder="请详细描述问题情况..."
            placeholderClass="placeholder"
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={500}
          />
        </View>
      </ScrollView>

      <View className={styles.submitBar}>
        <View className={styles.submitBtn} onClick={handleSubmit}>
          <Text>提交问题</Text>
        </View>
      </View>
    </View>
  );
};

export default PhotoMarkPage;
