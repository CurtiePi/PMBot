var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var dateFormat = require('dateformat');

var Projects = require('../models/projects');

var slacker = require('../slacker');

var projectRouter = express.Router();
module.exports = projectRouter;

projectRouter.use(bodyParser.json());

/*
 * General Project Routes
 */

projectRouter.route('/')
.get(function(req, res, next) {
    console.log('Get the projects.');
    Projects.find({'is_archived' : false})
        .exec(function (err, project) {

            if (err) throw err;

            res.render('projects/projectList', {title: 'Projects List', projects: project}); 
    });
});

var deadline_reminder = require('../deadline_reminder').cron;

projectRouter.route('/sendall')
.get(function(req, res, next) {
    deadline_reminder();
    res.redirect("/");
});

projectRouter.route('/create')
.get(function(req, res, next) {
    res.render('projects/projectForm', {title: 'Add New Project'});
})
.post (function(req, res, next) {
    console.log('Add new project.');
    Projects.create(req.body, function(err, project) {
        res.set('Content-Type', 'text/html');
        res.send('/projects/' + project.id);
        console.log('Added another project with id: ' + project.id);
    });
});

/*
 * Specific Project Routes
 */

projectRouter.route('/:pid')
.get(function(req, res, next) {
    console.log('Get project with id '+ req.params.pid);

    Projects.findById(req.params.pid)
        .exec(req.body, function (err, project) {
        if (err) throw err;

        console.log('Project found!');

        dateFormat.masks.abbrDate = 'ddd mmm dS, yyyy';
        formatDateString = function (dateString) {
            var dateObj = new Date(dateString);
            return dateFormat(dateObj, "abbrDate");    
        }
        res.render('projects/projectDetail', {title: 'Info for ' + project.title, project: project, formatDateToReadable: formatDateString});
    });
})
.put(function(req, res, next) {
    console.log('Update project with id ' + req.params.pid);
    Projects.findByIdAndUpdate(req.params.pid, {
        $set: req.body
    }, {
        new: true
    }, function (err, project) {
            if (err) throw err;

            console.log('Updated another project with id: ' + project.id);
            res.set('Content-Type', 'text/html');
            res.send('/projects/' + project.id);
    });
})
.delete(function(req, res, next) {
    console.log('Delete project with id ' + req.params.pid);
});


projectRouter.route('/:pid/edit')
.get(function(req, res, next) {
    console.log('Get project with id '+ req.params.pid);
    Projects.findById(req.params.pid)
        .exec(req.body, function (err, project) {
        if (err) throw err;
        console.log('Project found!');
        res.render('projects/projectForm', {title: 'Edit Project Info', project: project});
    });
});

/*
 * General Project Deliverable Routes
 */

projectRouter.route('/:pid/deliverables')
.get(function(req, res, next) {
    res.redirect("../"+req.params.pid)
})
.post(function(req, res, next) {
    console.log('Add deliverable to project with id ' + req.params.pid);
})
.delete(function(req, res, next) {
    console.log('Delete all deliverabls in project with id ' + req.params.pid);
});

/*
 * Specific Project Deliverable Routes
 */

projectRouter.route('/:pid/deliverables/:dlid/edit')
.get(function(req, res, next) {
    console.log("getting a deliverable for edit");
    Projects.findById(req.params.pid)
        .exec(function (err, projects) {
        if (err) throw err

        var deliverable = projects.deliverables.id(req.params.dlid);
        res.render('projects/deliverableEditForm', {title: 'Edit Deliverable', projectId: req.params.pid, deliverable: deliverable});
    });
});

projectRouter.route('/:pid/deliverables/:dlid/markdelivered')
.get(function(req, res, next) {
    console.log("marking deliverable " + req.params.dlid + " as delivered");
    Projects.findById(req.params.pid)
        .exec(function (err, project) {
        if (err) throw err

        var deliverable = project.deliverables.id(req.params.dlid);
        deliverable.is_delivered = true;
        deliverable.past_due= false;

        project.deliverables.id(req.params.dlid).remove();


        console.log('Deliverable updated, removed and being replaced');
        project.deliverables.push(deliverable);

        project.deliverables.sort(function(a, b) {
            aTime = new Date(a.due_date).getTime();
            bTime = new Date(b.due_date).getTime();

            return (aTime > bTime) - (bTime > aTime);
        });

        var message = 'Deliverable *' + deliverable.asset + '* has been MARKED AS DELIVERED.'; 

        project.save(function (err, project) {
            if (err) throw err;

            console.log('Project updated and saved');
            slacker(project.slackchannel, message);
            //res.redirect('/projects/' + project.id + '/deliverables');
            res.end();
        });
    });
});

projectRouter.route('/:pid/deliverables/:dlid')
.get(function(req, res, next) {
    console.log('Get deliverable with id ' + req.params.dlid + ' in project with id '+ req.params.pid);
})
.put(function(req, res, next) {
    console.log('Update deliverable with id ' + req.params.dlid + ' in project with id ' + req.params.pid);
    Projects.findById(req.params.pid, function (err, project) {
        if (err) throw err;

        project.deliverables.id(req.params.dlid).remove();

        project.deliverables.push(req.body);
        
        project.deliverables.sort(function(a, b) {
            aTime = new Date(a.due_date).getTime();
            bTime = new Date(b.due_date).getTime();

            return (aTime > bTime) - (bTime > aTime);
        });

        project.save(function (err, project) {
            if (err) throw err;
             
            res.set('Content-Type', 'text/html');
            res.send('/projects/' + project.id);
        });
    });
})
.delete(function(req, res, next) {
    console.log('Delete deliverable with id ' + req.params.dlid + ' from project with id ' + req.params.pid);
});

/*
 * General Project Contact Routes
 */

projectRouter.route('/:pid/contacts')
.get(function(req, res, next) {
    console.log('Get contacts for project with id '+ req.params.pid);
})
.post(function(req, res, next) {
    console.log('Add contact to project with id ' + req.params.pid);
})
.delete(function(req, res, next) {
    console.log('Delete all contact in project with id ' + req.params.pid);
});

/*
 * Specific Project Contact Routes
 */

projectRouter.route('/:pid/contacts/:cid')
.get(function(req, res, next) {
    console.log('Get contact with id ' + req.params.cid + ' for project with id '+ req.params.pid);
})
.put(function(req, res, next) {
    console.log('Update contact with id ' + req.params.cid + ' in project with id ' + req.params.pid);
    Projects.findById(req.params.pid, function (err, project) {
        if (err) throw err;

        project.contacts.id(req.params.cid).remove();

        project.contacts.push(req.body);
        
        project.save(function (err, project) {
            if (err) throw err;
             
            res.set('Content-Type', 'text/html');
            res.send('/projects/' + project.id);
        });
    });
})
.delete(function(req, res, next) {
    console.log('Delete contact with id ' + req.params.cid + ' from project with id ' + req.params.pid);
    Projects.findById(req.params.pid, function (err, project) {
        if (err) throw err;

        project.contacts.id(req.params.cid).remove();

        
        project.save(function (err, project) {
            if (err) throw err;
             
            res.set('Content-Type', 'text/html');
            res.send('/projects/' + project.id);
        });
    });
});

projectRouter.route('/:pid/contacts/:cid/edit')
.get(function(req, res, next) {
    console.log("getting a deliverable for edit");
    Projects.findById(req.params.pid)
        .exec(function (err, projects) {
        if (err) throw err

        var contact = projects.contacts.id(req.params.cid);
        res.render('projects/contactEditForm', {title: 'Edit Contacts', projectId: req.params.pid, contact: contact});
    });
});

