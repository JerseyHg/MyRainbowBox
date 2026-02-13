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
      // 已登录用户也要检查隐私协议
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

            // 自动登录成功后也要检查隐私协议
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

          if (result.success && result.openid) {
            var app = getApp()
            app.saveLogin(result.openid, result.has_profile)

            wx.showToast({ title: '验证成功', icon: 'success' })
            setTimeout(function () {
              // 验证成功后检查隐私协议
              that._checkPrivacyThenNavigate(result.has_profile)
            }, 1000)
          } else {
            wx.showToast({ title: result.message || '验证失败', icon: 'none' })
          }
        }).catch(function (err) {
          wx.hideLoading()
          wx.showToast({ title: err.message || '验证失败', icon: 'none' })
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
          if (result.success && result.openid) {
            var app = getApp()
            app.saveLogin(result.openid, result.has_profile)
            wx.showToast({ title: '登录成功', icon: 'success' })
            setTimeout(function () {
              // 重新登录后也要检查隐私协议
              that._checkPrivacyThenNavigate(result.has_profile)
            }, 1000)
          } else {
            wx.showToast({ title: '未找到登记记录，请先使用邀请码登记', icon: 'none' })
          }
        }).catch(function () {
          wx.hideLoading()
          wx.showToast({ title: '未找到登记记录', icon: 'none' })
        }).finally(function () {
          that.setData({ loading: false })
        })
      }
    })
  },

  /**
   * 隐私协议检查 → 通过后跳转
   * 如果用户已同意过隐私协议，直接跳转
   * 否则弹出隐私协议弹窗
   */
  _checkPrivacyThenNavigate: function (hasProfile) {
    var agreed = wx.getStorageSync('privacyAgreed')
    if (agreed) {
      // 已同意过，直接跳转
      this._navigateByProfile(hasProfile)
      return
    }

    // 未同意，弹出隐私协议
    var that = this
    wx.showModal({
      title: '用户隐私保护指引',
      content: '在使用本小程序前，请您阅读并同意《用户隐私保护指引》。我们将收集您的个人信息用于报名审核服务，详情请查看完整隐私指引。',
      confirmText: '同意并继续',
      cancelText: '查看详情',
      success: function (res) {
        if (res.confirm) {
          // 用户直接同意
          wx.setStorageSync('privacyAgreed', true)
          that._navigateByProfile(hasProfile)
        } else {
          // 用户想查看详情 → 跳转到隐私页面
          wx.setStorageSync('_pendingNavigate', hasProfile ? 'status' : 'profile')
          wx.navigateTo({ url: '/pages/privacy/privacy?from=login' })
        }
      }
    })
  },

  /** 根据是否有资料跳转到对应页面 */
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
