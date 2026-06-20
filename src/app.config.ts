export default defineAppConfig({
  pages: [
    'pages/photo-mark/index',
    'pages/elevation/index',
    'pages/rectification/index',
    'pages/project-select/index',
    'pages/issue-detail/index',
    'pages/rectify-submit/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#165DFF',
    navigationBarTitleText: '机电管综复核助手',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F6F7'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#165DFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/photo-mark/index',
        text: '拍照标注'
      },
      {
        pagePath: 'pages/elevation/index',
        text: '标高核对'
      },
      {
        pagePath: 'pages/rectification/index',
        text: '整改跟进'
      }
    ]
  }
})
