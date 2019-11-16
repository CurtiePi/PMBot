function makeAjaxRequest(url, method, data) {


    var httpRequest = new XMLHttpRequest();

    if (!httpRequest) {
      alert('Giving up :( Cannot create an XMLHTTP instance');
      return false;
    }
    httpRequest.onreadystatechange = alertContents;
    httpRequest.open(method, url);
    httpRequest.setRequestHeader('Content-Type', 'application/json');
    if (data !== "undefined"){
        httpRequest.send(JSON.stringify(data));
    } else {
        httpRequest.send();
    }

    function alertContents() {
      if (httpRequest.readyState === XMLHttpRequest.DONE) {
        if (httpRequest.status === 200) {
          location.href = httpRequest.responseText;
        } else {
          alert('There was a problem with the request.');
        }
      }
    }
}

function formatDateToISO(dateString) {
    var dateObj = new Date(dateString);
    return dateObj.toISOString();
}

function formatDateToString(dateString) {
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat'];

    var dateObj = new Date(dateString);
    
    var dateString = days[dateObj.getDay()];
    dateString += " " + months[dateObj.getMonth()];
    dateString += " " + ordinal_suffix_of(dateObj.getDate());
    dateString += ",  " + dateObj.getFullYear();

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

var sort_by = function(field, reverse, primer){

   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = !reverse ? 1 : -1;

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     } 
}

function goto_unauthorized() {
  location.href="/unauthorized"
}

function protect() {
  var jqxhr = $.ajax( {
    dataType:"json",
    url:"https://rdbiz.herokuapp.com/api/auth",
    xhrFields: {
      withCredentials: true
   }
  })
  .done(function(data) {
    if (data.auth) {
      $("#rdbiz_name").text(data.name);
      if (!data.can_edit_projects) {
        $(".protect_btn").hide()
      }
    } else {
      goto_unauthorized()
    }
   })
  .fail(function() {
    goto_unauthorized()
  });
}
