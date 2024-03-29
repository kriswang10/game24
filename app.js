//app.js
var req = require("/utils/request.js")
// var reqp = require("/utils/request-promise.js")
// var Promise = require('/utils/es6-promise.js')
App({
  onLaunch: function () {
    //调用API从本地缓存中获取数据
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    var openid = wx.getStorageSync("openid")
    var session = wx.getStorageSync("session")
    var me = this
    me.globalData.userid = openid
    me.globalData.session = session
    wx.checkSession({
      success() {
        me.globalData.userid = openid
        me.globalData.session = session
        console.log("session 有效", openid, session)
      },
      fail() {
        me.globalData.userid = ''
        me.globalData.session = ''
        console.log("session 无效，需重新获取")
        // me.getUserInfo()
      }
    })

  },

  getUserInfo: function (cb, cb2) {
    var that = this
    if (that.globalData.userInfo && that.globalData.userid.length > 0 && that.globalData.session.length > 0) {
      typeof cb == "function" && cb(that.globalData.userInfo)
      that.updateInfo(that, null)
    } else {
     
      wx.login({
        success: function (loginCode) {
          wx.getUserInfo({
            withCredentials: false,
            success: function (res) {
              that.globalData.userInfo = res.userInfo
              typeof cb == "function" && cb(that.globalData.userInfo)
              that.updateInfo(that, loginCode.code)
            },
            fail: function (res) {
              wx.showModal({
                title: '用户未授权',
                content: "为了正常使用游戏评测功能，请按确认并在授权管理中选中'用户信息'开启",
                showCancel: false,
                confirmText: '确认',
                cancelText: '取消',
                success: function (res) {
                  if (res.confirm) {
                    wx.openSetting({
                      success: function (res) {
                        console.log(res)
                        getApp().getUserInfo(cb, cb2);
                      },
                      fail: function () {
                        getApp().getUserInfo(cb, cb2);
                      }
                    })
                  }
                }
              })
            }
          })

          that.updateInfo(that, loginCode.code)
        }
      })
    }
  },

  updateInfo(that, code) {
    if (typeof (that.globalData.userid) == "undefined" || typeof (that.globalData.session) == "undefined" || that.globalData.userid == '0' || that.globalData.session == '0' ||
      that.globalData.userid.length == 0 || that.globalData.session.length == 0) {
        if(!code){
          return
        }
      var appid = 'wxdb8b001b6eb420d6' //微信小程序appid  
      var secret = 'd9446f480197ba1041f8fdfa09fa7963'//微信小程序secret  
      //调用request请求api转换登录凭证  
      var param = {
        appid: appid,
        js_code: code
      }
      // 获取openID
      req.getOpenId(
        param,
        function (s) {
          var openid = s.openid
          var session = s.session
          that.globalData.userid = openid
          that.globalData.session = session
          typeof cb2 == "function" && cb2(openid, session)
          // 存储id、session
          wx.setStorage({
            key: 'openid',
            data: openid,
          })
          wx.setStorage({
            key: 'session',
            data: session,
          })
          that.updateUser(that, openid, session)
        },
        function (f) {

        })
    } else {
      //可更新用户信息         
      var openid = that.globalData.userid
      var session_code = that.globalData.session
      typeof cb2 == "function" && cb2(openid, session_code)
      that.updateUser(that, openid, session_code)
    }
  },

  updateUser(that, openid, session) {
    // 更新用户信息
    var uInfo = that.globalData.userInfo
    if (uInfo == null || that.globalData.hasUpdate || typeof (that.globalData.userid) == "undefined" || typeof (that.globalData.session) == "undefined" || that.globalData.userid == '0' || that.globalData.session == '0' ||
      that.globalData.userid.length == 0 || that.globalData.session.length == 0) {
      return
    }
    var d = {
      nick_name: uInfo.nickName,
      avatar_url: uInfo.avatarUrl,
      gender: uInfo.gender,
      language: uInfo.language,
      city: uInfo.city,
      province: uInfo.province,
      country: uInfo.country,
      openid: openid,
      session_code: session,
    }

    var user = JSON.stringify(d)
    console.log("user=", user)
    req.updateUser(d,
      function (s) {
        console.log("用户信息更新成功")
        that.globalData.hasUpdate = true
      }, function (f) {
        console.log("用户信息更新失败！！")
      })
  },

  // globalData: {
    // userInfo: null,
    // userid: '',
    // session: '',
    // maxNum: 13,
    // hasUpdate: false
  // }

  globalData: {
    userInfo: null,
    maxNum: 13
  }
})