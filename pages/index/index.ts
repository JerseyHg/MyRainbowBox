import { verifyInvitation, autoLogin } from '../../services/api'

Page({
  data: {
    code: '',
    loading: false,
    autoLogging: true,
    // 上线前设为 false
    devMode: false,
  },

  onLoad(options: any) {
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

    if (options && options.from === 'logout') {
      this.setData({ autoLogging: false })
      return
    }

    this._tryAutoLogin()
  },

  async _tryAutoLogin() {
    this.setData({ autoLogging: true })

    try {
      const wxCode = await this._getWxLoginCode()
      const result = await autoLogin(wxCode)

      if (result.success && result.openid) {
        const app = getApp<IAppOption>()
        app.saveLogin(result.openid, result.has_profile)

        if (result.has_profile) {
          wx.redirectTo({ url: '/pages/status/status' })
        } else {
          wx.redirectTo({ url: '/pages/profile/profile' })
        }
        return
      }
    } catch (err) {
      console.log('[Index] 非老用户，需要邀请码')
    }

    this.setData({ autoLogging: false })
  },

  onInput(e: any) {
    var val = e.detail.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    this.setData({ code: val })
  },

  async onSubmit() {
    if (this.data.code.length < 6) {
      wx.showToast({ title: '请输入完整的6位邀请码', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    wx.showLoading({ title: '验证中...' })

    try {
      const wxCode = await this._getWxLoginCode()
      const result = await verifyInvitation(this.data.code, wxCode)

      wx.hideLoading()

      if (result.success && result.openid) {
        const app = getApp<IAppOption>()
        app.saveLogin(result.openid, result.has_profile)

        wx.showToast({ title: '验证成功', icon: 'success' })

        setTimeout(() => {
          if (result.has_profile) {
            wx.redirectTo({ url: '/pages/status/status' })
          } else {
            wx.redirectTo({ url: '/pages/profile/profile' })
          }
        }, 1000)
      } else {
        wx.showToast({ title: result.message || '验证失败', icon: 'none' })
      }
    } catch (err: any) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '验证失败', icon: 'none' })
    }

    this.setData({ loading: false })
  },

  async onRelogin() {
    this.setData({ loading: true })
    wx.showLoading({ title: '登录中...' })

    try {
      const wxCode = await this._getWxLoginCode()
      const result = await autoLogin(wxCode)

      wx.hideLoading()

      if (result.success && result.openid) {
        const app = getApp<IAppOption>()
        app.saveLogin(result.openid, result.has_profile)

        wx.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          if (result.has_profile) {
            wx.redirectTo({ url: '/pages/status/status' })
          } else {
            wx.redirectTo({ url: '/pages/profile/profile' })
          }
        }, 1000)
      } else {
        wx.showToast({ title: '未找到登记记录，请先使用邀请码登记', icon: 'none' })
      }
    } catch (err: any) {
      wx.hideLoading()
      wx.showToast({ title: '未找到登记记录', icon: 'none' })
    }

    this.setData({ loading: false })
  },

  onDevSkip() {
    const app = getApp<IAppOption>()
    app.saveLogin('dev_openid_123', false)
    wx.redirectTo({ url: '/pages/profile/profile' })
  },

  /** 跳转隐私协议 */
  goPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' })
  },

  _getWxLoginCode(): Promise<string> {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => res.code ? resolve(res.code) : reject(new Error('微信登录失败')),
        fail: (err) => reject(new Error(err.errMsg || '微信登录失败')),
      })
    })
  },

  onShareAppMessage() {
    return {
      title: '送你一个邀请码，来登记个人信息吧',
      path: '/pages/index/index',
    }
  },
})
