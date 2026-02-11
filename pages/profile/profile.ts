Page({
  data: {
    currentStep: 0,

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
    photos: [] as string[],
  },

  // === 通用 ===
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

  // === 兴趣 ===
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

  // === 照片 ===
  choosePhoto() {
    var that = this
    var remaining = 6 - that.data.photos.length
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: function(res) {
        var arr = that.data.photos.slice()
        for (var i = 0; i < res.tempFiles.length; i++) {
          arr.push(res.tempFiles[i].tempFilePath)
        }
        that.setData({ photos: arr })
      }
    })
  },

  removePhoto(e: any) {
    var photos = this.data.photos.slice()
    photos.splice(e.currentTarget.dataset.i, 1)
    this.setData({ photos: photos })
  },

  previewPhoto(e: any) {
    wx.previewImage({ current: e.currentTarget.dataset.url, urls: this.data.photos })
  },

  // === 步骤 ===
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

  onSubmit() {
    wx.showModal({
      title: '确认提交',
      content: '提交后将进入审核流程，确定提交吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '提交成功！', icon: 'success' })
          console.log('提交数据:', this.data)
          // TODO: 对接后端API
        }
      }
    })
  },
})
