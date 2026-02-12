import { getMyCodes } from '../../services/api'

Page({
  data: {
    loading: true,
    codes: [] as Array<{ code: string; is_used: boolean; created_at: string }>,
    total: 0,
    used: 0,
    remaining: 0,
    copiedCode: '',  // 刚刚复制的邀请码（高亮提示用）
  },

  onLoad() {
    this._loadCodes()
  },

  onPullDownRefresh() {
    this._loadCodes().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  async _loadCodes() {
    this.setData({ loading: true })

    try {
      const result = await getMyCodes()

      if (result.success && result.data) {
        this.setData({
          loading: false,
          codes: result.data.codes || [],
          total: result.data.total || 0,
          used: result.data.used || 0,
          remaining: result.data.remaining || 0,
        })
      } else {
        this.setData({ loading: false })
        wx.showToast({ title: result.message || '加载失败', icon: 'none' })
      }
    } catch (err: any) {
      this.setData({ loading: false })
      console.error('[Codes] 加载失败:', err)
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  /** 复制邀请码 */
  copyCode(e: any) {
    const code = e.currentTarget.dataset.code
    const that = this

    wx.setClipboardData({
      data: code,
      success() {
        that.setData({ copiedCode: code })
        wx.showToast({ title: '已复制', icon: 'success' })

        // 2秒后取消高亮
        setTimeout(() => {
          that.setData({ copiedCode: '' })
        }, 2000)
      }
    })
  },

  /** 分享邀请码（转发给好友） */
  onShareAppMessage() {
    // 找到第一个未使用的邀请码
    const availableCode = this.data.codes.find((c: any) => !c.is_used)

    if (availableCode) {
      return {
        title: '🌈 我在彩虹注册等你，送你一个邀请码',
        path: `/pages/index/index?code=${availableCode.code}`,
      }
    }

    return {
      title: '🌈 彩虹注册 - 遇见真实的你',
      path: '/pages/index/index',
    }
  },

  /** 返回状态页 */
  goBack() {
    wx.navigateBack()
  },
})
