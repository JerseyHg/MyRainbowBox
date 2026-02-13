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

  async _tryAutoLogin() {
    this.setData({ autoLogging: true })

    try {
      const wxCode = await this._getWxLoginCode()
      const result = await autoLogin(wxCode)

      if (result.success && result.openid) {
        const app = getApp<IAppOption>()
        app.saveLogin(result.openid, result.has_profile)

        // 自动登录成功后也要检查隐私协议
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

      if (result.success && result.openid) {
        const app = getApp<IAppOption>()
        app.saveLogin(result.openid, result.has_profile)

        wx.showToast({ title: '验证成功', icon: 'success' })

        setTimeout(() => {
          // 验证成功后检查隐私协议
          this._checkPrivacyThenNavigate(result.has_profile)
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
          // 重新登录后也要检查隐私协议
          this._checkPrivacyThenNavigate(result.has_profile)
        }, 1000)
      } else {
        wx.showToast({ title: '未找到登记记录，请先使用邀请码登记', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '未找到登记记录', icon: 'none' })
    }

    this.setData({ loading: false })
  },

  /**
   * 隐私协议检查 → 通过后跳转
   */
  _checkPrivacyThenNavigate(hasProfile: boolean) {
    const agreed = wx.getStorageSync('privacyAgreed')
    if (agreed) {
      this._navigateByProfile(hasProfile)
      return
    }

    wx.showModal({
      title: '用户隐私保护指引',
      content: '在使用本小程序前，请您阅读并同意《用户隐私保护指引》。我们将收集您的个人信息用于报名审核服务，详情请查看完整隐私指引。',
      confirmText: '同意并继续',
      cancelText: '查看详情',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('privacyAgreed', true)
          this._navigateByProfile(hasProfile)
        } else {
          wx.setStorageSync('_pendingNavigate', hasProfile ? 'status' : 'profile')
          wx.navigateTo({ url: '/pages/privacy/privacy?from=login' })
        }
      }
    })
  },

  /** 根据是否有资料跳转到对应页面 */
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
          if (res.code) {
            resolve(res.code)
          } else {
            reject(new Error('微信登录失败'))
          }
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
      title: '送你一个邀请码，来登记个人信息吧',
      path: '/pages/index/index',
    }
  },
})
