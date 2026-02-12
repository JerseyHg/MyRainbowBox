import { submitProfile, uploadPhoto, getMyProfile } from '../../services/api'
import type { ProfileData } from '../../services/api'

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
    selectedHobbies: [] as string[],
    customHobby: '',
    lifestyle: '',

    // 步骤2: 期待对象 + 照片
    expRelationship: '', expBodyType: '', expAppearance: '', expAgeRange: '',
    expHabits: '', expPersonality: '', expLocation: '', expOther: '',
    specialRequirements: '',
    photos: [] as string[],           // 展示用 (本地临时路径)
    uploadedPhotos: [] as string[],   // 已上传的服务器URL
    uploadingPhoto: false,
  },

  // =========================================
  //  通用事件
  // =========================================

  onInput(e: any) {
    var key = e.currentTarget.dataset.key
    var obj: any = {}
    obj[key] = e.detail.value
    this.setData(obj)
  },

  onTagTap(e: any) {
    var key = e.currentTarget.dataset.key
    var val = e.currentTarget.dataset.val
    var obj: any = {}
    obj[key] = val
    this.setData(obj)
  },

  onPick(e: any) {
    var key = e.currentTarget.dataset.key
    var map: any = {
      maritalStatus: 'maritalOptions',
      constellation: 'constellationOptions',
      mbti: 'mbtiOptions',
      comingOutStatus: 'comingOutOptions'
    }
    var opts = (this.data as any)[map[key]] || []
    var obj: any = {}
    obj[key] = opts[e.detail.value]
    this.setData(obj)
  },

  // =========================================
  //  兴趣爱好
  // =========================================

  toggleHobby(e: any) {
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

  addCustomHobby() {
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

  removeHobby(e: any) {
    var idx = e.currentTarget.dataset.i
    var list = this.data.selectedHobbies.slice()
    list.splice(idx, 1)
    this.setData({ selectedHobbies: list })
  },

  // =========================================
  //  照片：选择 + 即时上传
  // =========================================

  choosePhoto() {
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
      success(res) {
        var newFiles = res.tempFiles
        // 先把本地路径加到展示列表
        var photos = that.data.photos.slice()
        var uploaded = that.data.uploadedPhotos.slice()

        for (var i = 0; i < newFiles.length; i++) {
          var localPath = newFiles[i].tempFilePath
          photos.push(localPath)
          uploaded.push('')  // 占位，等上传完成后替换
        }
        that.setData({ photos: photos, uploadedPhotos: uploaded })

        // 逐张上传到服务器
        that._uploadNewPhotos(photos.length - newFiles.length, newFiles.length)
      }
    })
  },

  /** 从 startIdx 开始上传 count 张照片 */
  async _uploadNewPhotos(startIdx: number, count: number) {
    this.setData({ uploadingPhoto: true })

    for (var i = 0; i < count; i++) {
      var idx = startIdx + i
      var localPath = this.data.photos[idx]

      try {
        var serverUrl = await uploadPhoto(localPath)
        // 更新对应位置的服务器URL
        var key = 'uploadedPhotos[' + idx + ']'
        var obj: any = {}
        obj[key] = serverUrl
        this.setData(obj)
        console.log('[Photo] 上传成功:', idx, serverUrl)
      } catch (err: any) {
        console.error('[Photo] 上传失败:', idx, err)
        wx.showToast({ title: '第' + (idx + 1) + '张照片上传失败', icon: 'none' })
        // 上传失败的保留空字符串，提交时会过滤掉
      }
    }

    this.setData({ uploadingPhoto: false })
  },

  removePhoto(e: any) {
    var idx = e.currentTarget.dataset.i
    var photos = this.data.photos.slice()
    var uploaded = this.data.uploadedPhotos.slice()
    photos.splice(idx, 1)
    uploaded.splice(idx, 1)
    this.setData({ photos: photos, uploadedPhotos: uploaded })
  },

  previewPhoto(e: any) {
    wx.previewImage({ current: e.currentTarget.dataset.url, urls: this.data.photos })
  },

  // =========================================
  //  步骤导航
  // =========================================

  goStep(e: any) {
    var s = parseInt(e.currentTarget.dataset.s)
    if (s <= this.data.currentStep) {
      this.setData({ currentStep: s })
      wx.pageScrollTo({ scrollTop: 0, duration: 200 })
    }
  },

  nextStep() {
    if (!this.validateStep()) return
    this.setData({ currentStep: this.data.currentStep + 1 })
    wx.pageScrollTo({ scrollTop: 0, duration: 200 })
  },

  prevStep() {
    if (this.data.currentStep > 0) {
      this.setData({ currentStep: this.data.currentStep - 1 })
      wx.pageScrollTo({ scrollTop: 0, duration: 200 })
    }
  },

  validateStep(): boolean {
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
  //  提交资料（对接后端）
  // =========================================

  onSubmit() {
    // 检查是否还有照片在上传中
    if (this.data.uploadingPhoto) {
      wx.showToast({ title: '照片还在上传中，请稍候', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认提交',
      content: '提交后将进入审核流程，确定提交吗？',
      success: (res) => {
        if (res.confirm) {
          this._doSubmit()
        }
      }
    })
  },

  async _doSubmit() {
    if (this.data.submitting) return
    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...', mask: true })

    try {
      // 组装提交数据
      var d = this.data

      // 过滤掉上传失败的照片（空字符串）
      var validPhotos = d.uploadedPhotos.filter(function(url) { return !!url })

      var profileData: ProfileData = {
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

      var result = await submitProfile(profileData)

      wx.hideLoading()

      if (result.success) {
        // 更新本地状态
        var app = getApp<IAppOption>()
        app.globalData.hasProfile = true
        wx.setStorageSync('hasProfile', true)

        wx.showToast({ title: '提交成功！', icon: 'success', duration: 2000 })

        var serialNumber = result.data?.serial_number || ''
        var profileId = result.data?.profile_id || ''

        setTimeout(function() {
          // 提交成功后的提示
          wx.showModal({
            title: '提交成功',
            content: '您的编号为 ' + serialNumber + '，资料已进入审核流程，请耐心等待。',
            showCancel: false,
            confirmText: '我知道了',
            success: function() {
              wx.redirectTo({ url: '/pages/status/status' })
            }
          })
        }, 500)
      } else {
        wx.showToast({ title: result.message || '提交失败', icon: 'none' })
      }
    } catch (err: any) {
      wx.hideLoading()
      console.error('[Profile] 提交失败:', err)

      // 针对常见错误给出友好提示
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
    } finally {
      this.setData({ submitting: false })
    }
  },

  // =========================================
  //  生命周期
  // =========================================

  onLoad(options: any) {
    // 检查登录态
    var openid = wx.getStorageSync('openid')
    if (!openid) {
      wx.redirectTo({ url: '/pages/index/index' })
      return
    }

    // 如果带了 mode=view 参数，可以加载已有资料
    if (options && options.mode === 'view') {
      this._loadExistingProfile()
    }
  },

  /** 加载已有资料（编辑/查看场景） */
  async _loadExistingProfile() {
    try {
      wx.showLoading({ title: '加载中...' })
      var result = await getMyProfile()
      wx.hideLoading()

      if (result.success && result.data) {
        var profile = result.data
        // 如果资料状态不允许编辑，给出提示
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
        // TODO: 如果需要编辑功能，在这里回填表单数据
      }
    } catch (err: any) {
      wx.hideLoading()
      // 404 = 没有资料，正常情况
      if (err.message && err.message.indexOf('不存在') >= 0) {
        console.log('[Profile] 用户尚未提交资料')
      } else {
        console.error('[Profile] 加载资料失败:', err)
      }
    }
  },
})
