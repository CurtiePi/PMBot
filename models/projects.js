var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var deliverableSchema = new Schema({
    asset: {
        type: String,
        required: true
    },
    start_date: {
        type: Date
    },
    due_date: {
        type: Date
    },
    past_due: {
        type: Boolean,
        default: false
    },
    is_delivered: {
        type: Boolean,
        default: false
    }
});

var contactSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    phone: {
        type: String
    },
    skype: {
        type: String
    },
    wechat: {
        type: String
    },
    is_update_recipient: {
        type: Boolean,
        default: false
    },
    update_method: {
        type: String,
        default: "email"
    }
});

var projectSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    is_on_hold: {
        type: Boolean,
        default: false
    },
    is_archived: {
        type: Boolean,
        default: false
    },
    send_updates: {
        type: Boolean,
        default: false
    },
    send_update_day: {
        type: Number,
        default: 2
    },
    send_update_time: {
        type: Number,
        default: 9
    },
    slackchannel: {
        type: String
    },
    kickoff_date: {
        type: Date
    },
    huboard_link: {
        type: String
    },
    ghrepo: {
        type: String
    },
    rdbiz_link: {
        type: String
    },
    contacts: [contactSchema],
    deliverables: [deliverableSchema]
});

var Projects = mongoose.model('Project', projectSchema);

module.exports = Projects;
