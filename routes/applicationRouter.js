var express = require('express');
var bodyParser = require('body-parser');


var applicationRouter = express.Router();
module.exports = applicationRouter;

applicationRouter.use(bodyParser.json());


applicationRouter.route('/')
.get(function(req, res, next) {
    res.redirect("/projects")
});

applicationRouter.route('/test')
.get(function(req, res, next) {
    res.render('test', {title: 'Test'});
});

applicationRouter.route('/unauthorized')
.get(function(req, res, next) {
    res.render('unauthorized', {title: 'Unauthorized'});
});

