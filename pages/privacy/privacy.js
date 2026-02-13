Page({
  data: {
    fromLogin: false,
    target: '',  // 'profile' 或 'status'
  },

  onLoad: function (options) {
    if (options && options.from === 'login') {
      this.setData({
        fromLogin: true,
        target: options.target || 'profile',
      })
    }
  },

  /** 用户点击"我已阅读并同意" */
  onAgree: function () {
    wx.setStorageSync('privacyAgreed', true)

    var target = this.data.target
    if (target === 'status') {
      wx.redirectTo({ url: '/pages/status/status' })
    } else {
      wx.redirectTo({ url: '/pages/profile/profile' })
    }
  },

  /** 用户点击"不同意" → 清除登录态，回首页 */
  onDisagree: function () {
    var app = getApp()
    app.clearLogin()
    wx.reLaunch({ url: '/pages/index/index?from=logout' })
  },
})
