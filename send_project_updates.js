'use strict';
var request = require('request') ;
var Promise = require('bluebird');

var config = require('./config');
var md5 = require('md5');
var Projects = require('./models/projects');

var format = require('util').format;
var mongoose = require('mongoose');
mongoose.Promise = Promise;
var nodemail = require('nodemailer');
var sendmail = require('sendmail')();
var smtpTransport = require('nodemailer-smtp-transport');

var cron = function(){
    console.log("Starting to send out the project updates");
    var db = mongoose.createConnection(config.mongoUrl);
    //var db = mongoose.connection;

    let foundPromise = Projects.find({'send_updates': true, 'is_archived': false, 'is_on_hold': false}).exec()
                               .then(function (projects) {
                                   db.close();
                                   return buildRequestArray(projects);
                                })
                               .then(function(requestData){
                                       Promise.mapSeries(requestData, function(projectData) { getIssuesFromGithub(projectData)});
                                       //processProjectData(requestData);
                                })
                               .done(db.close());
};

module.exports = {cron:cron};

function buildRequestArray(projects){
    console.log("Building to the request array");
    var requestArray = [ ];
    for (var idx in projects) {
        var project = projects[idx];
        if(isValidDayAndTime(project.send_update_day, project.send_update_time)) {
            var recipients = getProjectRecipients(project.title, project.contacts);
            requestArray.push({'title': project.title,
                               'repo': project.ghrepo,
                               'recipient': recipients,
                               'data': []
                              }); 
        }
    }
    return requestArray;
}

function getProjectRecipients(title, contacts){
    console.log("Retriving the recipients of project updates");
    var contactArray = [ ];
    for (var idx in contacts) {
        var contact = contacts[idx];
        if (contact.is_update_recipient) {
            var contactObj = {'name': contact.name};
            switch(contact.update_method){
                case "email":
                   contactObj.email = contact.email;
                   break;
                case "wechat":
                   contactObj.wechat = contact.wechat;
                   break;
                case "basecamp":
                   contactObj.basecamp = title;
                   break;
            }
            contactArray.push(contactObj);
        }
    }
    return contactArray;
}


function isValidDayAndTime(dayParam, timeParam){
var today = new Date();
var todayInt = today.getDay();
var todayTimeInt = today.getHours();

var dayInit;
var validDays = [ ];

for(var day = 6; day > -1; day--){
    dayInit = Math.pow(2, day);
    if (dayParam >= dayInit) {
        if(-1 < (dayParam - dayInit)) {
            validDays.push(Math.log(dayInit)/Math.log(2));
            dayParam -= dayInit;
        } 
    }
}
    var validDay = validDays.indexOf(todayInt) > -1;
    var validTime = timeParam == todayTimeInt;
    return validDay && validTime;
    //return true;
}


function getIssuesFromGithub(projectObj, pageNumber=1){
    console.log("Retriving the issues from github");
    var queryObj = {'state': 'all',
                    'page': pageNumber,
                    'per_page': 100,
                   };

    var url = 'https://api.github.com/repos/reigndesign/' + projectObj.repo + '/issues';
 
    var options = {'url': url,
                   'method': 'GET',
                   'headers': {'User-Agent': 'TheLonliestMonnk'},
                   'auth': {'bearer': 'a26e3662470e9aa37a59ea1f01197114747cd543'},
                   'qs': queryObj
                  };

    return new Promise(function (resolve) {           
        request(options, function (error, response, body) {
   
            var issues = JSON.parse(body);
       
            projectObj.data = issues.concat(projectObj.data);
            var paginationInfo = response['headers'].link;
            if(paginationInfo.indexOf("next") != -1){
                var re = /page=(\d+)/;
                var match = re.exec(paginationInfo);
                var pageNumber = parseInt(match[1]);

                getIssuesFromGithub(projectObj, pageNumber);
            }else {
              resolve(projectObj);
            }
        });
    })
    .then(function (results) {
        return results;
    })
    .then(function(projectData) {
      return processData(projectData);
    }).then(function(filteredProjectData) {
      return createMessage(filteredProjectData);
    }).then(function(projectMessage) {
      return transmitMessage(projectMessage);
    });
}

function processProjectData(projectDataArray){
console.log("Processing the project data array");
    Promise.mapSeries(projectDataArray, function(projectData) { getIssuesFromGithub(projectData)});
}

function getIssueLabels(issueLabels) {

    var labelArray = [];

    for (var labelKey in issueLabels) {
        var labels = issueLabels[labelKey];

        labelArray.push(labels.name);
    }

    return labelArray;
}

