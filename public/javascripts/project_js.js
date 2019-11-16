

function delete_project(projectid, projectname){
    if (confirm('Are you sure you want to delete ' + projectname + '?')){
        var href = "/projects/" + projectid;

        makeAjaxRequest(href, 'DELETE');

    } else {
         //Do Nothing
    }
}


function insert_contact() {
    var name = document.projectForm.name.value;
    var email = document.projectForm.email.value;
    var phone = document.projectForm.phone.value;
    var skype = document.projectForm.skype.value;
    var wechat = document.projectForm.wechat.value;
    var isRecipient = document.projectForm.is_update_recipient.value;
    var um = document.projectForm.update_method;
    var updateMethod = um.options[um.selectedIndex].value;

    if (typeof contacts === 'undefined') {
        contacts = new Contacts();
    }

    var identifier = contacts.addContact(name, email, phone, skype, wechat, isRecipient, updateMethod);

    build_contact_card(name, email, phone, skype, wechat, isRecipient, updateMethod, identifier);

    document.projectForm.name.value = "";
    document.projectForm.email.value = "";
    document.projectForm.phone.value = "";
    document.projectForm.skype.value = "";
    document.projectForm.wechat.value = "";
    document.projectForm.is_update_recipient = false;
    document.projectForm.update_method.selectedIndex = 0; 
}

//This is for loading an already existing project's contacts
function load_contact(contactId, name, email, phone, skype, wechat, is_update_recipient, update_method, isEditable=false) {
    if (typeof contacts === 'undefined') {
        contacts = new Contacts();
    }
    var identifier = contacts.addContact(name, email, phone, skype, wechat, is_update_recipient, update_method, contactId);

    // If loading a predefined contact, use the id as the identifier
    build_contact_card(name, email, phone, skype, wechat, is_update_recipient, update_method, contactId, isEditable);
}

function remove_contact(event) {
    var identifier = event.target.parentElement.id;
    contacts.removeContact(identifier);
    remove_card(identifier);
}

function remove_card(identifier) {
     var targetElement = document.getElementById(identifier);
     targetElement.parentNode.removeChild(targetElement);
}

function build_contact_card(name, email, phone, skype, wechat, is_update_recipient, update_method, identifier, isEditable) {
     // Create the basic elements
     var cardDiv = document.createElement("div");
     cardDiv.setAttribute("class", "card panel");
     cardDiv.setAttribute("id", identifier);
     var containerDiv = document.createElement("div");
     containerDiv.setAttribute("class", "container");
     var boldTag = document.createElement("b");
     var headerElement = document.createElement("h4");
     var deleteButton = document.createElement ("button");
     deleteButton.onclick = remove_contact;

     var skypeText = document.createElement("p");
     skypeText.appendChild(document.createTextNode("Skype: " + skype));
     var wechatText = document.createElement("p");
     wechatText.appendChild(document.createTextNode("Wechat: " + wechat));
     var phoneText = document.createElement("p");
     phoneText.appendChild(document.createTextNode("Phone: " + phone));
     var emailText = document.createElement("p");
     emailText.appendChild(document.createTextNode("Email: " + email));
     boldTag.appendChild(document.createTextNode(name));

     containerDiv.appendChild(boldTag);
     containerDiv.appendChild(emailText);
     containerDiv.appendChild(phoneText);
     containerDiv.appendChild(skypeText);
     containerDiv.appendChild(wechatText);

     if(is_update_recipient) {
         var recipient = "Receives updates by " + update_method;
         var boldTagTwo = document.createElement("b");
         boldTagTwo.appendChild(document.createTextNode(recipient));
         containerDiv.appendChild(boldTagTwo);
     }

     cardDiv.appendChild(containerDiv);

     if (isEditable) {
         cardDiv.appendChild(deleteButton);
         var ids = identifier.split("-");
         var link = "/projects/" + ids[0] + "/contacts/" + ids[1] + "/edit";
         var linkElement = document.createElement("a");
         linkElement.appendChild(document.createTextNode("Edit"));
         linkElement.setAttribute("href", link);
         cardDiv.appendChild(linkElement);
     }

     document.getElementById('contactCards').appendChild(cardDiv);
}

function Contacts() {
}

