import { verifyInvitation, autoLogin } from '../../services/api'

Page({
  data: {
    code: '',
    loading: false,
    autoLogging: true,  // 自动登录检测中
    // 开发模式开关：上线前设为 false
    devMode: true,
  },

  onLoad(options: any) {
    // 从分享链接自动填入邀请码
    if (options && options.code) {
      this.setData({ code: options.code.toUpperCase().slice(0, 6) })
    }

    // 如果本地有 openid，直接跳转
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

    // 尝试自动登录（微信静默登录，检测是否老用户）
    this._tryAutoLogin()
  },

  /** 尝试自动登录 */
  async _tryAutoLogin() {
    this.setData({ autoLogging: true })

    try {
      const wxCode = await this._getWxLoginCode()
      const result = await autoLogin(wxCode)

      if (result.success && result.openid) {
        // 老用户，自动登录成功
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
      // 不是老用户，正常显示邀请码输入页
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
        }, 800)
      } else {
        wx.showToast({ title: result.message || '验证失败', icon: 'none' })
      }
    } catch (err: any) {
      wx.hideLoading()
      console.error('[Index] 验证失败:', err)
      wx.showToast({ title: err.message || '验证失败，请重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  /** 已注册用户直接登录 */
  onRelogin: function () {
    var that = this
    that.setData({ loading: true, autoLogging: true })
    wx.showLoading({ title: '登录中...' })

    this._tryAutoLogin()
  },

  /** 开发模式：跳过验证 */
  onDevSkip() {
    const app = getApp<IAppOption>()
    app.saveLogin('dev_openid_123', false)
    wx.showToast({ title: '已跳过', icon: 'success' })
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/profile/profile' })
    }, 500)
  },

  _getWxLoginCode(): Promise<string> {
    return new Promise((resolve, reject) => {
      wx.login({
        success(res) {
          if (res.code) resolve(res.code)
          else reject(new Error('微信登录失败'))
        },
        fail() { reject(new Error('微信登录失败')) },
      })
    })
  },
})
