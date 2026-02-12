var api = require('../../services/api')

Page({
  data: {
    code: '',
    loading: false,
    autoLogging: true,
    devMode: true,
  },

  onLoad: function (options) {
    if (options && options.code) {
      this.setData({ code: options.code.toUpperCase().slice(0, 6) })
    }

    var openid = wx.getStorageSync('openid')
    if (openid) {
      var hasProfile = wx.getStorageSync('hasProfile')
      if (hasProfile) {
        wx.redirectTo({ url: '/pages/status/status' })
      } else {
        wx.redirectTo({ url: '/pages/profile/profile' })
      }
      return
    }

    // 退出登录过来的，不自动跳，让用户选择
    if (options && options.from === 'logout') {
      this.setData({ autoLogging: false })
      return
    }

    this._tryAutoLogin()
  },

  _tryAutoLogin: function () {
    var that = this
    that.setData({ autoLogging: true })

    wx.login({
      success: function (loginRes) {
        if (!loginRes.code) {
          that.setData({ autoLogging: false })
          return
        }

        api.autoLogin(loginRes.code).then(function (result) {
          if (result.success && result.openid) {
            var app = getApp()
            app.saveLogin(result.openid, result.has_profile)

            if (result.has_profile) {
              wx.redirectTo({ url: '/pages/status/status' })
            } else {
              wx.redirectTo({ url: '/pages/profile/profile' })
            }
          } else {
            that.setData({ autoLogging: false })
          }
        }).catch(function () {
          console.log('[Index] 非老用户，需要邀请码')
          that.setData({ autoLogging: false })
        })
      },
      fail: function () {
        that.setData({ autoLogging: false })
      }
    })
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

    wx.login({
      success: function (loginRes) {
        if (!loginRes.code) {
          wx.hideLoading()
          that.setData({ loading: false })
          wx.showToast({ title: '微信登录失败', icon: 'none' })
          return
        }

        api.verifyInvitation(that.data.code, loginRes.code).then(function (result) {
          wx.hideLoading()

          if (result.success && result.openid) {
            var app = getApp()
            app.saveLogin(result.openid, result.has_profile)

            wx.showToast({ title: '验证成功', icon: 'success' })

            setTimeout(function () {
              if (result.has_profile) {
                wx.redirectTo({ url: '/pages/status/status' })
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

  /** 已注册用户直接登录 */
  onRelogin: function () {
    var that = this
    that.setData({ loading: true, autoLogging: true })
    wx.showLoading({ title: '登录中...' })

    this._tryAutoLogin()
  },

  onDevSkip: function () {
    var app = getApp()
    app.saveLogin('dev_openid_123', false)
    wx.showToast({ title: '已跳过', icon: 'success' })
    setTimeout(function () {
      wx.redirectTo({ url: '/pages/profile/profile' })
    }, 500)
  },
})
