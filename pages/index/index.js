var api = require('../../services/api')

Page({
  data: {
    code: '',
    loading: false,
    devMode: true,
  },

  onInput: function (e) {
    var val = e.detail.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    this.setData({ code: val })
  },

  onSubmit: function () {
    if (this.data.code.length < 6) {
      wx.showToast({ title: '请输入完整的6位邀请码', icon: 'none' })
      return
    }

    var that = this
    that.setData({ loading: true })
    wx.showLoading({ title: '验证中...' })

    // 1. 获取微信登录 code
    wx.login({
      success: function (loginRes) {
        if (!loginRes.code) {
          wx.hideLoading()
          that.setData({ loading: false })
          wx.showToast({ title: '微信登录失败', icon: 'none' })
          return
        }

        // 2. 调用后端验证接口
        api.verifyInvitation(that.data.code, loginRes.code).then(function (result) {
          wx.hideLoading()

          if (result.success && result.openid) {
            // 3. 保存登录态
            var app = getApp()
            app.saveLogin(result.openid, result.has_profile)

            wx.showToast({ title: '验证成功', icon: 'success' })

            setTimeout(function () {
              if (result.has_profile) {
                wx.redirectTo({ url: '/pages/profile/profile?mode=view' })
              } else {
                wx.redirectTo({ url: '/pages/profile/profile' })
              }
            }, 800)
          } else {
            wx.showToast({ title: result.message || '验证失败', icon: 'none' })
          }
        }).catch(function (err) {
          wx.hideLoading()
          console.error('[Index] 验证失败:', err)
          wx.showToast({ title: err.message || '验证失败，请重试', icon: 'none' })
        }).finally(function () {
          that.setData({ loading: false })
        })
      },
      fail: function () {
        wx.hideLoading()
        that.setData({ loading: false })
        wx.showToast({ title: '微信登录失败', icon: 'none' })
      }
    })
  },

  onDevSkip: function () {
    var app = getApp()
    app.saveLogin('dev_openid_123', false)
    wx.showToast({ title: '已跳过', icon: 'success' })
    setTimeout(function () {
      wx.redirectTo({ url: '/pages/profile/profile' })
    }, 500)
  },

  onLoad: function () {
    var openid = wx.getStorageSync('openid')
    if (openid) {
      wx.redirectTo({ url: '/pages/profile/profile' })
    }
  },
})
