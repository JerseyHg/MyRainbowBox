Page({
  data: {
    fromLogin: false,
  },

  onLoad: function (options) {
    if (options && options.from === 'login') {
      this.setData({ fromLogin: true })
    }
  },

  /** 用户点击"我已阅读并同意" */
  onAgree: function () {
    wx.setStorageSync('privacyAgreed', true)
    var pendingNav = wx.getStorageSync('_pendingNavigate')
    wx.removeStorageSync('_pendingNavigate')

    if (pendingNav === 'status') {
      wx.redirectTo({ url: '/pages/status/status' })
    } else if (pendingNav === 'profile') {
      wx.redirectTo({ url: '/pages/profile/profile' })
    } else {
      // 非登录流程进来的，直接返回上一页
      wx.navigateBack()
    }
  },

  /** 用户点击"不同意" → 返回首页 */
  onDisagree: function () {
    wx.removeStorageSync('_pendingNavigate')
    var app = getApp()
    app.clearLogin()
    wx.reLaunch({ url: '/pages/index/index?from=logout' })
  },
})
