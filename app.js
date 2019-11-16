var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var mongoose = require('mongoose');

require('dotenv').config();

var config = require('./config');



mongoose.connect(config.mongoUrl);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'db connection error'));

db.once('open', function() {
    // Connection made
    console.log("Connected to server correctly!");
});

// Routes
var applicationRoute = require('./routes/applicationRouter');
var projectRoute = require('./routes/projectRouter');

var app = express();

app.locals.sprintf = require('sprintf').sprintf;
app.locals.timeformat = "%02d:00";

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Uncomment after placing you favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());

// If you want authentication use Passport here

app.use(express.static(path.join(__dirname, 'public')));

// Use the routes here
app.use('/', applicationRoute);
app.use('/projects', projectRoute);


var deadline_reminder = require('./deadline_reminder').cron;
var mark_past_due = require('./mark_past_due').cron;
var send_project_updates = require('./send_project_updates').cron;


/**
 *  Set up three crons:
 *  deadline_reminder - remind teams of upcoming deadlines
 *  mark_past_due - mark incomplete active tasks as past due if deadline passed
 *  send_project_updates - send project status update to client(s)
 **/

var CronJob = require('cron').CronJob;
var job1 = new CronJob({
  cronTime: '00 15 10 * * 1-5',
  onTick: function() {
    deadline_reminder()
  },
  start: false,
  timeZone: 'Asia/Shanghai'
});

var job2 = new CronJob({
  cronTime: '00 01 00 * * 1-5',
  onTick: function() {
    mark_past_due()
  },
  start: false,
  timeZone: 'Asia/Shanghai'
});
 
/*
var job3 = new CronJob({
  cronTime: '00 05 * * * 1-5',
  onTick: function() {
    send_project_updates()
  },
  start: false,
  timeZone: 'Asia/Shanghai'
});
*/
job1.start();
job2.start();
//job3.start();


// Catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Error handlers

// Development error handler - will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
          message: err.message,
          error: err
        });
    });
}

// Production error handler - will not print stacktrace
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {}
    });
});

module.exports = app;
