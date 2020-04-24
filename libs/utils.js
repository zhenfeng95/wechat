'use strict'

var xml2js = require('xml2js')
var fs = require('fs')
var Promise = require('bluebird')
var tpl = require('../middleware/tpl.js')

exports.readFileAsync = function(fpath, encoding) {
    return new Promise(function(resolve, reject) {
        fs.readFile(fpath, encoding, function(err, content) {
            if(err) {
                reject(err)
            } else {
                resolve(content)
            }
        })
    })
}

exports.writeFileAsync = function(fpath, content) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(fpath, content, function(err) {
            if(err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

exports.parseXMLAsync = function(xml) {
    return new Promise(function(resolve, reject){
        //xml2js是用于解析xml文件的扩展，使用后可以将xml格式数据转为json格式
        xml2js.parseString(xml, {trim: true}, function(err, content){
            if(err) {
                reject(err)
            } else {
                resolve(content)
            }
        })
    })
}

function formatMessage(result) {
    var message = {}
    if(typeof result === 'object'){
        var keys = Object.keys(result)
        for(var i = 0; i < keys.length; i++){
            var item = result[keys[i]]
            var key = keys[i]

            if(!(item instanceof Array) || item.length === 0){
                continue
            }

            if(item.length === 1){
                var val = item[0]
                if(typeof val === 'object'){
                    message[key] = formatMessage(val)
                } else {
                    message[key] = (val || '').trim()
                }
            } else {
                message[key] = []
                for(var j = 0; j < item.length; j++){
                    message[key].push(formatMessage[item[j]])
                }
            }
        }
    }
    return message
}

exports.formatMessage = formatMessage

exports.tpl = function(content, message) {
    var info = {}
    var type = 'text'
    var FromUserName = message.FromUserName
    var ToUserName = message.ToUserName
    if(Array.isArray(content)) {
        type = 'news'
    }
    type = content.type || type
    info.content = content
    info.CreateTime = new Date().getTime()
    info.FromUserName = ToUserName
    info.ToUserName = FromUserName
    info.MsgType = type
    return tpl.compiled(info)
}