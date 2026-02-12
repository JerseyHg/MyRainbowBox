/**
 * 小程序入口
 * 彩虹注册
 */
App({
  globalData: {
    openid: '',
    hasProfile: false,
    // TODO: 部署时替换为实际域名
    baseUrl: 'http://111.229.254.50:8000/api/v1',

    // ⬇️ Mock 模式：设为 true 则无需后端，使用本地模拟数据
    // ⬇️ 上线前务必改为 false
    mockMode: true,
  },

  onLaunch() {
    const openid = wx.getStorageSync('openid') || ''
    const hasProfile = wx.getStorageSync('hasProfile') || false
    this.globalData.openid = openid
    this.globalData.hasProfile = hasProfile

    if ((this.globalData as any).mockMode) {
      console.log('[App] ⚠️ Mock 模式已开启，所有接口使用模拟数据')
      console.log('[App] 💡 可用邀请码: ABC123, TEST01, DEMO88, RAIN66, MOCK01, MOCK02')
    }

    console.log('[App] onLaunch, openid:', openid ? openid.substring(0, 10) + '...' : '(无)')
  },

  saveLogin(openid: string, hasProfile: boolean) {
    this.globalData.openid = openid
    this.globalData.hasProfile = hasProfile
    wx.setStorageSync('openid', openid)
    wx.setStorageSync('hasProfile', hasProfile)
  },

  clearLogin() {
    this.globalData.openid = ''
    this.globalData.hasProfile = false
    wx.removeStorageSync('openid')
    wx.removeStorageSync('hasProfile')
  },
})