function processData(projectData) {
   console.log("Processing the project data retrieved from github");
   var resultObj = {};
   var issuesObj = projectData.data;
   var weekAgo = new Date();
   weekAgo.setDate(weekAgo.getDate() - 7);

   for (var key in issuesObj) {
       var val = issuesObj[key];

       var issueLabels = getIssueLabels(val.labels);

       if (issueLabels.indexOf('HIDE') != -1) {
           continue;
       }


       for (var idx = 0; idx < issueLabels.length; idx++) {
           var labels = issueLabels[idx];
           var re = /^\d+\s-\s(\w+)$/;

           var match = re.exec(labels);

           if (match) {
             var label = match[1];
             var isFinished = label == 'Finish';                
             var isClosed = val.state == 'closed';                

             if(isClosed) {
                 var closedDate = new Date(val.closed_at);
                 if ((!isFinished) || closedDate.getTime() < weekAgo.getTime()) {
                     continue;
                 }
             }

             if(!resultObj[label]) {
                 resultObj[label] = [];
             }
             resultObj[label].push("Ticket: " + val.number + " - " + val.title);

           }
       }
   }

   projectData.data = resultObj;
   return projectData;
}

function createMessage(projectData) {
    console.log("Creating the project update message");
    var recipients = projectData.recipient;
    var emailMessageCreated = false;
    var wechatMessageCreated = false;
    var basecampMessageCreated = false;

    for (var idx in recipients) {
       var recipient = recipients[idx];
       if (recipient.email && !emailMessageCreated) {
           projectData.emailMessage = createEmailMessage(projectData);
           emailMessageCreated = true;
       }else if (recipient.wechat && !wechatMessageCreated) {
           projectData.wechatMessage = createWechatMessage(projectData);
           weChatMessageCreated = true;
       }else if (recipient.basecamp && !basecampMessageCreated) {
           projectData.basecampMessage = createBaseCampMessage(projectData);
           basecampMessageCreated = true;
       } 
    }
    return projectData;
}

function getHuboardLink(projectName) {
     var link = 'http://hub.reigndesign.com/project/';
     link += md5(projectName + "rdasdjalskdj");
     link += "/" + projectName;

     return link;
}

function createEmailMessage(projectData) {
    var labelArray = ['Backlog',
                      'Design',
                      'Ready',
                      'Development',
                      'Test',
                      'Finish'];

    var emailContent = '<h1>Current Status of ' + projectData.title + ' Tickets</h1><p>';

    for (var idx = 0; idx < labelArray.length; idx++){
        var heading = labelArray[idx];

        var labelText = projectData.data[heading];


        if (!labelText){
            continue;
        }

        emailContent += '<h2>' + heading + '</h2>';

        if (labelText.length == 0) {
            emailContent += '<p>Currently no tickets with this status</p>';
        }
        else {
            emailContent += '<ul>'; 
            for (var tIdx = 0; tIdx < labelText.length; tIdx++){
                emailContent += '<li>' + labelText[tIdx] + '</li>';
            }
            emailContent += '</ul><p>'; 
        }
    }

    emailContent += '<p><a href=';
    emailContent += getHuboardLink(projectData.repo);
    emailContent += ' target="new">View the complete Huboard</a>'

    return emailContent;
}

function createBasecampMessage(projectData){
    return createEmailMessage(projectData);
}

function createWechatMessage(projectData){
    return createEmailMessage(projectData);
}

function getRecipientList(contacts, method) {
    var recipientList = '';

    for (var idx in recipients) {

       var recipient = recipients[idx];

       if(recipient[method]){
           recipientList += recipient[method] + ', ';
       }
    }

    if (", " == recipientsList.slice(recipientList.length - 2)) {
        recipientList = recipientList.slice(0, recipientList.length - 2);
    }
    return recipientList;
}

function transmitMessage(projectData) {
    console.log("Sending the project update message");
    var recipients;

    recipients = "curtis@reigndesign.com, april@reigndesign.com";

    if (projectData.emailMessage) {
      //  recipients = getRecipientList(projectData.recipient, "email");
        if (recipients.length > 0) {
            sendViaEmail(projectData.title, projectData.emailMessage, recipients);
        }
    }

    if (projectData.weChatMessage) {
     //   recipients = getRecipientList(projectData.recipient, "wechat");
        if (recipients.length > 0) {
            sendViaWeChat(projectData.title, projectData.weChatMessage, recipients);
        }
    }

    if (projectData.basecampMessage) {
     //   recipients = getRecipientList(projectData.recipient, "basecamp");
        if (recipients.length > 0) {
            sendViaBasecamp(projectData.title, projectData.basecampMessage, recipients);
        }
    } 
    return projectData;
}

function sendViaEmail(title, content, recipients) {
    var transporter = nodemail.createTransport(smtpTransport({
        service: 'gmail',
        auth: {
            user: 'android@reigndesign.com',
            pass: 'shanghai88'
        }
    }));

    var mailOptions = {
        from: 'android@reigndesign.com;',
        to: recipients,
        subject: title + ' Ticket Status',
        html: content,
    };

    transporter.sendMail(mailOptions, function (error, info) {
           if (error){
               console.log('Error: ' + error);
           }

           console.log('Message %s sent: %s', info.messageId, info.response);
    })
}


function sendViaWeChat(title, content, recipients) {

}

function sendViaBasecamp(title, content, recipients) {

}
