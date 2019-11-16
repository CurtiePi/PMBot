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
* title: {type: String, required: true, unique: true}
* description: {type: String}
* is_on_hold: {type: Boolean, default: false}
* is_archived: {type: Boolean, default: false}
* send_updates: {type: Boolean, default: false}
* send_update_day: {type: Number, default: 2}
* send_update_time: {type: Number, default: 9}
* slackchannel: {type: String}
* kickoff_date: {type: Date}
* huboard_link: {type: String}
* ghrepo: {type: String}
* rdbiz_link: {type: String}
* contacts: [contactSchema],
* deliverables: [deliverableSchema]
    
_**Note**_: The **send_update_day** and **send_update_time** fields are used to decide when contacts should get project
updates.
    
**deliverableSchema**: The task to be performed
* asset: {type: String, required: true}
* start_date: {type: Date}
* due_date: {type: Date}
* past_due: {type: Boolean, default: false}
* is_delivered: {type: Boolean, default: false}

**contactSchema**: The contact for a given project
* name: {type: String, required: true}
* email: {type: String}
* phone: {type: String}
* skype: {type: String}
* wechat: {type: String}
* is_update_recipient: {type: Boolean, default: false}
* update_method: {type: String, default: "email"}

_**Note**_: The **is_update_recipient** and **update_method** fields are used to distinguish which contacts should get project
updates and in what format. This was not fully implemented as on the email method was operational.


## Backend Overview

The backend is primarily an Express engine that basically uses Mongoose to shuttle data to and from the database. It also uses 
two routers, an application router, to handle events like signing in and logging out, as well as a project router which handles events like starting a new project or adding a task to an existing project.

The application router used to use a middleware component located in **public/javascripts/utilities.js** called _protect_ which checked the person signing in against the company database and check the role of the user. I removed that call after leaving the company, but the code is still in there.

The project router simply executes the required action based on the request.

There are also three cronjobs that are set up in **app.js**

* deadline_reminder - remind teams of upcoming deadlines
* mark_past_due - mark incomplete active tasks as past due if deadline passed
* send_project_updates - send project status update to client(s)

The cronjobs are scheduled to posts daily at 10:15 into project chats (**slackchannel** in the schema)

_**Note**_: Since this was written prior to the advent of Promises and async/wait, a lot of the code in the routers make use
of callbacks.

## Frontend Overview
The frontend uses Pug framework and consist of, but not limited to, 5 main pages:
* contactEditForm.pug: Edit the contact informtion
* deliverableEditForm.pug: Edit task information
* projectDetail.pug: Display project details
* projectForm.pug: Create project details
* projectList.pug: List projects

The **contactEditForm.pug** and **deliverableEditForm.pug** each use an include **contactForm.pug** and		**deliverableForm.pug** respectively. In conjunction with **public/javascript/project_js.js** multiple contacts and deleverables can be created and edited for a project without losing state information.


## Install locally
You should be able to clone this to a directory. You'll need to set up a MongoDB server and database. If you are not running Slack then you can remove/comment out the cronjob related to sending info to Slack, otherwise you'll need to cofigure a slack channel to receive posts from a 3rd party.

Also you will need to locally create a file called `.env` in the root and set properties for example:

```
MONGODB_URI='mongodb://localhost:localport/collection_name'
PORT=4444
DEBUG_SLACK_CHANNEL='slack_channel'
```
* MONGODB_URI: Path to MongoDB collection
* PORT: Port you are running application on
* DEBUG_SLACK_CHANNEL: Slack channel you want to post to (only use one channel for testing)

### Caveat
This is trully old code that wasn't needed after I left ReignDesign. It was designed by me for me as a way to learn NodeJs, help out with my duties and to keep from being bored (my duties did not include coding). I haven't tested this code in over three years, so if you download it and it works, huzzah. If you want to use it and you're have problems please feel free to contact me and I'll help fix whatever needs fixing. This was a fairly simple application, and with the advent of Promises and async/wait, I would definitely do things differently today.
