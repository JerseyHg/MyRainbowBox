var api = require('../../services/api')

Page({
  data: {
    currentStep: 0,
    submitting: false,

    // 步骤0: 基本信息
    name: '', gender: '', age: '', height: '', weight: '',
    genderOptions: ['男性', '女性', '跨性别', '非二元', '其他'],
    maritalStatus: '', maritalOptions: ['未婚', '离异', '丧偶', '保密'],
    bodyType: '', bodyTypeOptions: ['偏瘦', '匀称', '偏壮', '微胖', '较胖'],
    hometown: '', workLocation: '', industry: '',

    // 步骤1: 个人特征
    constellation: '',
    constellationOptions: ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座','不确定'],
    mbti: '',
    mbtiOptions: ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP','不确定'],
    comingOutStatus: '', comingOutOptions: ['完全出柜', '半出柜', '未出柜', '不想说'],
    healthCondition: '',
    hobbyTags: ['健身','运动','旅行','摄影','音乐','电影','阅读','游戏','美食','烹饪','画画','舞蹈','徒步','骑行','游泳','瑜伽','露营','钓鱼','桌游','剧本杀','宠物','园艺'],
    selectedHobbies: [],
    customHobby: '',
    lifestyle: '',

    // 步骤2: 期待对象 + 照片
    expRelationship: '', expBodyType: '', expAppearance: '', expAgeRange: '',
    expHabits: '', expPersonality: '', expLocation: '', expOther: '',
    specialRequirements: '',
    photos: [],
    uploadedPhotos: [],
    uploadingPhoto: false,
  },

  // =========================================
  //  通用事件
  // =========================================

  onInput: function (e) {
    var key = e.currentTarget.dataset.key
    var obj = {}
    obj[key] = e.detail.value
    this.setData(obj)
  },

  onTagTap: function (e) {
    var key = e.currentTarget.dataset.key
    var val = e.currentTarget.dataset.val
    var obj = {}
    obj[key] = val
    this.setData(obj)
  },

  onPick: function (e) {
    var key = e.currentTarget.dataset.key
    var map = {
      maritalStatus: 'maritalOptions',
      constellation: 'constellationOptions',
      mbti: 'mbtiOptions',
      comingOutStatus: 'comingOutOptions'
    }
    var opts = this.data[map[key]] || []
    var obj = {}
    obj[key] = opts[e.detail.value]
    this.setData(obj)
  },

  // =========================================
  //  兴趣爱好
  // =========================================

  toggleHobby: function (e) {
    var hobby = e.currentTarget.dataset.val
    var list = this.data.selectedHobbies.slice()
    var idx = list.indexOf(hobby)
    if (idx >= 0) {
      list.splice(idx, 1)
    } else {
      if (list.length >= 10) {
        wx.showToast({ title: '最多选10个', icon: 'none' }); return
      }
      list.push(hobby)
    }
    this.setData({ selectedHobbies: list })
  },

  addCustomHobby: function () {
    var val = this.data.customHobby.trim()
    if (!val) return
    if (this.data.selectedHobbies.length >= 10) {
      wx.showToast({ title: '最多10个', icon: 'none' }); return
    }
    if (this.data.selectedHobbies.indexOf(val) >= 0) {
      wx.showToast({ title: '已添加过了', icon: 'none' }); return
    }
    var list = this.data.selectedHobbies.slice()
    list.push(val)
    this.setData({ selectedHobbies: list, customHobby: '' })
  },

  removeHobby: function (e) {
    var idx = e.currentTarget.dataset.i
    var list = this.data.selectedHobbies.slice()
    list.splice(idx, 1)
    this.setData({ selectedHobbies: list })
  },

  // =========================================
  //  照片：选择 + 即时上传
  // =========================================

  choosePhoto: function () {
    var that = this
    var remaining = 6 - that.data.photos.length
    if (remaining <= 0) {
      wx.showToast({ title: '最多6张照片', icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: function (res) {
        var photos = that.data.photos.slice()
        var uploaded = that.data.uploadedPhotos.slice()
        var startIdx = photos.length

        for (var i = 0; i < res.tempFiles.length; i++) {
          photos.push(res.tempFiles[i].tempFilePath)
          uploaded.push('')  // 占位
        }
        that.setData({ photos: photos, uploadedPhotos: uploaded })

        // 逐张上传
        that._uploadNewPhotos(startIdx, res.tempFiles.length)
      }
    })
  },

  _uploadNewPhotos: function (startIdx, count) {
    var that = this
    that.setData({ uploadingPhoto: true })

    var doUpload = function (i) {
      if (i >= count) {
        that.setData({ uploadingPhoto: false })
        return
      }

      var idx = startIdx + i
      var localPath = that.data.photos[idx]

      api.uploadPhoto(localPath).then(function (serverUrl) {
        var key = 'uploadedPhotos[' + idx + ']'
        var obj = {}
        obj[key] = serverUrl
        that.setData(obj)
        console.log('[Photo] 上传成功:', idx, serverUrl)
        doUpload(i + 1)
      }).catch(function (err) {
        console.error('[Photo] 上传失败:', idx, err)
        wx.showToast({ title: '第' + (idx + 1) + '张照片上传失败', icon: 'none' })
        doUpload(i + 1)
      })
    }

    doUpload(0)
  },

  removePhoto: function (e) {
    var idx = e.currentTarget.dataset.i
    var photos = this.data.photos.slice()
    var uploaded = this.data.uploadedPhotos.slice()
    photos.splice(idx, 1)
    uploaded.splice(idx, 1)
    this.setData({ photos: photos, uploadedPhotos: uploaded })
  },

  previewPhoto: function (e) {
    wx.previewImage({ current: e.currentTarget.dataset.url, urls: this.data.photos })
  },

  // =========================================
  //  步骤导航
  // =========================================

  goStep: function (e) {
    var s = parseInt(e.currentTarget.dataset.s)
    if (s <= this.data.currentStep) {
      this.setData({ currentStep: s })
      wx.pageScrollTo({ scrollTop: 0, duration: 200 })
    }
  },

  nextStep: function () {
    if (!this.validateStep()) return
    this.setData({ currentStep: this.data.currentStep + 1 })
    wx.pageScrollTo({ scrollTop: 0, duration: 200 })
  },

  prevStep: function () {
    if (this.data.currentStep > 0) {
      this.setData({ currentStep: this.data.currentStep - 1 })
      wx.pageScrollTo({ scrollTop: 0, duration: 200 })
    }
  },

  validateStep: function () {
    var d = this.data
    if (d.currentStep === 0) {
      if (!d.name.trim()) { wx.showToast({ title: '请输入姓名', icon: 'none' }); return false }
      if (!d.gender) { wx.showToast({ title: '请选择性别', icon: 'none' }); return false }
      if (!d.age || +d.age < 18 || +d.age > 80) { wx.showToast({ title: '年龄需18-80', icon: 'none' }); return false }
      if (!d.height || +d.height < 140 || +d.height > 220) { wx.showToast({ title: '身高需140-220', icon: 'none' }); return false }
      if (!d.weight || +d.weight < 30 || +d.weight > 200) { wx.showToast({ title: '体重需30-200', icon: 'none' }); return false }
    }
    return true
  },

  // =========================================
  //  提交资料
  // =========================================

  onSubmit: function () {
    var that = this

    if (that.data.uploadingPhoto) {
      wx.showToast({ title: '照片还在上传中，请稍候', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认提交',
      content: '提交后将进入审核流程，确定提交吗？',
      success: function (res) {
        if (res.confirm) {
          that._doSubmit()
        }
      }
    })
  },

  _doSubmit: function () {
    var that = this
    if (that.data.submitting) return
    that.setData({ submitting: true })
    wx.showLoading({ title: '提交中...', mask: true })

    var d = that.data

    // 过滤掉上传失败的照片
    var validPhotos = d.uploadedPhotos.filter(function (url) { return !!url })

    var profileData = {
      name: d.name.trim(),
      gender: d.gender,
      age: parseInt(d.age) || 0,
      height: parseInt(d.height) || 0,
      weight: parseInt(d.weight) || 0,
      marital_status: d.maritalStatus || undefined,
      body_type: d.bodyType || undefined,
      hometown: d.hometown || undefined,
      work_location: d.workLocation || undefined,
      industry: d.industry || undefined,
      constellation: d.constellation || undefined,
      mbti: d.mbti || undefined,
      health_condition: d.healthCondition || undefined,
      coming_out_status: d.comingOutStatus || undefined,
      hobbies: d.selectedHobbies,
      lifestyle: d.lifestyle || undefined,
      expectation: {
        relationship: d.expRelationship || undefined,
        body_type: d.expBodyType || undefined,
        appearance: d.expAppearance || undefined,
        age_range: d.expAgeRange || undefined,
        habits: d.expHabits || undefined,
        personality: d.expPersonality || undefined,
        location: d.expLocation || undefined,
        other: d.expOther || undefined,
      },
      special_requirements: d.specialRequirements || undefined,
      photos: validPhotos,
    }

    console.log('[Profile] 提交数据:', JSON.stringify(profileData))

    api.submitProfile(profileData).then(function (result) {
      wx.hideLoading()

      if (result.success) {
        var app = getApp()
        app.globalData.hasProfile = true
        wx.setStorageSync('hasProfile', true)

        wx.showToast({ title: '提交成功！', icon: 'success', duration: 2000 })

        var serialNumber = (result.data && result.data.serial_number) || ''

        setTimeout(function () {
          wx.showModal({
            title: '提交成功',
            content: '您的编号为 ' + serialNumber + '，资料已进入审核流程，请耐心等待。',
            showCancel: false,
            confirmText: '我知道了',
          })
        }, 500)
      } else {
        wx.showToast({ title: result.message || '提交失败', icon: 'none' })
      }
    }).catch(function (err) {
      wx.hideLoading()
      console.error('[Profile] 提交失败:', err)

      var errMsg = err.message || '提交失败，请重试'
      if (errMsg.indexOf('已经提交过') >= 0) {
        wx.showModal({
          title: '提示',
          content: '您已提交过资料，无需重复提交。',
          showCancel: false,
        })
      } else {
        wx.showToast({ title: errMsg, icon: 'none', duration: 3000 })
      }
    }).finally(function () {
      that.setData({ submitting: false })
    })
  },

  // =========================================
  //  生命周期
  // =========================================

  onLoad: function (options) {
    var openid = wx.getStorageSync('openid')
    if (!openid) {
      wx.redirectTo({ url: '/pages/index/index' })
      return
    }

    if (options && options.mode === 'view') {
      this._loadExistingProfile()
    }
  },

  _loadExistingProfile: function () {
    wx.showLoading({ title: '加载中...' })

    api.getMyProfile().then(function (result) {
      wx.hideLoading()

      if (result.success && result.data) {
        var profile = result.data
        if (profile.status === 'approved' || profile.status === 'published') {
          wx.showModal({
            title: '提示',
            content: '您的资料已通过审核（编号: ' + (profile.serial_number || '') + '），当前状态: ' + profile.status,
            showCancel: false,
          })
        } else if (profile.status === 'pending') {
          wx.showModal({
            title: '提示',
            content: '您的资料正在审核中，请耐心等待。',
            showCancel: false,
          })
        }
      }
    }).catch(function (err) {
      wx.hideLoading()
      if (err.message && err.message.indexOf('不存在') >= 0) {
        console.log('[Profile] 用户尚未提交资料')
      } else {
        console.error('[Profile] 加载资料失败:', err)
      }
    })
  },
})
