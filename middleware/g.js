'use strict'

var sha1 = require('sha1')
var getRawBody = require('raw-body')
var Promise = require('bluebird')
var Wechat = require('./wechat.js')
var utils = require('../libs/utils.js')

module.exports = function(opts, handler) {

    var wechat = new Wechat(opts)
    
    return function *(next) {
        console.log(this.query)
        var token = opts.token
        var signature = this.query.signature
        var nonce = this.query.nonce
        var timestamp = this.query.timestamp
        var echostr = this.query.echostr
        var str = [token, timestamp, nonce].sort().join('')
        var sha = sha1(str)
        console.log(this.method)
        if(this.method === 'GET') {
            if(sha === signature) {
                this.body = echostr + ''
            } else {
                this.body = 'wrong'
            }
        } else if(this.method === 'POST') {
            if(sha !== signature) {
                this.body = 'wrong'
                return false
            } 

            //raw-body获取微信服务器返回的xml数据
            var data = yield getRawBody(this.req, {
                length: this.length,
                limit: '1mb',
                encoding: this.charset
            })
            
            //xml2js是用于解析xml文件的扩展，使用后可以将xml格式数据转为json格式
            var content = yield utils.parseXMLAsync(data)
            console.log(content)
            //格式化content，使其变为key: value对象的形式
            var message = utils.formatMessage(content.xml)
            console.log(message)

            this.weixin = message

            yield handler.call(this, next)

            wechat.reply.call(this)

            // if(message.MsgType === 'event') {
            //     if(message.Event === 'subscribe') {
            //         var nowTime = new Date().getTime()
            //         this.status = 200
            //         this.type = 'application/xml'
                    
            //         var reply = '<xml>' +
            //             '<ToUserName><![CDATA[' + message.FromUserName +']]></ToUserName>' +
            //             '<FromUserName><![CDATA['+ message.ToUserName +']]></FromUserName>' +
            //             '<CreateTime>' + nowTime + '</CreateTime>' +
            //             '<MsgType><![CDATA[text]]></MsgType>' +
            //             '<Content><![CDATA[你好，张振锋同学，欢迎来到微信公众号的世界]]></Content>' +
            //             '</xml>'
            //         console.log(reply)    
            //         this.body = reply

            //         return
            //     }
            // }
        }
    
       
    }
}
