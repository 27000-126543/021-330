import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Input, Textarea, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/issueStore';
import { IssueType, IssueCategory, IssueTypeText, IssueCategoryText, Issue, IssueMark } from '@/types';
import ImageMarker from '@/components/ImageMarker';

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
  const [imageMarks, setImageMarks] = useState<IssueMark[][]>([]);
  const [deviation, setDeviation] = useState<number | null>(null);
  const [isQualified, setIsQualified] = useState<boolean | null>(null);
  const [markingImageIndex, setMarkingImageIndex] = useState<number | null>(null);

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
        setImageMarks(prev => [...prev, ...newImages.map(() => [])]);
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
    setImageMarks(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleStartMark = useCallback((index: number) => {
    setMarkingImageIndex(index);
  }, []);

  const handleSaveMarks = useCallback((marks: IssueMark[]) => {
    if (markingImageIndex !== null) {
      setImageMarks(prev => {
        const updated = [...prev];
        updated[markingImageIndex] = marks;
        return updated;
      });
      console.log('[PhotoMark] marks saved for image', markingImageIndex, ':', marks.length);

      Taro.showToast({
        title: `已保存${marks.length}处标注`,
        icon: 'success',
        duration: 1000
      });
    }
    setMarkingImageIndex(null);
  }, [markingImageIndex]);

  const handleCancelMark = useCallback(() => {
    setMarkingImageIndex(null);
  }, []);

  const handleSelectProject = () => {
    Taro.navigateTo({ url: '/pages/project-select/index' });
  };

  const validateElevationData = useCallback(() => {
    const hasElevationInput = designElevation.trim() !== '' || measuredElevation.trim() !== '' || allowableDeviation.trim() !== '';
    const hasElevationCategory = category === 'elevation';

    if (hasElevationCategory || hasElevationInput) {
      if (!designElevation.trim()) {
        Taro.showToast({ title: '请填写设计标高', icon: 'none' });
        return false;
      }
      if (!measuredElevation.trim()) {
        Taro.showToast({ title: '请填写实测标高', icon: 'none' });
        return false;
      }
      if (!allowableDeviation.trim()) {
        Taro.showToast({ title: '请填写允许偏差', icon: 'none' });
        return false;
      }

      const design = parseFloat(designElevation);
      const measured = parseFloat(measuredElevation);
      const allow = parseFloat(allowableDeviation);

      if (isNaN(design)) {
        Taro.showToast({ title: '设计标高格式不正确', icon: 'none' });
        return false;
      }
      if (isNaN(measured)) {
        Taro.showToast({ title: '实测标高格式不正确', icon: 'none' });
        return false;
      }
      if (isNaN(allow)) {
        Taro.showToast({ title: '允许偏差格式不正确', icon: 'none' });
        return false;
      }
    }

    return true;
  }, [designElevation, measuredElevation, allowableDeviation, category]);

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

    if (!validateElevationData()) {
      return;
    }

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const design = designElevation.trim() !== '' ? parseFloat(designElevation) : undefined;
    const measured = measuredElevation.trim() !== '' ? parseFloat(measuredElevation) : undefined;
    const allow = allowableDeviation.trim() !== '' ? parseFloat(allowableDeviation) : undefined;
    const calculatedDeviation = design !== undefined && measured !== undefined
      ? Math.round(Math.abs(measured - design) * 1000)
      : undefined;
    const calculatedQualified = calculatedDeviation !== undefined && allow !== undefined
      ? calculatedDeviation <= allow
      : undefined;

    const issueMarks = images.map((_, idx) => imageMarks[idx] || []);

    const newIssue: Issue = {
      id: `i${Date.now()}`,
      projectId: currentProject.id,
      projectName: currentProject.name,
      axisPosition: axisPosition.trim(),
      type: issueType,
      category: category,
      description: description.trim(),
      status: 'pending',
      designElevation: design,
      measuredElevation: measured,
      allowableDeviation: allow,
      deviation: calculatedDeviation,
      isQualified: calculatedQualified,
      images: images,
      marks: issueMarks,
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
    const totalMarks = issueMarks.flat().length;
    console.log('[PhotoMark] issue submitted:', newIssue.id, 'total marks:', totalMarks);

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
      setImageMarks([]);
      setDeviation(null);
      setIsQualified(null);
    }, 1500);
  }, [currentProject, axisPosition, images, imageMarks, description, issueType, category, designElevation, measuredElevation, allowableDeviation, validateElevationData, addIssue, currentUser]);

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
          {category === 'elevation' && (
            <View style={{ marginTop: '16rpx', padding: '16rpx', background: '#e8f0ff', borderRadius: '8rpx' }}>
              <Text style={{ fontSize: '24rpx', color: '#165dff' }}>选择了标高问题，请完整填写下方标高数据</Text>
            </View>
          )}
        </View>

        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>现场照片</Text>
          <View className={styles.photoArea} onClick={handleChooseImage}>
            <Text className={styles.photoIcon}>📷</Text>
            <Text className={styles.photoText}>点击拍照或从相册选择</Text>
            <Text className={styles.markTip}>选完照片后可点击图片进入圈注模式</Text>
          </View>
          {images.length > 0 && (
            <View className={styles.photoPreview}>
              {images.map((img, index) => (
                <View key={index} className={styles.photoItem}>
                  <Image
                    className={styles.photoImg}
                    src={img}
                    mode="aspectFill"
                    onClick={() => handleStartMark(index)}
                  />
                  {imageMarks[index] && imageMarks[index].length > 0 && (
                    <View className={styles.markBadge}>
                      <Text className={styles.markBadgeText}>{imageMarks[index].length}</Text>
                    </View>
                  )}
                  <View className={styles.photoDelete} onClick={(e) => { e.stopPropagation(); handleDeleteImage(index); }}>
                    <Text>×</Text>
                  </View>
                  <View
                    className={styles.markBtn}
                    onClick={(e) => { e.stopPropagation(); handleStartMark(index); }}
                  >
                    <Text className={styles.markBtnText}>
                      {imageMarks[index] && imageMarks[index].length > 0 ? '编辑标注' : '圈注'}
                    </Text>
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
          {(designElevation || measuredElevation || allowableDeviation) && (
            <View style={{ marginTop: '16rpx', fontSize: '22rpx', color: '#86909c' }}>
              <Text>💡 提示：填写任一标高项后，三项均需完整填写才能提交</Text>
            </View>
          )}
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

      {markingImageIndex !== null && images[markingImageIndex] && (
        <ImageMarker
          imageUrl={images[markingImageIndex]}
          initialMarks={imageMarks[markingImageIndex]}
          onSave={handleSaveMarks}
          onCancel={handleCancelMark}
        />
      )}
    </View>
  );
};

export default PhotoMarkPage;
