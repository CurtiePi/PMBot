var config = require('./config');
var Projects = require('./models/projects');
var slacker = require('./slacker');
var moment = require('moment-timezone');

var format = require('util').format;
var assert = require('assert');
var async = require('async');

var cron = function(){
    var projectsFound = false;

    Projects.find({'is_archived' : false, 'is_on_hold' : false})
        .exec(function(err, projects) {
            if (err) {
               return console.log(err);
            }

            projectsFound = true;
            for (idx in projects){
                process_project(projects[idx]);
                // In here we want to send out the messages on a per project basis
            }
        });

    async.until(
        function() { return projectsFound; },
        function(callback) {
           setTimeout(function() {
               callback(null, projectsFound);
           }, 500);
        },
        function(err, isDefined) {
            if (err) return console.log(err);

        
        }
    );

};

module.exports = {cron:cron};

function process_project(project) {

    var deliverables  = project.deliverables;

    var today = convertDateToCST(new Date());

    var weekLater = new Date(today.getTime());
    weekLater.setDate(weekLater.getDate() + 7);
    
    var pastCount = 0;
    var sevenDayCount = 0;

    var allDeliverables = [ ];
    for (var idx=0; idx < deliverables.length; idx++) {
        deliverable = deliverables[idx];
        var deliverableDueDate = new Date(deliverable.due_date);
        deliverableDueDate = convertDateToCST(deliverableDueDate);

    
        // Get deliverables within next 7 days from future deliverables
        if (weekLater.getTime() > deliverableDueDate.getTime() && today.getTime() < deliverableDueDate.getTime()) {
            allDeliverables.push(deliverable);
            sevenDayCount++;
        } 

        // Get any past due deliverables
        if (!deliverable.is_delivered && (deliverable.past_due || today.getTime() > deliverableDueDate.getTime())) {
            allDeliverables.push(deliverable);
            pastCount++;
        }

        if (deliverable.is_delivered) {
            pastCount++;
        }
    }

    // If sevenDayCount == 0 then next is more than 7 days away
    if (sevenDayCount == 0 && pastCount < deliverables.length) {
        // Sort deliverables.
        deliverables.sort(sort_by('due_date', false, function(a){return new Date(a).getTime()}));
        allDeliverables.push(deliverables[pastCount]);
    }

    allDeliverables.sort(sort_by('due_date', false, function(a){return new Date(a).getTime()}));
    
    // See how people like a more basic greeting 
    var greeting = "Deliverable Status for *" + project.title + "*\n"; 
    greeting += new Array(Math.ceil(greeting.length * 1.3) + 1).join("¯");
    greeting += "\n"; 
    var message = create_message(allDeliverables, project.id);
    var footer = "\n<https://rdpmbot.herokuapp.com/projects/" + project.id + "/deliverables|See All Deliverables>";

    if (!message) {
        console.log("No deliverables left");
        return;
    }
 

    message = greeting + message + footer;

    if (today.getDay() == 5) {
      var subfooter = "\n\n<http://bizdev.reigndesign.com/timesheets|Please update your timesheets for the week before you leave today>";
      message += subfooter;
    }

    slacker(project.slackchannel, message);
}

function create_message(sortedDeliverables, projectId) {
    
    var todaysDate = convertDateToCST(new Date());
    todaysDate.setHours(0,0,0,0);

    var nextHeader = "\n*Next Deadline(s)*:\n";
    var upcomingHeader = "\n*Upcoming Deadline(s)*:\n";
    var pastDueHeader = "*Past Due Deadline(s)*:\n";
    var nextMessage = "";
    var pastDueMessage = "";
    var upcomingMessage = "";

    var message = "";
    var idx = 0;
  
    while(idx < sortedDeliverables.length) {
        var isNext = false;
        var deliverable = sortedDeliverables[idx];

        var deliveryDate = new Date(deliverable.due_date);
        var deliveryDate = convertDateToCST(deliveryDate);
        deliveryDate.setHours(0,0,0,0);
        
        var isPast = todaysDate.getTime() > deliveryDate.getTime();

        if (!isPast) {
            if (nextMessage.length == 0) {
                var firstFutureDate = deliveryDate;
                isNext = true;
            } else if (deliveryDate.getDate() == firstFutureDate.getDate()) {
                isNext = true;
            } else {
                isNext = todaysDate.getDate() == deliveryDate.getDate();
            }
        }

        // Build the message.
        message += "\t";
        message += deliverable.asset;
        message += " on ";
        message += format_date_with_relevence(deliverable.due_date); 
        
        if (isPast ) {
            pastDueMessage += message;
            pastDueMessage += " <https://rdpmbot.herokuapp.com/projects/" + projectId + "/deliverables/" + deliverable.id  + "/markdelivered|Mark as delivered>\n";
        }

        if (isNext) {
            nextMessage += message + "\n";
        }

        if (!isPast && !isNext) {
            upcomingMessage += message + "\n";
        }
         
        message = "";
        idx++; 
    }

    message = "";
    if (pastDueMessage.length > 0) {
        message += pastDueHeader + pastDueMessage;
    }
    if (nextMessage.length > 0) {
        message += nextHeader + nextMessage;
    }
    if (upcomingMessage.length > 0) {
        message += upcomingHeader + upcomingMessage;
    }

    return message;
}

var sort_by = function(field, reverse, primer){

   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = !reverse ? 1 : -1;

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     } 
}

function format_date_with_relevence(inputDateString) {
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat'];

    var dateObj = new Date(inputDateString);
    dateObj = convertDateToCST(inputDateString);
    dateObj.setHours(0,0,0,0);

    var today = convertDateToCST(new Date());
    today.setHours(0,0,0,0);    

    var timeDiff = dateObj.getTime() - today.getTime();
    var diffDays = Math.ceil(Math.abs(timeDiff) / (1000 * 3600 * 24));

    var dateString = days[dateObj.getDay()];
    dateString += " " + months[dateObj.getMonth()];
    dateString += " " + ordinal_suffix_of(dateObj.getDate());

    if (timeDiff == 0){
          dateString += " (Today)";
    } else if (timeDiff > 0) {
           dateString += " (in " + diffDays + ((diffDays > 1) ? " days)" : " day)");
    } else{
       dateString += " ( " + diffDays + ((diffDays > 1) ? " days ago)" : " day ago)");
    }

    return dateString;    
}

function ordinal_suffix_of(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}

function convertDateToCST(dateObj) {
    var cstOffset = moment.tz(dateObj, 'Asia/Shanghai').utcOffset();
    var cstDate = new Date(dateObj.getTime() + cstOffset*60000);

    return cstDate;
}

function convertDateToUTC(date) { 
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()); 
}

function underlineText(textToUnderline) {
    var underlinedText = "";

    for (var idx = 0; idx < textToUnderline.length; idx++){
        underlinedText += textToUnderline[idx] + '\u0332';
    }

    return underlinedText;
}
