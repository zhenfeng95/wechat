'use strict'

var config = require('./config.js')
var Wechat = require('./middleware/wechat.js')

var wechatApi = new Wechat(config.wechat)

exports.reply = function* (next){
    var message = this.weixin

    if(message.MsgType === 'event') {
        if (message.Event === 'subscribe') {
            if(message.EventKey) {
                console.log('扫二维码进来' + message.EventKey + message.ticket)
            }
            this.body = '哈哈，你订阅了这个号\r\n'
        } else if (message.Event === 'unsubscribe') {
            console.log('无情取关')
           this.body = ''
        } else if (message.Event === 'LOCATION') {
           this.body = '您上报的位置是：' + message.Latitude + '/' + message.Longitude + '-' + message.Precision
        } else if (message.Event === 'CLICK') {
            this.body = '您点击了菜单：' + message.EventKey
        } else if (message.Event === 'SCAN') {
            console.log('扫二维码进来' + message.EventKey + message.ticket)
            this.body = '看到您扫一下啊'
        } else if (message.Event === 'VIEW') {
            this.body = '您点击了菜单中的链接' + message.EventKey
        }
    } else if(message.MsgType === 'text') {
        var content = message.Content
        var reply = '呃，你说的' + content + '我不理解啊'
        if(content === '1') {
            reply = '天下第一'
        } else if (content === '2') {
            reply = '天下第二'
        } else if (content === '3') {
            reply = '天下第三'
        } else if (content === '4') {
            reply = [{
                title: '技术改变世界',
                description: '只是个描述而已，千万别当真',
                picUrl: 'https://js.588ku.com/comp/activity/commonVip/images/compay-nav-down.png',
                url: 'https://www.baidu.com'
            }]
        } else if (content === '5') {
            var data = yield wechatApi.uploadMaterial('image', __dirname + '/man.jpeg')
            reply = {
                type: 'image',
                media_id: data.media_id
            }
        } else if (content === '6') {
            var data = yield wechatApi.uploadMaterial('video', __dirname + '/man.mp4')
            reply = {
                type: 'video',
                title: '振锋',
                description: '帅小伙',
                media_id: data.media_id
            }
        } else if (content === '7') {
            var data = yield wechatApi.uploadMaterial('image', __dirname + '/man.jpeg')
            reply = {
                type: 'music',
                title: '音乐内容',
                description: '帅小伙，放松一下',
                MUSIC_Url: 'http://m10.music.126.net/20200422224308/17c37277cd0d9296e9cb0e1f7accb439/ymusic/5353/0f0f/0358/d99739615f8e5153d77042092f07fd77.mp3',
                HQ_MUSIC_Url: 'http://m10.music.126.net/20200422224308/17c37277cd0d9296e9cb0e1f7accb439/ymusic/5353/0f0f/0358/d99739615f8e5153d77042092f07fd77.mp3',
                media_id: data.media_id
            }
        }
        this.body = reply
    }

    yield next
}