Contacts.prototype.addContact = function(name, email, phone, skype, wechat, isUpdateRecipient, updateMethod, identifier=false) {
    var data = {'name': name,
                'email': email,
                'phone': phone,
                'skype': skype,
                'wechat': wechat,
                'is_update_recipient': isUpdateRecipient,
                'update_method': updateMethod
                };

    if (!identifier) {
        var id = name.replace(/ /g,'') + "_" + Date.now();
    } else {
        var id = identifier;
    }
    this[id] = data;

    return identifier;
};

Contacts.prototype.removeContact = function(identifier) {
    delete this[identifier];
};

Contacts.prototype.getContacts = function() {
    var information = this;
    return Object.keys(information).map(function(key){return information[key]});
};

function insert_deliverable() {
    var asset = document.projectForm.asset.value;
    var start_date = document.projectForm.start_date.value;
    var due_date = document.projectForm.due_date.value;
    var formattedStartDate = formatDateToISO(start_date);
    var formattedDueDate = formatDateToISO(due_date);
    var past_due = document.projectForm.past_due.checked;
    var is_delivered = document.projectForm.is_delivered.checked;

    if (typeof deliverables === 'undefined') {
        deliverables = new Deliverables();
    }

    var identifier = deliverables.addDeliverable(asset, formattedStartDate, formattedDueDate, past_due, is_delivered);
    build_deliverable_card(asset, start_date, due_date, past_due, is_delivered, identifier);

    document.projectForm.asset.value = "";
    document.projectForm.start_date.value = "";
    document.projectForm.due_date.value = "";
    document.projectForm.past_due.checked = false;
    document.projectForm.is_delivered.checked = false;
}

//This is for loading an already existing project's deliverables
function load_deliverable(deliverableId, asset, start_date, due_date, past_due, is_delivered, isEditable=false) {
    if (typeof deliverables === 'undefined') {
        deliverables = new Deliverables();
    }

    var cardStartDate = formatDateToString(start_date);
    var cardDueDate = formatDateToString(due_date);

    var identifier = deliverables.addDeliverable(asset, start_date, due_date, past_due, is_delivered, deliverableId);

    // If loading a predefined deliverable, use the id as the identifier
    build_deliverable_card(asset, cardStartDate, cardDueDate, past_due, is_delivered, deliverableId, isEditable);

}

function update_deliverable(identifiers) {
    //create the data object
    var deliverableData = {
        "asset": document.deliverableEditForm.asset.value,
        "start_date": formatDateToISO(document.deliverableEditForm.start_date.value),
        "due_date": formatDateToISO(document.deliverableEditForm.due_date.value),
        "past_due": document.deliverableEditForm.past_due.checked,
        "is_delivered": document.deliverableEditForm.is_delivered.checked};

    var ids = identifiers.split("-");
    var href = "/projects/" + ids[0] + "/deliverables/" + ids[1];

    makeAjaxRequest(href, 'PUT',  deliverableData);
}

function update_contact(identifiers) {
    //create the data object
        
    var um =  document.contactEditForm.update_method;
    updateMethod = um.options[um.selectedIndex].value;

    var contactData = {
        "name": document.contactEditForm.name.value,
        "email": document.contactEditForm.email.value,
        "phone": document.contactEditForm.phone.value,
        "skype": document.contactEditForm.skype.value,
        "wechat": document.contactEditForm.wechat.value,
        "is_update_recipient": document.contactEditForm.is_update_recipient.checked,
        "update_method": updateMethod
    };

    var ids = identifiers.split("-");
    var href = "/projects/" + ids[0] + "/contacts/" + ids[1];

    makeAjaxRequest(href, 'PUT',  contactData);
}

function remove_deliverable(event) {
    var identifier = event.target.parentElement.id;
    deliverables.removeDeliverable(identifier);
    remove_card(identifier);
}

