import { verifyInvitation } from '../../services/api'

Page({
  data: {
    code: '',
    loading: false,
    // 开发模式开关：上线前设为 false
    devMode: true,
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
      // 1. 获取微信登录 code
      const wxCode = await this._getWxLoginCode()

      // 2. 调用后端验证接口
      const result = await verifyInvitation(this.data.code, wxCode)

      wx.hideLoading()

      if (result.success && result.openid) {
        // 3. 保存登录态
        const app = getApp<IAppOption>()
        app.saveLogin(result.openid, result.has_profile)

        wx.showToast({ title: '验证成功', icon: 'success' })

        setTimeout(() => {
          if (result.has_profile) {
            // 已有资料 → 跳到状态页（暂时先跳profile）
            wx.redirectTo({ url: '/pages/profile/profile?mode=view' })
          } else {
            // 新用户 → 填写资料
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

  /** 开发模式：跳过验证 */
  onDevSkip() {
    const app = getApp<IAppOption>()
    app.saveLogin('dev_openid_123', false)
    wx.showToast({ title: '已跳过', icon: 'success' })
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/profile/profile' })
    }, 500)
  },

  /** 获取微信登录 code */
  _getWxLoginCode(): Promise<string> {
    return new Promise((resolve, reject) => {
      wx.login({
        success(res) {
          if (res.code) {
            resolve(res.code)
          } else {
            reject(new Error('微信登录失败'))
          }
        },
        fail() {
          reject(new Error('微信登录失败'))
        },
      })
    })
  },

  onLoad() {
    // 如果已登录，直接跳转
    var openid = wx.getStorageSync('openid')
    if (openid) {
      wx.redirectTo({ url: '/pages/profile/profile' })
    }
  },
})
