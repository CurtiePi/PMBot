# Curtis's RD PM bot

## Overview
This is an old project that I used to learn NodeJS. It was implemented on ReignDesign (a company I had previously worked for)
servers. When I left ReignDesign I was allowed to take the code since it was written by me to help with my project management 
duties there.

Basically this is a project management tool that allows the user to enter in project information. That information is stored
in a MongoDB database and the system autmatically checks to see which tasks in various projects are upcoming or overdue
and sends automated messages to the teams working on those tasks via Slack.

This project relies on the Express, Bootstrap, Mongoose frameworks.

## Models (a.k.a Schema)

**projectSchema**: Information as pertaining to a project
    title: {type: String, required: true, unique: true}
    description: {type: String}
    is_on_hold: {type: Boolean, default: false}
    is_archived: {type: Boolean, default: false}
    send_updates: {type: Boolean, default: false}
    send_update_day: {type: Number, default: 2}
    send_update_time: {type: Number, default: 9}
    slackchannel: {type: String}
    kickoff_date: {type: Date}
    huboard_link: {type: String}
    ghrepo: {type: String}
    rdbiz_link: {type: String}
    contacts: [contactSchema],
    deliverables: [deliverableSchema]
    
_**Note**_: The **send_update_day** and **send_update_time** fields are used to decide when contacts should get project
updates.
    
**deliverableSchema**: The task to be performed
    asset: {type: String, required: true}
    start_date: {type: Date}
    due_date: {type: Date}
    past_due: {type: Boolean, default: false}
    is_delivered: {type: Boolean, default: false}

**contactSchema**: The contact for a given project
    name: {type: String, required: true}
    email: {type: String}
    phone: {type: String}
    skype: {type: String}
    wechat: {type: String}
    is_update_recipient: {type: Boolean, default: false}
    update_method: {type: String, default: "email"}

_**Note**_: The **is_update_recipient** and **update_method** fields are used to distinguish which contacts should get project
updates and in what format. This was not fully implemented as on the email method was operational.





Posts daily at 10:15 into project chats

To test this locally create a file called `.env` in the root and set properties for example:

```
MONGODB_URI='mongodb://localhost:27017/rdshanghai'
PORT=4444
DEBUG_SLACK_CHANNEL='flummoxed'
```
