export interface Project {
  id: string;
  name: string;
  address: string;
  building: string;
  floor: string;
}

export type IssueStatus = 'pending' | 'processing' | 'done' | 'rejected' | 'design';

export type IssueType = 'duct' | 'bridge' | 'sprinkler' | 'other';

export type IssueCategory = 'deviation' | 'close_beam' | 'insufficient_space' | 'elevation' | 'other';

export type RectifyMethod = 'hanger_adjust' | 'pipe_move' | 'insulation_adjust' | 'other';

export interface MarkPoint {
  x: number;
  y: number;
}

export interface IssueMark {
  id: string;
  type: 'circle' | 'rect' | 'text';
  points: MarkPoint[];
  color: string;
  text?: string;
}

export interface RectifyRecord {
  id: string;
  time: string;
  operator: string;
  role: 'worker' | 'inspector';
  action: string;
  description: string;
  images: string[];
  method?: RectifyMethod;
  result?: 'pass' | 'reject' | 'design';
}

export interface Issue {
  id: string;
  projectId: string;
  projectName: string;
  axisPosition: string;
  type: IssueType;
  category: IssueCategory;
  description: string;
  status: IssueStatus;
  designElevation?: number;
  measuredElevation?: number;
  allowableDeviation?: number;
  deviation?: number;
  isQualified?: boolean;
  images: string[];
  marks: IssueMark[][];
  rectifyImages: string[];
  rectifyMethod?: RectifyMethod;
  rectifyDescription?: string;
  records: RectifyRecord[];
  creator: string;
  createTime: string;
  updateTime: string;
}

export interface ElevationRecord {
  id: string;
  projectId: string;
  projectName: string;
  axisPosition: string;
  type: IssueType;
  designElevation: number;
  measuredElevation: number;
  allowableDeviation: number;
  deviation: number;
  isQualified: boolean;
  remark: string;
  createTime: string;
  images: string[];
}

export const IssueTypeText: Record<IssueType, string> = {
  duct: '风管',
  bridge: '桥架',
  sprinkler: '喷淋管',
  other: '其他'
};

export const IssueCategoryText: Record<IssueCategory, string> = {
  deviation: '偏位',
  close_beam: '贴梁过近',
  insufficient_space: '检修空间不足',
  elevation: '标高问题',
  other: '其他问题'
};

export const IssueStatusText: Record<IssueStatus, string> = {
  pending: '待整改',
  processing: '整改中',
  done: '已通过',
  rejected: '已退回',
  design: '需设计确认'
};

export const RectifyMethodText: Record<RectifyMethod, string> = {
  hanger_adjust: '支吊架下调',
  pipe_move: '管道平移',
  insulation_adjust: '保温厚度调整',
  other: '其他方式'
};