function build_deliverable_card(asset, start_date, due_date, past_due, is_delivered, identifier, isEditable) {
     // Create the basic elements
     var cardDiv = document.createElement("div");
     
     var clz =  "card panel";
     if (past_due) {
         clz += " past";
     }
     if (is_delivered) {
         clz += " delivered";
     }
     cardDiv.setAttribute("class",clz);
     
     cardDiv.setAttribute("id", identifier);
     var containerDiv = document.createElement("div");
     containerDiv.setAttribute("class", "container");
     var boldTag = document.createElement("b");
     var statusBoldTag = document.createElement("b");
     var headerElement = document.createElement("h4");
     var deleteButton = document.createElement ("button");
     deleteButton.onclick = remove_deliverable;

     var startDateText = document.createElement("p");
     startDateText.setAttribute("class", "startDate");
     startDateText.appendChild(document.createTextNode("Start Date: " + start_date));
     var dueDateText = document.createElement("p");
     dueDateText.appendChild(document.createTextNode("Due Date: " + due_date));
     dueDateText.setAttribute("class", "dueDate");
     var statusText = document.createElement("p");
     var status = "Status: ";
     if (past_due) {
         status += "Past Due ";
         
     }

     if (is_delivered) {
         status += "Delivered";
     }

     statusBoldTag.appendChild(document.createTextNode(status));
     statusText.appendChild(statusBoldTag);
     boldTag.appendChild(document.createTextNode(asset));

     containerDiv.appendChild(boldTag);
     containerDiv.appendChild(startDateText);
     containerDiv.appendChild(dueDateText);
     if (past_due || is_delivered) {
         containerDiv.appendChild(statusText);
     }
     
     cardDiv.appendChild(containerDiv);
     if (document.projectForm && !is_delivered) {
         cardDiv.appendChild(deleteButton);
     }
     if (isEditable && !is_delivered) {
         var ids = identifier.split("-");
         var link = "/projects/" + ids[0] + "/deliverables/" + ids[1] + "/edit";
         var linkElement = document.createElement("a");
         linkElement.appendChild(document.createTextNode("Edit"));
         linkElement.setAttribute("href", link);
         cardDiv.appendChild(linkElement);
     }

     document.getElementById('deliverableCards').appendChild(cardDiv);
}

function Deliverables() {
}

Deliverables.prototype.addDeliverable = function(asset, start_date, due_date, past_due, is_delivered, identifier=false) {
    var data = {'asset': asset,
                'start_date': start_date,
                'due_date': due_date,
                'past_due': past_due,
                'is_delivered': is_delivered
                };

    if (!identifier) {
        var id = "deliverable_" + Date.now();
    } else {
        var id = identifier;
    }
    this[id] = data;
    return id;
};

Deliverables.prototype.removeDeliverable = function(identifier) {
    delete this[identifier];
};

Deliverables.prototype.getDeliverables = function() {
    var information = this;
    return Object.keys(information).map(function(key){return information[key]});
};

function add_project() {
    var href = "/projects/create";
    var project = build_project_object();

    if(project) {
        // Post data to server.
        makeAjaxRequest(href, 'POST',  project);
    }
}

function update_project(projectId) {
    var href = "/projects/" + projectId;
    var project = build_project_object();

    if(project) {
        // Post data to server.
        makeAjaxRequest(href, 'PUT',  project);
    }
}

function build_project_object() {
    // Build the project data object to post to server
    var project = {};
    var projectForm = document.projectForm;
    
    // Retreive general project data from project Form.
    project.title = projectForm.title.value;

    if (typeof project.title === 'undefined' || project.title === '') {
        //throw an error as there must be a title
        document.getElementById('error_msg').innerHTML = "You must have a title.";
        document.getElementById('error_div').style.display = "inline";
        return false;
    }

    project.description = projectForm.description.value;
    project.kickoff_date = formatDateToISO(projectForm.kickoff_date.value);
    project.is_on_hold = document.projectForm.is_on_hold.checked;
    project.is_archived = document.projectForm.is_archived.checked;

    project.huboard_link = projectForm.huboard_link.value;
    project.ghrepo = projectForm.ghrepo.value;
    project.rdbiz_link = projectForm.rdbiz_link.value;
    project.slackchannel = projectForm.slackchannel.value;
    project.send_updates = projectForm.send_updates.checked;
    if(project.send_updates) {
        var selIdx = projectForm.send_update_time.selectedIndex;
        project.send_update_time = parseInt(projectForm.send_update_time[selIdx].value);
        project.send_update_day = convertCheckboxesToInteger(projectForm.send_update_day);     
    } else {
        project.send_update_time = 9;
        project.send_update_day = 2;     
    }

    
    if (project.send_updates && project.ghrepo === '') {
        //throw an error as there must be a title
        document.getElementById('error_msg').innerHTML = "To send updates the github repository cannot be blank!";
        document.getElementById('error_div').style.display = "inline";
        return false;
    }


    // Retrieve contacts from Contacts object.
    if (typeof contacts !== 'undefined') {
        var liaisons = contacts.getContacts();
        if(liaisons.length > 0) {
            project.contacts = contacts.getContacts();
        }
        delete contacts;
    }

    // Retrieve deliverables from Deliverables object.
    if (typeof deliverables !== 'undefined') {
        var assets = deliverables.getDeliverables();
        if(assets.length > 0) {
            project.deliverables = deliverables.getDeliverables();
            project.deliverables.sort(sort_by('due_date', false, function(a){return new Date(a).getTime()}));
        }
        delete deliverables;
    }

    return JSON.parse(JSON.stringify(project));
}

