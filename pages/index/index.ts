Page({
  data: {
    code: '',
    loading: false,
    devMode: true
  },

  onInput(e: any) {
    var val = e.detail.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    this.setData({ code: val })
  },

  onSubmit() {
    if (this.data.code.length < 6) {
      wx.showToast({ title: '请输入完整的6位邀请码', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    wx.showLoading({ title: '验证中...' })

    // TODO: 对接后端验证
    setTimeout(() => {
      wx.hideLoading()
      this.setData({ loading: false })
      wx.showToast({ title: '验证成功', icon: 'success' })
      setTimeout(() => {
        wx.setStorageSync('openid', 'dev_openid_123')
        wx.navigateTo({ url: '/pages/profile/profile' })
      }, 800)
    }, 1000)
  },

  onDevSkip() {
    wx.setStorageSync('openid', 'dev_openid_123')
    wx.showToast({ title: '已跳过', icon: 'success' })
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/profile/profile' })
    }, 500)
  },

  onLoad() {
    var openid = wx.getStorageSync('openid')
    if (openid) {
      wx.redirectTo({ url: '/pages/profile/profile' })
    }
  }
})
