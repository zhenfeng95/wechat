'use strict'

var Promise = require('bluebird')
var request = require('request')
var fs = require('fs')
var utils = require('../libs/utils')

var prefix = 'https://api.weixin.qq.com/cgi-bin/'

var api = {
    accessToken: prefix + 'token?grant_type=client_credential',
    upload: prefix + 'media/upload?',
    ticket: {
        get: prefix + 'ticket/getticket?'
    }
}

function Wechat(opts) {
    var that = this
    this.appID = opts.appID
    this.appsecret = opts.appsecret
    this.getAccessToken = opts.getAccessToken
    this.saveAccessToken = opts.saveAccessToken
    this.getTicket = opts.getTicket
    this.saveTicket = opts.saveTicket

    this.fetchAccessToken()

}

Wechat.prototype.fetchAccessToken = function() {
    var that = this

    if(this.access_token && this.expires_in) {
        if(this.isValidAccessToken(this)) {
            return Promise.resolve(this)
        }
    }

    return this.getAccessToken()
        .then(function(data){
            try {
                data = JSON.parse(data)
            } catch(e) {
                return that.updateAccessToken()
            }
            if(that.isValidAccessToken(data)){
                return Promise.resolve(data)
                // return new Promise(function(resolve, reject){
                //     resolve(data)
                // })
            } else {
                return that.updateAccessToken()
            }
        })
        .then(function(data){
            console.log(data)
            that.access_token = data.access_token
            that.expires_in = data.expires_in
            that.saveAccessToken(data)
            return Promise.resolve(data)
        })
}

Wechat.prototype.fetchTicket = function(access_token) {
    var that = this

    return this.getTicket()
        .then(function(data){
            try {
                data = JSON.parse(data)
            } catch(e) {
                return that.updateTicket(access_token)
            }
            if(that.isValidTicket(data)){
                return Promise.resolve(data)
            } else {
                return that.updateTicket(access_token)
            }
        })
        .then(function(data){
            that.saveTicket(data)
            return Promise.resolve(data)
        })
}

Wechat.prototype.isValidAccessToken = function(data) {
    if(!data || !data.access_token || !data.expires_in){
        return false
    }

    var access_token = data.access_token
    var expires_in = data.expires_in 
    var nowTime = new Date().getTime()

    if(nowTime < expires_in) {
        return true
    } else {
        return false
    }
}

Wechat.prototype.updateAccessToken = function() {
    var appID = this.appID
    var appsecret = this.appsecret
    var url = api.accessToken + '&appid=' + appID + '&secret=' + appsecret
    console.log(url)
    return new Promise(function(resolve,reject){
        request(url, function (error, response, body) {
            var body = JSON.parse(body)
            var nowTime = new Date().getTime()
            var expires_in = nowTime + (body.expires_in - 20) * 1000
            body.expires_in = expires_in
            resolve(body)
        })
    })
}

Wechat.prototype.isValidTicket = function(data) {
    if(!data || !data.ticket || !data.expires_in){
        return false
    }

    var ticket = data.ticket
    var expires_in = data.expires_in 
    var nowTime = new Date().getTime()

    if(ticket && nowTime < expires_in) {
        return true
    } else {
        return false
    }
}

Wechat.prototype.updateTicket = function(access_token) {
    var url = api.ticket.get + 'access_token=' + access_token + '&type=jsapi'
    return new Promise(function(resolve,reject){
        request(url, function (error, response, body) {
            var body = JSON.parse(body)
            var nowTime = new Date().getTime()
            var expires_in = nowTime + (body.expires_in - 20) * 1000
            body.expires_in = expires_in
            resolve(body)
        })
    })
}

//回复消息
Wechat.prototype.reply = function() {
    var content = this.body
    var message = this.weixin
    var xml = utils.tpl(content, message)

    this.status = 200
    this.type = 'application/xml'
    this.body = xml
    console.log('最后解析')
    console.log(this.body)
}

//上传素材
Wechat.prototype.uploadMaterial = function(type, filepath) {
    var that = this
    var form = {
        media: fs.createReadStream(filepath)
    }

    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.upload + 'access_token=' + data.access_token + '&type=' + type

                request({url:url,method:'POST',formData:form,json:true}, function(error, response, body){
                    if(body) {
                        resolve(body)
                    } else {
                        throw new Error('Upload failed')
                    }
                })
            })

        
    })
}
module.exports = Wechat