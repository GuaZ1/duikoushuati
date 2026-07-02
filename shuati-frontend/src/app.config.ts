export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/bank/index',
    'pages/mine/index',
    'pages/question/index',
    'pages/result/index',
    'pages/wrongbook/index',
    'pages/teacher/question/index',
    'pages/teacher/question/form',
    'pages/login/index',
    'pages/privacy/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '刷题小助手',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    custom: true,
    color: '#86909C',
    selectedColor: '#2563EB',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/home/index', text: '首页' },
      { pagePath: 'pages/teacher/question/index', text: '教师' },
      { pagePath: 'pages/mine/index', text: '我的' }
    ]
  }
})
