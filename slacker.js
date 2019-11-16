var request = require('request');
var config = require('./config');

module.exports = function(channel, message) {

    var targetChannel = "#" + channel;
    
    if (process.env.DEBUG_SLACK_CHANNEL) {
        targetChannel = "#" + process.env.DEBUG_SLACK_CHANNEL;
    }

    payload = { "channel" : targetChannel,
                "username" : "pmbot",
                "text" : message,
                "icon_emoji" : ":rd",
                "unfurl_links" : true
              };

    var options = {
                   method: 'post',
                   body: payload,
                   json: true,
                   url: config.slackUrl
    };

    request(options, function (err, res, body) {
        if (err) {
            console.log(err, 'error posting json');
            return
        }
        console.log("Sucessfully posted to Slack");      
    });   
}
