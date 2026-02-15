import { verifyInvitation, autoLogin } from '../../services/api'

Page({
  data: {
    code: '',
    loading: false,
    autoLogging: true,
    devMode: false,
  },

  onLoad(options: any) {
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

  async _tryAutoLogin() {
    this.setData({ autoLogging: true })

    try {
      const wxCode = await this._getWxLoginCode()
      const result = await autoLogin(wxCode)

      if (result.success && result.openid) {
        const app = getApp<IAppOption>()
        app.saveLogin(result.openid, result.has_profile)
        this._checkPrivacyThenNavigate(result.has_profile)
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
      this.setData({ loading: false })

      if (result.success && result.openid) {
        const app = getApp<IAppOption>()
        app.saveLogin(result.openid, result.has_profile)

        // 验证成功 → 检查隐私协议（直接跳页面，不弹 modal）
        this._checkPrivacyThenNavigate(result.has_profile)
      } else {
        wx.showToast({ title: result.message || '验证失败', icon: 'none' })
      }
    } catch (err: any) {
      wx.hideLoading()
      this.setData({ loading: false })
      wx.showToast({ title: err.message || '验证失败', icon: 'none' })
    }
  },

  async onRelogin() {
    this.setData({ loading: true })
    wx.showLoading({ title: '登录中...' })

    try {
      const wxCode = await this._getWxLoginCode()
      const result = await autoLogin(wxCode)

      wx.hideLoading()
      this.setData({ loading: false })

      if (result.success && result.openid) {
        const app = getApp<IAppOption>()
        app.saveLogin(result.openid, result.has_profile)
        this._checkPrivacyThenNavigate(result.has_profile)
      } else {
        wx.showToast({ title: '未找到登记记录，请先使用邀请码登记', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      this.setData({ loading: false })
      wx.showToast({ title: '未找到登记记录', icon: 'none' })
    }
  },

  /**
   * 隐私协议检查
   * 已同意 → 直接跳转目标页
   * 未同意 → 跳转到隐私协议页面
   */
  _checkPrivacyThenNavigate(hasProfile: boolean) {
    const agreed = wx.getStorageSync('privacyAgreed')
    const target = hasProfile ? 'status' : 'profile'

    if (agreed) {
      this._navigateByProfile(hasProfile)
    } else {
      wx.redirectTo({ url: '/pages/privacy/privacy?from=login&target=' + target })
    }
  },

  _navigateByProfile(hasProfile: boolean) {
    if (hasProfile) {
      wx.redirectTo({ url: '/pages/status/status' })
    } else {
      wx.redirectTo({ url: '/pages/profile/profile' })
    }
  },

  _getWxLoginCode(): Promise<string> {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) resolve(res.code)
          else reject(new Error('微信登录失败'))
        },
        fail: () => reject(new Error('微信登录失败'))
      })
    })
  },

  onDevSkip() {
    const app = getApp<IAppOption>()
    app.saveLogin('dev_openid_123', false)
    wx.setStorageSync('privacyAgreed', true)
    wx.redirectTo({ url: '/pages/profile/profile' })
  },

  goPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' })
  },

  onShareAppMessage() {
    return {
      title: '送你一个TB报名邀请码！',
      path: '/pages/index/index',
    }
  },
})
