var api = require('../../services/api')
var filter = require('../../utils/filter')

Page({
  data: {
    currentStep: 0,
    submitting: false,
    isEditMode: false,
    name: '', gender: '', age: '', height: '', weight: '',
    genderOptions: ['男', '女'],
    bodyType: '', bodyTypeOptions: ['偏瘦', '匀称', '偏壮', '微胖', '较胖'],
    hometown: '', workLocation: '', industry: '',
    wechatId: '',
    constellation: '',
    constellationOptions: ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座','不确定'],
    mbti: '',
    mbtiOptions: ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP','不确定'],
    healthCondition: '',
    hobbyTags: ['健身','运动','旅行','摄影','音乐','电影','阅读','游戏','美食','烹饪','画画','舞蹈','徒步','骑行','游泳','瑜伽','露营','钓鱼','桌游','剧本杀','宠物','园艺'],
    selectedHobbies: [],
    customHobby: '',
    lifestyle: '',
    idealLife: '',
    specialRequirements: '',
    photos: [],
    uploadedPhotos: [],
    uploadingPhoto: false,
    _photoPrivacyAgreed: false,
  },

  onInput: function (e) {
    var key = e.currentTarget.dataset.key
    var value = e.detail.value
    if (typeof value === 'string' && value.length > 0) {
      var word = filter.detectSensitive(value)
      if (word) { wx.showToast({ title: '请勿输入违规内容', icon: 'none' }); value = filter.filterSensitive(value) }
    }
    var obj = {}; obj[key] = value; this.setData(obj)
  },

  onTagTap: function (e) {
    var obj = {}; obj[e.currentTarget.dataset.key] = e.currentTarget.dataset.val; this.setData(obj)
  },

  onPick: function (e) {
    var key = e.currentTarget.dataset.key
    var map = { maritalStatus: 'maritalOptions', constellation: 'constellationOptions', mbti: 'mbtiOptions' }
    var opts = this.data[map[key]] || []
    var obj = {}; obj[key] = opts[e.detail.value]; this.setData(obj)
  },

  toggleHobby: function (e) {
    var hobby = e.currentTarget.dataset.val
    var list = this.data.selectedHobbies.slice()
    var idx = list.indexOf(hobby)
    if (idx >= 0) { list.splice(idx, 1) }
    else { if (list.length >= 10) { wx.showToast({ title: '最多选10个', icon: 'none' }); return }; list.push(hobby) }
    this.setData({ selectedHobbies: list })
  },

  addCustomHobby: function () {
    var val = this.data.customHobby.trim()
    if (!val) return
    if (this.data.selectedHobbies.length >= 10) { wx.showToast({ title: '最多10个', icon: 'none' }); return }
    if (this.data.selectedHobbies.indexOf(val) >= 0) { wx.showToast({ title: '已添加过了', icon: 'none' }); return }
    if (filter.detectSensitive(val)) { wx.showToast({ title: '包含违规内容', icon: 'none' }); return }
    var list = this.data.selectedHobbies.slice(); list.push(val)
    this.setData({ selectedHobbies: list, customHobby: '' })
  },

  removeHobby: function (e) {
    var list = this.data.selectedHobbies.slice(); list.splice(e.currentTarget.dataset.i, 1)
    this.setData({ selectedHobbies: list })
  },

  choosePhoto: function () {
    var that = this
    if (!this.data._photoPrivacyAgreed) {
      wx.showModal({
        title: '照片使用说明',
        content: '您上传的照片将用于报名审核，我们将严格保护您的隐私。请勿上传包含身份证、银行卡等敏感信息的照片。',
        confirmText: '我已了解', cancelText: '取消',
        success: function (res) { if (res.confirm) { that.setData({ _photoPrivacyAgreed: true }); that._doChoosePhoto() } }
      })
      return
    }
    this._doChoosePhoto()
  },

  _doChoosePhoto: function () {
    var that = this
    var remaining = 6 - that.data.photos.length
    if (remaining <= 0) { wx.showToast({ title: '最多6张照片', icon: 'none' }); return }
    wx.chooseMedia({
      count: remaining, mediaType: ['image'], sourceType: ['album', 'camera'], sizeType: ['compressed'],
      success: function (res) {
        var photos = that.data.photos.slice()
        var uploaded = that.data.uploadedPhotos.slice()
        var startIdx = photos.length
        for (var i = 0; i < res.tempFiles.length; i++) { photos.push(res.tempFiles[i].tempFilePath); uploaded.push('') }
        that.setData({ photos: photos, uploadedPhotos: uploaded })
        that._uploadNewPhotos(startIdx, res.tempFiles.length)
      }
    })
  },

  _uploadNewPhotos: function (startIdx, count) {
    var that = this; that.setData({ uploadingPhoto: true })
    var doUpload = function (i) {
      if (i >= count) { that.setData({ uploadingPhoto: false }); return }
      var idx = startIdx + i
      api.uploadPhoto(that.data.photos[idx]).then(function (serverUrl) {
        var obj = {}; obj['uploadedPhotos[' + idx + ']'] = serverUrl; that.setData(obj); doUpload(i + 1)
      }).catch(function (err) {
        console.error('[Photo] 上传失败:', idx, err)
        wx.showToast({ title: '第' + (idx + 1) + '张照片上传失败', icon: 'none' }); doUpload(i + 1)
      })
    }
    doUpload(0)
  },

  removePhoto: function (e) {
    var idx = e.currentTarget.dataset.i
    var photos = this.data.photos.slice(); var uploaded = this.data.uploadedPhotos.slice()
    photos.splice(idx, 1); uploaded.splice(idx, 1)
    this.setData({ photos: photos, uploadedPhotos: uploaded })
  },

  previewPhoto: function (e) { wx.previewImage({ current: e.currentTarget.dataset.url, urls: this.data.photos }) },

  goStep: function (e) {
    var s = parseInt(e.currentTarget.dataset.s)
    if (s <= this.data.currentStep) { this.setData({ currentStep: s }); wx.pageScrollTo({ scrollTop: 0, duration: 200 }) }
  },
  nextStep: function () {
    if (!this.validateStep()) return
    this.setData({ currentStep: this.data.currentStep + 1 }); wx.pageScrollTo({ scrollTop: 0, duration: 200 })
  },
  prevStep: function () {
    if (this.data.currentStep > 0) { this.setData({ currentStep: this.data.currentStep - 1 }); wx.pageScrollTo({ scrollTop: 0, duration: 200 }) }
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

  testTap: function() {
    console.log('testTap 被点击了')
    wx.showModal({ title: '测试', content: '按钮可以点击' })
  },

  onSubmit: function () {
    var that = this
    if (that.data.uploadingPhoto) { wx.showToast({ title: '照片还在上传中，请稍候', icon: 'none' }); return }
    wx.hideToast()
    wx.hideLoading()
    setTimeout(function() {
      console.log('=== 即将调用 showModal ===')
      wx.showModal({
        title: that.data.isEditMode ? '确认更新' : '确认提交',
        content: that.data.isEditMode ? '确定要更新您的资料吗？' : '确定要提交吗？',
        success: function (res) {
          console.log('=== showModal success ===', res)
          if (res.confirm) { that._doSubmit() }
        },
        fail: function (err) {
          console.error('=== showModal fail ===', err)
        },
        complete: function () {
          console.log('=== showModal complete ===')
        }
      })
    }, 500)
  },

  _doSubmit: function () {
    var that = this
    if (that.data.submitting) return
    that.setData({ submitting: true }); wx.showLoading({ title: '提交中...', mask: true })
    var d = that.data
    var validPhotos = d.uploadedPhotos.filter(function (url) { return !!url })
    var profileData = {
      name: d.name.trim(), gender: d.gender,
      age: parseInt(d.age) || 0, height: parseInt(d.height) || 0, weight: parseInt(d.weight) || 0,
      marital_status: d.maritalStatus || undefined, body_type: d.bodyType || undefined,
      hometown: d.hometown || undefined, work_location: d.workLocation || undefined,
      industry: d.industry || undefined, constellation: d.constellation || undefined,
      mbti: d.mbti || undefined, health_condition: d.healthCondition || undefined,
      wechat_id: d.wechatId || undefined,
      hobbies: d.selectedHobbies, lifestyle: d.lifestyle || undefined,
      special_requirements: (d.idealLife || '') + (d.specialRequirements ? '\n' + d.specialRequirements : '') || undefined,
      photos: validPhotos,
    }
    if (!filter.checkBeforeSubmit(profileData)) { wx.hideLoading(); that.setData({ submitting: false }); return }

    // 编辑模式用 updateProfile，新建用 submitProfile
    var submitFn = that.data.isEditMode ? api.updateProfile : api.submitProfile

    submitFn(profileData).then(function (result) {
      wx.hideLoading()
      if (result.success) {
        var app = getApp(); app.globalData.hasProfile = true; wx.setStorageSync('hasProfile', true)

        if (that.data.isEditMode) {
          // 编辑模式：提示更新成功，返回状态页
          wx.showToast({ title: '更新成功！', icon: 'success', duration: 1500 })
          setTimeout(function () {
            wx.navigateBack()
          }, 1500)
        } else {
          // 新建模式：原有逻辑
          wx.showToast({ title: '提交成功！', icon: 'success', duration: 2000 })
          var serialNumber = (result.data && result.data.serial_number) || ''
          setTimeout(function () {
            wx.showModal({
              title: '报名成功', content: '您的编号为 ' + serialNumber + '，报名信息已进入审核流程，请耐心等待。',
              showCancel: false, confirmText: '我知道了',
              success: function () { wx.redirectTo({ url: '/pages/status/status' }) }
            })
          }, 500)
        }
      } else { wx.showToast({ title: result.message || '提交失败', icon: 'none' }) }
    }).catch(function (err) {
      wx.hideLoading()
      var errMsg = err.message || '提交失败，请重试'
      if (errMsg.indexOf('已经提交过') >= 0) { wx.showModal({ title: '提示', content: '您已提交过报名信息，无需重复提交。', showCancel: false }) }
      else { wx.showToast({ title: errMsg, icon: 'none', duration: 3000 }) }
    }).finally(function () { that.setData({ submitting: false }) })
  },

  onLoad: function (options) {
    if (!wx.getStorageSync('openid')) { wx.redirectTo({ url: '/pages/index/index' }); return }

    if (options && options.mode === 'edit') {
      this.setData({ isEditMode: true })
      this._loadForEdit()
    } else if (options && options.mode === 'view') {
      this._loadExistingProfile()
    }
  },

  /** 编辑模式：加载已有资料填充表单 */
  _loadForEdit: function () {
    var that = this
    wx.showLoading({ title: '加载中...' })
    api.getMyProfile().then(function (result) {
      wx.hideLoading()
      if (result.success && result.data) {
        var p = result.data
        that.setData({
          name: p.name || '',
          gender: p.gender || '',
          age: p.age ? String(p.age) : '',
          height: p.height ? String(p.height) : '',
          weight: p.weight ? String(p.weight) : '',
          bodyType: p.body_type || '',
          hometown: p.hometown || '',
          workLocation: p.work_location || '',
          industry: p.industry || '',
          wechatId: p.wechat_id || '',
          constellation: p.constellation || '',
          mbti: p.mbti || '',
          healthCondition: p.health_condition || '',
          selectedHobbies: p.hobbies || [],
          lifestyle: p.lifestyle || '',
          specialRequirements: p.special_requirements || '',
          photos: p.photos || [],
          uploadedPhotos: p.photos || [],
        })
      }
    }).catch(function (err) {
      wx.hideLoading()
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  _loadExistingProfile: function () {
    wx.showLoading({ title: '加载中...' })
    api.getMyProfile().then(function (result) {
      wx.hideLoading()
      if (result.success && result.data) {
        var p = result.data
        if (p.status === 'approved' || p.status === 'published') { wx.showModal({ title: '提示', content: '您的报名已通过审核（编号: ' + (p.serial_number || '') + '）', showCancel: false }) }
        else if (p.status === 'pending') { wx.showModal({ title: '提示', content: '您的报名正在审核中，请耐心等待。', showCancel: false }) }
      }
    }).catch(function (err) { wx.hideLoading() })
  },
})
