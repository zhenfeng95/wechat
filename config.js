'use strict'

var path = require('path')
var utils = require('./libs/utils.js')
var wechat_file = path.join(__dirname, './config/wechat.txt')
var wechat_ticket_file = path.join(__dirname, './config/wechat_ticket.txt')

var config = {
    wechat: {
        appID: 'wx9c19e34d691f3227',
        appsecret: '50a9fbb989fcaf046938b4968a8b2376',
        token: 'zzfreallyhandsomeman',
        getAccessToken: function() {
            return utils.readFileAsync(wechat_file)
        },
        saveAccessToken: function(data) {
            data = JSON.stringify(data)
            return utils.writeFileAsync(wechat_file, data)
        },
        getTicket: function() {
            return utils.readFileAsync(wechat_ticket_file)
        },
        saveTicket: function(data) {
            data = JSON.stringify(data)
            return utils.writeFileAsync(wechat_ticket_file, data)
        }
    }
}

module.exports = config