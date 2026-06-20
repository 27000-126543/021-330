import { Issue, ElevationRecord } from '@/types';

export const mockIssues: Issue[] = [
  {
    id: 'i001',
    projectId: 'p001',
    projectName: '万达广场机电安装工程',
    axisPosition: 'B2层 A轴/3轴 交叉口',
    type: 'duct',
    category: 'deviation',
    description: '风管与设计位置偏位约150mm，与桥架碰撞',
    status: 'pending',
    designElevation: -3.2,
    measuredElevation: -3.05,
    allowableDeviation: 20,
    deviation: 150,
    isQualified: false,
    images: ['https://picsum.photos/id/1033/600/800'],
    marks: [[]],
    rectifyImages: [],
    records: [
      {
        id: 'r001',
        time: '2024-06-18 09:30',
        operator: '张工（施工员）',
        role: 'worker',
        action: '提交问题',
        description: '现场巡查发现风管偏位，已拍照记录',
        images: []
      }
    ],
    creator: '张工',
    createTime: '2024-06-18 09:30',
    updateTime: '2024-06-18 09:30'
  },
  {
    id: 'i002',
    projectId: 'p001',
    projectName: '万达广场机电安装工程',
    axisPosition: 'B2层 C轴/5轴 东侧',
    type: 'bridge',
    category: 'close_beam',
    description: '桥架贴梁过近，检修空间不足',
    status: 'processing',
    images: ['https://picsum.photos/id/1034/600/800'],
    marks: [[]],
    rectifyImages: ['https://picsum.photos/id/1035/600/800'],
    rectifyMethod: 'hanger_adjust',
    rectifyDescription: '支吊架下调50mm，增加检修空间',
    records: [
      {
        id: 'r002',
        time: '2024-06-17 14:20',
        operator: '李工（施工员）',
        role: 'worker',
        action: '提交问题',
        description: '桥架贴梁太近，无法检修',
        images: []
      },
      {
        id: 'r003',
        time: '2024-06-19 10:15',
        operator: '王班组（水电分包）',
        role: 'worker',
        action: '提交整改',
        description: '已调整支吊架高度，增加检修空间',
        images: ['https://picsum.photos/id/1035/600/800'],
        method: 'hanger_adjust'
      }
    ],
    creator: '李工',
    createTime: '2024-06-17 14:20',
    updateTime: '2024-06-19 10:15'
  },
  {
    id: 'i003',
    projectId: 'p002',
    projectName: '中心医院新建住院楼',
    axisPosition: '设备层 12轴 泵房附近',
    type: 'sprinkler',
    category: 'elevation',
    description: '喷淋管标高偏差超标',
    status: 'done',
    designElevation: 4.5,
    measuredElevation: 4.55,
    allowableDeviation: 20,
    deviation: 50,
    isQualified: false,
    images: ['https://picsum.photos/id/1036/600/800'],
    marks: [[]],
    rectifyImages: ['https://picsum.photos/id/1037/600/800'],
    rectifyMethod: 'pipe_move',
    rectifyDescription: '调整喷淋支管高度至设计标高',
    records: [
      {
        id: 'r004',
        time: '2024-06-15 08:45',
        operator: '赵工（施工员）',
        role: 'worker',
        action: '提交问题',
        description: '喷淋管标高偏差50mm，超出允许范围',
        images: []
      },
      {
        id: 'r005',
        time: '2024-06-16 16:30',
        operator: '陈班组（消防分包）',
        role: 'worker',
        action: '提交整改',
        description: '已按设计标高调整完毕',
        images: ['https://picsum.photos/id/1037/600/800'],
        method: 'pipe_move'
      },
      {
        id: 'r006',
        time: '2024-06-17 09:00',
        operator: '刘工（质检员）',
        role: 'inspector',
        action: '复查通过',
        description: '标高已调整到位，符合设计要求',
        images: [],
        result: 'pass'
      }
    ],
    creator: '赵工',
    createTime: '2024-06-15 08:45',
    updateTime: '2024-06-17 09:00'
  },
  {
    id: 'i004',
    projectId: 'p002',
    projectName: '中心医院新建住院楼',
    axisPosition: '走廊吊顶 3层 8-10轴',
    type: 'duct',
    category: 'insufficient_space',
    description: '风管与水管间距不足，检修空间不够',
    status: 'rejected',
    images: ['https://picsum.photos/id/1038/600/800'],
    marks: [[]],
    rectifyImages: ['https://picsum.photos/id/1039/600/800'],
    rectifyMethod: 'other',
    rectifyDescription: '已调整风管位置',
    records: [
      {
        id: 'r007',
        time: '2024-06-14 11:00',
        operator: '孙工（施工员）',
        role: 'worker',
        action: '提交问题',
        description: '走廊吊顶内风管与水管间距太小',
        images: []
      },
      {
        id: 'r008',
        time: '2024-06-18 15:20',
        operator: '周班组（通风分包）',
        role: 'worker',
        action: '提交整改',
        description: '风管已平移30mm',
        images: ['https://picsum.photos/id/1039/600/800'],
        method: 'pipe_move'
      },
      {
        id: 'r009',
        time: '2024-06-19 08:30',
        operator: '刘工（质检员）',
        role: 'inspector',
        action: '复查退回',
        description: '检修空间仍然不足，需重新调整',
        images: [],
        result: 'reject'
      }
    ],
    creator: '孙工',
    createTime: '2024-06-14 11:00',
    updateTime: '2024-06-19 08:30'
  },
  {
    id: 'i005',
    projectId: 'p003',
    projectName: '科技园研发中心',
    axisPosition: '4层 走廊 A轴 12-15轴',
    type: 'bridge',
    category: 'other',
    description: '桥架支吊架间距超标，需设计确认是否可以调整',
    status: 'design',
    images: ['https://picsum.photos/id/1040/600/800'],
    marks: [[]],
    rectifyImages: [],
    records: [
      {
        id: 'r010',
        time: '2024-06-16 13:45',
        operator: '吴工（施工员）',
        role: 'worker',
        action: '提交问题',
        description: '现场条件限制，支吊架间距超标，需设计确认',
        images: []
      },
      {
        id: 'r011',
        time: '2024-06-18 10:00',
        operator: '郑工（质检员）',
        role: 'inspector',
        action: '提交设计确认',
        description: '已提交设计院确认处理方案',
        images: [],
        result: 'design'
      }
    ],
    creator: '吴工',
    createTime: '2024-06-16 13:45',
    updateTime: '2024-06-18 10:00'
  },
  {
    id: 'i006',
    projectId: 'p001',
    projectName: '万达广场机电安装工程',
    axisPosition: 'B3层 D轴/7轴 西侧',
    type: 'sprinkler',
    category: 'deviation',
    description: '喷淋主管偏位，与风管交叉',
    status: 'pending',
    images: ['https://picsum.photos/id/1041/600/800'],
    marks: [[]],
    rectifyImages: [],
    records: [
      {
        id: 'r012',
        time: '2024-06-19 11:20',
        operator: '张工（施工员）',
        role: 'worker',
        action: '提交问题',
        description: '喷淋主管偏位，与风管干涉',
        images: []
      }
    ],
    creator: '张工',
    createTime: '2024-06-19 11:20',
    updateTime: '2024-06-19 11:20'
  },
  {
    id: 'i007',
    projectId: 'p004',
    projectName: '地铁枢纽站商业综合体',
    axisPosition: 'B2层 5号通道 9-12轴',
    type: 'duct',
    category: 'close_beam',
    description: '排烟管贴梁底安装，保温层厚度不足',
    status: 'processing',
    images: ['https://picsum.photos/id/1042/600/800'],
    marks: [[]],
    rectifyImages: ['https://picsum.photos/id/1043/600/800'],
    rectifyMethod: 'insulation_adjust',
    rectifyDescription: '已调整保温层厚度至设计要求',
    records: [
      {
        id: 'r013',
        time: '2024-06-13 16:00',
        operator: '钱工（施工员）',
        role: 'worker',
        action: '提交问题',
        description: '排烟管保温厚度不符合设计要求',
        images: []
      },
      {
        id: 'r014',
        time: '2024-06-20 09:45',
        operator: '马班组（通风分包）',
        role: 'worker',
        action: '提交整改',
        description: '保温层已按设计要求加厚',
        images: ['https://picsum.photos/id/1043/600/800'],
        method: 'insulation_adjust'
      }
    ],
    creator: '钱工',
    createTime: '2024-06-13 16:00',
    updateTime: '2024-06-20 09:45'
  }
];

