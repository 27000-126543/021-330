import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store/issueStore';
import { Project } from '@/types';

const ProjectSelectPage: React.FC = () => {
  const { projects, currentProject, setCurrentProject } = useAppStore();
  const [searchText, setSearchText] = useState('');

  const filteredProjects = useMemo(() => {
    if (!searchText.trim()) return projects;
    const keyword = searchText.trim().toLowerCase();
    return projects.filter(
      p => p.name.toLowerCase().includes(keyword) ||
           p.address.toLowerCase().includes(keyword) ||
           p.building.toLowerCase().includes(keyword)
    );
  }, [projects, searchText]);

  const handleSelect = (project: Project) => {
    setCurrentProject(project);
    console.log('[ProjectSelect] selected:', project.name);
    Taro.showToast({
      title: '已选择项目',
      icon: 'success',
      duration: 1000
    });
    setTimeout(() => {
      Taro.navigateBack();
    }, 1000);
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.searchBar}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder="搜索项目名称、地址..."
          placeholderClass="placeholder"
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
        />
      </View>

      <ScrollView scrollY>
        <View className={styles.projectList}>
          {filteredProjects.map(project => (
            <View
              key={project.id}
              className={classnames(
                styles.projectCard,
                currentProject?.id === project.id && styles.selected
              )}
              onClick={() => handleSelect(project)}
            >
              {currentProject?.id === project.id && (
                <Text className={styles.selectedIcon}>✓</Text>
              )}
              <Text className={styles.projectName}>{project.name}</Text>
              <Text className={styles.projectAddress}>📍 {project.address}</Text>
              <View className={styles.projectInfo}>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>楼栋</Text>
                  <Text className={styles.infoValue}>{project.building}</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>楼层</Text>
                  <Text className={styles.infoValue}>{project.floor}</Text>
                </View>
              </View>
            </View>
          ))}

          {filteredProjects.length === 0 && (
            <View style={{ padding: '64rpx 0', textAlign: 'center' }}>
              <Text style={{ color: '#86909c', fontSize: '28rpx' }}>未找到相关项目</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ProjectSelectPage;