function convertCheckboxesToInteger(checkboxElements) {
    var numVal = 0;

    for (key in checkboxElements) {
        if(checkboxElements[key].checked){
            numVal += parseInt(checkboxElements[key].value);
        }
    }

    return numVal
}

function load_update_time(dayInt, timeInt, isVisible, domElement) {
    var resultArray = getUpdateDayBinary(dayInt);
    var daysOfWeek = resultArray[0];
    var weekBinary = resultArray[1];

    var cnt = 0;
    for (key in daysOfWeek){
        var day = daysOfWeek[key];
        var elementId = "send_update_day_" + day;

        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = elementId;
        checkbox.name = "send_update_day";
        checkbox.value = key;
        checkbox.setAttribute("class", "form-control");
        checkbox.style.marginRight = "2px";

        checkbox.onclick = function (domElement){
            var checkboxes = document.getElementsByName('send_update_day');

            var count = 0;
            var mondayIdx = 0;
            for (var idx=0; idx < checkboxes.length; idx++) {
                if (checkboxes[idx].checked) {
                   count++;
                }
                if(checkboxes[idx].value == "2"){
                    mondayIdx = idx;
                }
            }

            if(count == 0) {
                document.getElementById('send_updates').checked = false;
                document.getElementById('updateDateTime').style.visibility = "hidden";
                checkboxes[mondayIdx].checked = true;
            }
        };

        if (weekBinary[cnt] == '1') {
            checkbox.checked = true;
        }

        var label = document.createElement("label");
        label.appendChild(document.createTextNode(day.slice(0, 3) + ':'));
        label.style.marginLeft = "4px";
        label.style.marginRight = "2px";

        domElement.appendChild(label);
        domElement.appendChild(checkbox);

        cnt++;
    }

    var selector = document.createElement("select");
    selector.setAttribute("class", "form-control");
    selector.name = "send_update_time";

    var selectedIndex = 0;

    for (var idx = 0; idx < 24; idx++) {
        var option = document.createElement("option");
        option.setAttribute("value", idx);
        option.innerHTML = formatTime(idx);
        if(idx == timeInt) {
            selectedIndex = idx;
        }
        selector.appendChild(option);
    }

    selector.options.selectedIndex = selectedIndex;
    domElement.appendChild(selector);

    domElement.style.visibility = (isVisible) ? "visible" : "hidden";
}

function load_update_time_message(dayInt, timeInt, domElement) {
    
    var message = "";

        
    var resultArray = getUpdateDayBinary(dayInt);
    var daysOfWeek = resultArray[0];
    var weekBinary = resultArray[1];

    var cnt = 0;
    for (key in daysOfWeek){
        if (weekBinary[cnt] == '1') {
            message += daysOfWeek[key] + ', ';
        }
        cnt++;
    }
       
    if(message.length != 0) {
        message = message.substring(0, message.length - 2);
        var sliceIdx = message.lastIndexOf(',') + 1;
        if(sliceIdx > 0) {
            message = message.slice(0, sliceIdx) + " and" + message.slice(sliceIdx); 
        }
        message += " at ";

        message += formatTime(timeInt); 

        domElement.innerHTML = message;
    }
}

function getUpdateDayBinary(dayInt) {
    resultBinary = '';

    var daysOfWeek = {'1':'Sunday', '2': 'Monday', '4': 'Tuesday', '8': 'Wednesday', '16': 'Thursday', '32': 'Friday', '64': 'Saturday'};

    var nbr = (dayInt >>> 0).toString(2);
    var dayBinary = nbr;
    var cnt = 0;
    while (cnt < (7 - nbr.length)){
        dayBinary = '0' + dayBinary;
        cnt += 1;
    }

    for(var idx = 0; idx < dayBinary.length; idx++){
        resultBinary = dayBinary[idx] + resultBinary;
    }

    return [daysOfWeek, resultBinary]; 
}

function formatTime(timeInt) {
   if (timeInt < 10) {
      return '0' + timeInt + ':00';
   } else {
      return timeInt + ':00';
   }
}
