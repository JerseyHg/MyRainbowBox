var api = require('../../services/api')

Page({
  data: {
    loading: true,
    hasProfile: false,

    serialNumber: '',
    status: '',
    rejectionReason: '',
    createTime: '',
    publishedAt: '',
    invitationQuota: 0,

    statusMap: {
      pending:   { label: '审核中',  emoji: '⏳', color: '#F57C00', bg: '#FFF3E0', desc: '您的资料正在审核中，请耐心等待' },
      approved:  { label: '已通过',  emoji: '✅', color: '#388E3C', bg: '#E8F5E9', desc: '恭喜！您的资料已通过审核' },
      published: { label: '已发布',  emoji: '🎉', color: '#1976D2', bg: '#E3F2FD', desc: '您的资料已发布到公众号' },
      rejected:  { label: '未通过',  emoji: '😔', color: '#D32F2F', bg: '#FFEBEE', desc: '很抱歉，您的资料未通过审核' },
      archived:  { label: '已下架',  emoji: '📦', color: '#999',    bg: '#F5F5F5', desc: '您的资料已下架' },
    },

    statusLabel: '',
    statusEmoji: '',
    statusColor: '',
    statusBg: '',
    statusDesc: '',
  },

  onLoad: function () {
    this._loadProfile()
  },

  onShow: function () {
    if (!this.data.loading) {
      this._loadProfile()
    }
  },

  onPullDownRefresh: function () {
    var that = this
    this._loadProfile().then(function () {
      wx.stopPullDownRefresh()
    })
  },

  _loadProfile: function () {
    var that = this
    that.setData({ loading: true })

    return api.getMyProfile().then(function (result) {
      if (result.success && result.data) {
        var profile = result.data
        var status = profile.status || 'pending'
        var info = that.data.statusMap[status] || that.data.statusMap['pending']

        that.setData({
          loading: false,
          hasProfile: true,
          serialNumber: profile.serial_number || '',
          status: status,
          rejectionReason: profile.rejection_reason || '',
          createTime: profile.create_time || '',
          publishedAt: profile.published_at || '',
          invitationQuota: profile.invitation_quota || 0,
          statusLabel: info.label,
          statusEmoji: info.emoji,
          statusColor: info.color,
          statusBg: info.bg,
          statusDesc: info.desc,
        })
      } else {
        that.setData({ loading: false, hasProfile: false })
      }
    }).catch(function (err) {
      that.setData({ loading: false, hasProfile: false })

      if (err.message && err.message.indexOf('不存在') >= 0) {
        console.log('[Status] 用户尚未提交资料')
      } else {
        console.error('[Status] 加载失败:', err)
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  },

  goFillProfile: function () {
    wx.navigateTo({ url: '/pages/profile/profile' })
  },

  goEditProfile: function () {
    wx.navigateTo({ url: '/pages/profile/profile?mode=edit' })
  },

  goMyCodes: function () {
    wx.navigateTo({ url: '/pages/codes/codes' })
  },

  onLogout: function () {
    wx.showModal({
      title: '确认退出',
      content: '退出后需要重新使用邀请码登录',
      success: function (res) {
        if (res.confirm) {
          var app = getApp()
          app.clearLogin()
          wx.reLaunch({ url: '/pages/index/index?from=logout' })
        }
      }
    })
  },
})
