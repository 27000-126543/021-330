import { create } from 'zustand';
import { Issue, Project, ElevationRecord } from '@/types';
import { mockIssues, mockElevationRecords } from '@/data/mockIssues';
import { mockProjects } from '@/data/mockProjects';
import { storage } from '@/utils/storage';

interface AppState {
  projects: Project[];
  issues: Issue[];
  elevationRecords: ElevationRecord[];
  currentProject: Project | null;
  currentUser: string;

  initData: () => void;
  setCurrentProject: (project: Project) => void;
  addIssue: (issue: Issue) => void;
  updateIssue: (issue: Issue) => void;
  addElevationRecord: (record: ElevationRecord) => void;
  getIssuesByStatus: (status: string) => Issue[];
  getIssueById: (id: string) => Issue | undefined;
}

const STORAGE_KEYS = {
  ISSUES: 'issues',
  ELEVATION_RECORDS: 'elevation_records',
  CURRENT_PROJECT: 'current_project',
  CURRENT_USER: 'current_user'
};

export const useAppStore = create<AppState>((set, get) => ({
  projects: [],
  issues: [],
  elevationRecords: [],
  currentProject: null,
  currentUser: '张工（施工员）',

  initData: () => {
    const storedIssues = storage.getSync<Issue[]>(STORAGE_KEYS.ISSUES);
    const storedRecords = storage.getSync<ElevationRecord[]>(STORAGE_KEYS.ELEVATION_RECORDS);
    const storedProject = storage.getSync<Project>(STORAGE_KEYS.CURRENT_PROJECT);
    const storedUser = storage.getSync<string>(STORAGE_KEYS.CURRENT_USER);

    set({
      projects: mockProjects,
      issues: storedIssues && storedIssues.length > 0 ? storedIssues : mockIssues,
      elevationRecords: storedRecords && storedRecords.length > 0 ? storedRecords : mockElevationRecords,
      currentProject: storedProject || mockProjects[0] || null,
      currentUser: storedUser || '张工（施工员）'
    });

    console.log('[Store] initData completed, issues count:', get().issues.length);
  },

  setCurrentProject: (project: Project) => {
    set({ currentProject: project });
    storage.setSync(STORAGE_KEYS.CURRENT_PROJECT, project);
  },

  addIssue: (issue: Issue) => {
    const issues = [issue, ...get().issues];
    set({ issues });
    storage.setSync(STORAGE_KEYS.ISSUES, issues);
    console.log('[Store] addIssue:', issue.id);
  },

  updateIssue: (issue: Issue) => {
    const issues = get().issues.map(i => i.id === issue.id ? { ...issue, updateTime: new Date().toISOString() } : i);
    set({ issues });
    storage.setSync(STORAGE_KEYS.ISSUES, issues);
    console.log('[Store] updateIssue:', issue.id);
  },

  addElevationRecord: (record: ElevationRecord) => {
    const records = [record, ...get().elevationRecords];
    set({ elevationRecords: records });
    storage.setSync(STORAGE_KEYS.ELEVATION_RECORDS, records);
    console.log('[Store] addElevationRecord:', record.id);
  },

  getIssuesByStatus: (status: string) => {
    if (status === 'all') return get().issues;
    return get().issues.filter(i => i.status === status);
  },

  getIssueById: (id: string) => {
    return get().issues.find(i => i.id === id);
  }
}));
