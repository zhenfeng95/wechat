'use strict'

var Koa = require('Koa')
var ejs = require('ejs')
var heredoc = require('heredoc')
var crypto = require('crypto')
var sha1 = require('sha1')
var g = require('./middleware/g.js')
var weixin = require('./weixin.js')
var config = require('./config.js')
var Wechat = require('./middleware/wechat.js')

var tpl = heredoc(function() {/*
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>搜电影</title>
    </head>
    <body>
        <h1>点击标题开始录音翻译</h1>
        <div id='title'></div>
        <div id='year'></div>
        <div id='directors'></div>
        <div id='poster'></div>
        <script src="https://zeptojs.com/zepto-docs.min.js"></script>
        <script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>
        <script>
            wx.config({
                debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                appId: 'wx9c19e34d691f3227', // 必填，公众号的唯一标识
                timestamp: '<%= timestamp %>', // 必填，生成签名的时间戳
                nonceStr: '<%= noncestr %>', // 必填，生成签名的随机串
                signature: '<%= signature %>',// 必填，签名
                jsApiList: [
                    'onMenuShareAppMessage',
                    'startRecord',
                    'stopRecord',
                    'onVoiceRecordEnd',
                    'translateVoice',
                    'onVoiceRecordEnd',
                    'chooseImage'
                ] // 必填，需要使用的JS接口列表
            });
            wx.ready(function(){
                 wx.checkJsApi({
                    jsApiList: ['chooseImage'], // 需要检测的JS接口列表，所有JS接口列表见附录2,
                    success: function(res) {
                        console.log(res)
                    // 以键值对的形式返回，可用的api值true，不可用为false
                    // 如：{"checkResult":{"chooseImage":true},"errMsg":"checkJsApi:ok"}
                    }
                });

                var shareContent = {
                    title: '电影名称', // 分享标题
                    desc: '电影描述', // 分享描述
                    link: 'https://5310ebfb.ngrok.io/movie', // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
                    imgUrl: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1587748248660&di=4b569bf7ee52d4edd7feee37a10bb1ad&imgtype=0&src=http%3A%2F%2Fa4.att.hudong.com%2F21%2F09%2F01200000026352136359091694357.jpg', // 分享图标
                    type: '', // 分享类型,music、video或link，不填默认为link
                    dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
                    success: function () {
                        // 用户点击了分享后执行的回调函数
                    },
                    cancel: function() {
                        alert('分享失败')
                    } 
                }

                wx.onMenuShareAppMessage(shareContent);
                
                var flag = false
                $('h1').on('tap', function(){
                    if(!flag) {
                        flag = true
                        wx.startRecord({
                            cancel: function (res) {
                                console.log(res)
                            }
                        });
                        return
                    }
                    flag = false
                    wx.stopRecord({
                        success: function(res){
                            var localId = res.localId;
                            wx.translateVoice({
                                    localId: localId, // 需要识别的音频的本地Id，由录音相关接口获得
                                    isShowProgressTips: 1, // 默认为1，显示进度提示
                                    success: function (res) {
                                        var result = res.translateResult
                                        $('#title').html(result)
                                    }
                                });
                            }
                    })
                    
                })

                // config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
            });

        </script>
    </body>
    </html>
*/})

var app = new Koa()

var createNonceStr = function() {
    return Math.random().toString(36).substr(2,15)
}

var createTimestamp = function() {
    return parseInt(new Date().getTime() / 1000) + ''
}

var _sign = function(noncestr, ticket, timestamp, url) {
    var params = [
        'noncestr=' + noncestr,
        'jsapi_ticket=' + ticket,
        'timestamp=' + timestamp,
        'url=' + url
    ]
    var str = params.sort().join('&')
    console.log(str)
    console.log(sha1(str))
    var shasum = crypto.createHash('sha1')
    shasum.update(str)
    return shasum.digest('hex')
}

function sign(ticket, url) {
    var noncestr = createNonceStr()
    var timestamp = createTimestamp()
    var signature = _sign(noncestr, ticket, timestamp, url)
    return {
        noncestr: noncestr,
        timestamp: timestamp,
        signature: signature
    }
}

app.use(function *(next) {
    if(this.url.indexOf('movie') > -1) {
        var wechatApi = new Wechat(config.wechat)
        var data = yield wechatApi.fetchAccessToken()
        var access_token = data.access_token
        var ticketData = yield wechatApi.fetchTicket(access_token)
        var ticket = ticketData.ticket
        var url = this.href.replace('http://', 'https://')
        var params = sign(ticket, url)
        console.log('我是下面的')
        console.log(url)
        console.log(ticket)
        console.log(params)
        this.body = ejs.render(tpl ,params)
        return next
    }
    yield next
})

app.use(g(config.wechat, weixin.reply))

app.listen(9595)
console.log('listen 9595')