export const mockElevationRecords: ElevationRecord[] = [
  {
    id: 'e001',
    projectId: 'p001',
    projectName: '万达广场机电安装工程',
    axisPosition: 'B2层 A轴/3轴 交叉口',
    type: 'duct',
    designElevation: -3.2,
    measuredElevation: -3.05,
    allowableDeviation: 20,
    deviation: 150,
    isQualified: false,
    remark: '风管偏低150mm，需调整',
    createTime: '2024-06-18 09:30',
    images: []
  },
  {
    id: 'e002',
    projectId: 'p001',
    projectName: '万达广场机电安装工程',
    axisPosition: 'B2层 B轴/4轴 南侧',
    type: 'bridge',
    designElevation: -2.8,
    measuredElevation: -2.79,
    allowableDeviation: 20,
    deviation: 10,
    isQualified: true,
    remark: '符合要求',
    createTime: '2024-06-18 09:45',
    images: []
  },
  {
    id: 'e003',
    projectId: 'p002',
    projectName: '中心医院新建住院楼',
    axisPosition: '设备层 8轴 东侧',
    type: 'sprinkler',
    designElevation: 4.5,
    measuredElevation: 4.55,
    allowableDeviation: 20,
    deviation: 50,
    isQualified: false,
    remark: '喷淋管偏高50mm',
    createTime: '2024-06-15 08:45',
    images: []
  },
  {
    id: 'e004',
    projectId: 'p002',
    projectName: '中心医院新建住院楼',
    axisPosition: '设备层 10轴 西侧',
    type: 'duct',
    designElevation: 4.2,
    measuredElevation: 4.19,
    allowableDeviation: 20,
    deviation: 10,
    isQualified: true,
    remark: '偏差在允许范围内',
    createTime: '2024-06-15 09:10',
    images: []
  },
  {
    id: 'e005',
    projectId: 'p003',
    projectName: '科技园研发中心',
    axisPosition: '4层 走廊 7轴',
    type: 'bridge',
    designElevation: 3.8,
    measuredElevation: 3.77,
    allowableDeviation: 20,
    deviation: 30,
    isQualified: false,
    remark: '桥架偏低30mm',
    createTime: '2024-06-16 13:45',
    images: []
  }
];
