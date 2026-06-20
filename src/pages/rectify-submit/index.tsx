import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/issueStore';
import { Issue, RectifyMethod, RectifyMethodText, RectifyRecord, IssueTypeText, IssueCategoryText } from '@/types';

const methods: RectifyMethod[] = ['hanger_adjust', 'pipe_move', 'insulation_adjust', 'other'];

const RectifySubmitPage: React.FC = () => {
  const router = useRouter();
  const { getIssueById, updateIssue, currentUser } = useAppStore();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<RectifyMethod>('hanger_adjust');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);

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

  const handleChooseImage = useCallback(() => {
    Taro.chooseImage({
      count: 6 - images.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFilePaths;
        setImages(prev => [...prev, ...newImages]);
        console.log('[RectifySubmit] chooseImage success:', newImages.length);
      },
      fail: (err) => {
        console.error('[RectifySubmit] chooseImage error:', err);
        Taro.showToast({ title: '选择图片失败', icon: 'none' });
      }
    });
  }, [images.length]);

  const handleDeleteImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!issue) return;
    if (images.length === 0) {
      Taro.showToast({ title: '请上传整改后照片', icon: 'none' });
      return;
    }
    if (!description.trim()) {
      Taro.showToast({ title: '请填写整改说明', icon: 'none' });
      return;
    }

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRecord: RectifyRecord = {
      id: `r${Date.now()}`,
      time: timeStr,
      operator: currentUser,
      role: 'worker',
      action: '提交整改',
      description: description.trim(),
      images: images,
      method: selectedMethod
    };

    const updatedIssue: Issue = {
      ...issue,
      status: 'processing',
      rectifyImages: [...issue.rectifyImages, ...images],
      rectifyMethod: selectedMethod,
      rectifyDescription: description.trim(),
      records: [...issue.records, newRecord],
      updateTime: timeStr
    };

    updateIssue(updatedIssue);
    console.log('[RectifySubmit] rectify submitted:', issue.id);

    Taro.showToast({
      title: '提交成功',
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
  }, [issue, images, description, selectedMethod, updateIssue, currentUser]);

  if (!issue) {
    return (
      <View className={styles.pageContainer}>
        <View style={{ padding: '100rpx 0', textAlign: 'center' }}>
          <Text style={{ color: '#86909c' }}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.pageContainer}>
      <ScrollView scrollY>
        <View className={styles.issueCard}>
          <Text className={styles.issueTitle}>
            {IssueTypeText[issue.type]} · {IssueCategoryText[issue.category]}
          </Text>
          <Text className={styles.issueMeta}>位置：{issue.axisPosition}</Text>
          <Text className={styles.issueMeta}>项目：{issue.projectName}</Text>
          <Text className={styles.issueMeta}>问题：{issue.description}</Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>整改方式</Text>
          <View className={styles.methodList}>
            {methods.map(method => (
              <View
                key={method}
                className={classnames(styles.methodItem, selectedMethod === method && styles.active)}
                onClick={() => setSelectedMethod(method)}
              >
                <View className={styles.methodRadio}>
                  <View className={styles.methodRadioInner} />
                </View>
                <Text className={styles.methodText}>{RectifyMethodText[method]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>整改后照片</Text>
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
          <View
            className={styles.photoArea}
            onClick={handleChooseImage}
            style={{ marginTop: images.length > 0 ? '24rpx' : 0 }}
          >
            <Text className={styles.photoIcon}>📷</Text>
            <Text className={styles.photoText}>点击上传整改后照片</Text>
            <Text className={styles.photoTip}>最多上传6张，建议多角度拍摄</Text>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>整改说明</Text>
          <Textarea
            className={styles.textarea}
            placeholder="请详细描述整改措施和处理结果..."
            placeholderClass="placeholder"
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={500}
          />
        </View>
      </ScrollView>

      <View className={styles.submitBar}>
        <View className={styles.submitBtn} onClick={handleSubmit}>
          <Text>提交整改</Text>
        </View>
      </View>
    </View>
  );
};

export default RectifySubmitPage;
