var config = require('./config');
var Projects = require('./models/projects');

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

    var deliverables = project.deliverables;

    var today = convertDateToCST(new Date());
    today.setHours(0,0,0,0);
    
    for (idx in deliverables) {
        deliverable = deliverables[idx];
        deliverableDueDate = convertDateToCST(new Date(deliverable.due_date));
        deliverableDueDate.setHours(0,0,0,0);
        
        var timeDiff = deliverableDueDate.getTime() - today.getTime();
        
        // Check the date for deliverables
        if (timeDiff < 0 && !deliverable.is_delivered && !deliverable.past_due) {
            deliverable.past_due = true;
            update_deliverable(project.id, deliverable);
        }
    }

}

function update_deliverable(projectId, deliverable) {
    Projects.findById(projectId, function (err, project) {
        project.deliverables.id(deliverable.id).remove();

        project.deliverables.push(deliverable);
        project.deliverables.sort(sort_by('due_date', false, function(a){return new Date(a).getTime()}));

        project.save(function(err, resp) {
            if (err) throw err;
        });
    });
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

function convertDateToCST(dateObj) {
    var cstOffset = moment.tz(dateObj, 'Asia/Shanghai').utcOffset();
    var cstDate = new Date(dateObj.getTime() + cstOffset*60000);

    return cstDate;
}
