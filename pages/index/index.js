var api = require('../../services/api')

Page({
  data: {
    code: '',
    loading: false,
    autoLogging: true,
    devMode: false,
  },

  onLoad: function (options) {
    if (options && options.code) {
      this.setData({ code: options.code.toUpperCase().slice(0, 6) })
    }

    var openid = wx.getStorageSync('openid')
    if (openid) {
      var hasProfile = wx.getStorageSync('hasProfile')
      this._checkPrivacyThenNavigate(hasProfile)
      return
    }

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
            that._checkPrivacyThenNavigate(result.has_profile)
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
          that.setData({ loading: false })

          if (result.success && result.openid) {
            var app = getApp()
            app.saveLogin(result.openid, result.has_profile)

            // 验证成功 → 检查隐私协议（直接跳页面，不弹 modal）
            that._checkPrivacyThenNavigate(result.has_profile)
          } else {
            wx.showToast({ title: result.message || '验证失败', icon: 'none' })
          }
        }).catch(function (err) {
          wx.hideLoading()
          that.setData({ loading: false })
          wx.showToast({ title: err.message || '验证失败', icon: 'none' })
        })
      },
      fail: function () {
        wx.hideLoading()
        that.setData({ loading: false })
        wx.showToast({ title: '微信登录失败', icon: 'none' })
      }
    })
  },

  onRelogin: function () {
    var that = this
    that.setData({ loading: true })
    wx.showLoading({ title: '登录中...' })

    wx.login({
      success: function (loginRes) {
        if (!loginRes.code) {
          wx.hideLoading()
          that.setData({ loading: false })
          return
        }

        api.autoLogin(loginRes.code).then(function (result) {
          wx.hideLoading()
          that.setData({ loading: false })

          if (result.success && result.openid) {
            var app = getApp()
            app.saveLogin(result.openid, result.has_profile)
            that._checkPrivacyThenNavigate(result.has_profile)
          } else {
            wx.showToast({ title: '未找到登记记录，请先使用邀请码登记', icon: 'none' })
          }
        }).catch(function () {
          wx.hideLoading()
          that.setData({ loading: false })
          wx.showToast({ title: '未找到登记记录', icon: 'none' })
        })
      }
    })
  },

  /**
   * 隐私协议检查
   * 已同意 → 直接跳转目标页
   * 未同意 → 跳转到隐私协议页面（用户在那里点同意后再跳转）
   */
  _checkPrivacyThenNavigate: function (hasProfile) {
    var agreed = wx.getStorageSync('privacyAgreed')
    var target = hasProfile ? 'status' : 'profile'

    if (agreed) {
      this._navigateByProfile(hasProfile)
    } else {
      wx.redirectTo({ url: '/pages/privacy/privacy?from=login&target=' + target })
    }
  },

  _navigateByProfile: function (hasProfile) {
    if (hasProfile) {
      wx.redirectTo({ url: '/pages/status/status' })
    } else {
      wx.redirectTo({ url: '/pages/profile/profile' })
    }
  },

  onDevSkip: function () {
    var app = getApp()
    app.saveLogin('dev_openid_123', false)
    wx.setStorageSync('privacyAgreed', true)
    wx.redirectTo({ url: '/pages/profile/profile' })
  },

  goPrivacy: function () {
    wx.navigateTo({ url: '/pages/privacy/privacy' })
  },

  onShareAppMessage: function () {
    return {
      title: '送你一个邀请码，来登记个人信息吧',
      path: '/pages/index/index',
    }
  },
})
