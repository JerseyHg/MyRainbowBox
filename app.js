/**
 * 小程序入口
 * 彩虹注册
 */
App({
  globalData: {
    openid: '',
    hasProfile: false,
    // TODO: 部署前替换为实际域名
    baseUrl: 'https://your-domain.com/api/v1',
  },

  onLaunch: function () {
    var openid = wx.getStorageSync('openid') || ''
    var hasProfile = wx.getStorageSync('hasProfile') || false
    this.globalData.openid = openid
    this.globalData.hasProfile = hasProfile
    console.log('[App] onLaunch, openid:', openid ? openid.substring(0, 10) + '...' : '(无)')
  },

  /** 保存登录态 */
  saveLogin: function (openid, hasProfile) {
    this.globalData.openid = openid
    this.globalData.hasProfile = hasProfile
    wx.setStorageSync('openid', openid)
    wx.setStorageSync('hasProfile', hasProfile)
  },

  /** 清除登录态 */
  clearLogin: function () {
    this.globalData.openid = ''
    this.globalData.hasProfile = false
    wx.removeStorageSync('openid')
    wx.removeStorageSync('hasProfile')
  },
})
