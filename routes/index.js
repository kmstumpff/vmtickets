var express = require('express');
var nodemailer = require("nodemailer");
var crypto = require('crypto');
var assert = require('assert');
var router = express.Router();
var id = ""; // this is the encrytion secret
var f_name = "VM Ticket Server";
var f_email = "";
var f_password = "";
var cipher = crypto.createCipher('aes256', id);
var decipher = crypto.createDecipher('aes256', id);

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'VM Tickets' });
});

router.get('/userlist', function(req, res) {
  var db = req.db;
  var collection = db.get('users');
  collection.find({},{},function(e,docs) {
    res.render('userlist', {
        "userlist" : docs
    });
  });
});

router.get('/ticketlist', function(req, res) {
  var db = req.db;
  var collection = db.get('tickets');
  collection.find({},{},function(e,docs) {
    res.render('ticketlist', {
        "ticketlist" : docs
    });
  });
});

router.get('/viewticket', function(req, res) {
  var db = req.db;
  var collection = db.get('tickets');
  var ticket_id = req.query.id;
  // console.log(ticket_id);
  collection.find( { id : parseInt(ticket_id) },{},function(e,docs) {
    if (e) {
        res.send("There was an error getting the ticket");
        console.log(e);
    }
    else {
        res.render('viewticket', {
        "ticketlist" : docs
    });
    }
  });
});

router.get('/email', function(req, res) {
  res.render('email', { title : "Setup Email" });
});

router.get('/delusers', function(req, res) {
  var db = req.db;
  var collection = db.get('users');
  collection.remove({}, function (err, doc) {
      if (err) {
        res.send("There was a problem adding the user")
      }
      else {
        res.location("userlist");
        res.redirect("userlist");
      }
  });
});

router.get('/newuser', function(req, res) {
    res.render('newuser', { title : "Add New User" });
});

router.get('/newticket', function(req, res) {
  var db = req.db;
  var collection = db.get('users');
  collection.find({},{},function(e,docs) {
    res.render('newticket', {
        title : "Add New Ticket",
        "userlist" : docs
    });
  });

});

router.post('/adduser', function(req, res) {
  var db = req.db;
  var userName = req.body.username;
  var userEmail = req.body.useremail;
  var collection = db.get('users');
  if (userName != "" && userEmail != "") {
    collection.insert({
        "username" : userName,
        "useremail" : userEmail
      }, function (err, doc) {
          if (err) {
            res.send("There was a problem adding the user")
          }
          else {
            res.location("userlist");
            res.redirect("userlist");
          }
    });
  }
  else {
    res.send("Missing Username or Email")
  }
});

router.post('/addticket', function(req, res) {

  function checkTime(i) {
    if (i<10) {i = "0" + i};  // add zero in front of numbers < 10
    return i;
  }

  if (req.body.name == "") {
    res.send("Please select a username");
  }

  var db = req.db;
  var d = new Date();
  var collection = db.get('tickets');
  console.log("Name: " + req.body.name);
  console.log("Summary: " + req.body.summary);
  console.log("Description: " + req.body.description);
  if ((typeof req.body.name != 'undefined')  && req.body.summary != "" && req.body.description != "") {
    collection.insert({
        "id" : d.getTime(),
        "name" : req.body.name,
        "summary" : req.body.summary,
        "description" : req.body.description,
        "date" : d.getMonth()+1 + "/" + d.getDate() + "/" + d.getFullYear(),
        "time" : d.getHours() + ":" + checkTime(d.getMinutes()) + ":" + checkTime(d.getSeconds()),
        "status" : "open"
      }, function (err, doc) {
          if (err) {
            res.send("There was a problem adding the ticket");
          }
          else {


            collection = db.get('options');
            collection.findOne({},{},function(e,docs) {
              if (err) {
                res.send("There was a problem saving options")
              }
              else {
                if (!(docs.f_email.length > 0 )) {
                  console.log("Email is empty")
                } else {
                  if (f_password == "") {
                      f_password = decipher.update(docs.f_password, 'hex', 'utf8') + decipher.final('utf8');
                  }
                  var smtpTransport = nodemailer.createTransport("SMTP",{
                    service : "Gmail",
                    auth: {
                      user: f_email,
                      pass: f_password
                    }
                  });




                  var smtpTransport = nodemailer.createTransport("SMTP",{
                    service : "Gmail",
                    auth: {
                      user: f_email,
                      pass: f_password
                    }
                  });
                  smtpTransport.sendMail({
                     from: docs.f_name + " <" + docs.f_email + ">",
                     to: docs.t_name + "<" + docs.t_email + ">",
                     subject: "New VM Ticket (" + req.body.name + "): " + req.body.summary,
                     text: req.body.description
                  }, function(error, response){
                     if(error){
                       console.log("Error sending email: " + error);
                     }else{
                       console.log("Message sent: " + response.message);
                     }
                  });
                }
                res.location("ticketlist");
                res.redirect("ticketlist");


              }
            });

          }
    });
  }
  else {
    res.send("Missing Name, Summary or Description")
  }
});

router.post('/saveoptions', function(req, res) {
  console.log("Saving options")
  var db = req.db;
  var collection = db.get('tickets');
  var oldticket = {};
  var newticket = {};
  var ticket_id = req.body.id;
  console.log("Notes: " + req.body.notes);
  // console.log(req.body);
  // console.log("ID: " + ticket_id);
  // console.log("hold-> " + req.body.ishold);
  // console.log("closed-> " + req.body.isclosed);
  // console.log("hold-> " + cHold);
  // console.log("closed-> " + cClosed);
  collection.findOne( { id : parseInt(ticket_id) },{},function(e,docs) {
    if (e) {
      res.send("There was an error getting the ticket");
      console.log(e);
    }
    else {
      oldticket = docs;
      newticket = docs;
      // console.log("docs:");
      // console.log(docs);
      // console.log("oldticket:");
      // console.log(oldticket);var ticket_id = req.query.id;
      if (req.body.status == "")
        cStatus = oldticket.status;
        //res.send("Status was not selected")
      else
        cStatus = req.body.status;
      if (cStatus != oldticket.status || req.body.notes != "") {
        // console.log("Hold: " + cHold);
        // console.log("Closed: " + cClosed);
        newticket.status = cStatus;
        if (req.body.notes != "")
          newticket.description = oldticket.description + "\r\n\r\nNotes (" + cStatus + "): " + req.body.notes;
        // console.log("newticket:");
        // console.log(newticket);

        var options = { upsert: false, multi: false }

        collection.update({_id : oldticket._id}, newticket, options, function (err, doc) {
              if (err) {
                res.send("There was a problem saving options")
              }
              else {
                console.log("Options saved")


                      collection = db.get('options');
                      collection.findOne({},{},function(e,docs) {
                        if (err) {
                          res.send("There was a problem saving options")
                        }
                        else {

                          f_email = docs.f_email;
                          if (f_password == "") {
                              f_password = decipher.update(docs.f_password, 'hex', 'utf8') + decipher.final('utf8');
                          }
                          var smtpTransport = nodemailer.createTransport("SMTP",{
                            service : "Gmail",
                            auth: {
                              user: f_email,
                              pass: f_password
                            }
                          });
                          // console.log("f_name: " + docs.f_name);
                          // console.log("f_email: " + docs.f_email);
                          // console.log("t_name: " + docs.t_name);
                          // console.log("t_email: " + docs.t_email);
                          // Send to VM Administrator
                          smtpTransport.sendMail({
                             from: "VM Ticket <" + docs.f_email + ">",
                             to: docs.t_name + "<" + docs.t_email + ">",
                             subject: "VM Ticket Status Changed (" + oldticket.name + "): " + oldticket.summary + " (" + cStatus + ")",
                             text: "The following ticket changed status to " + cStatus + "\n\n" + oldticket.description
                          }, function(error, response){
                             if(error){
                               console.log("Error sending email: " + error);
                             }else{
                               console.log("Message sent to " + docs.f_email + ": " + response.message);
                             }
                          });
                          // Get 'Entered by' user's email address
                          collection = db.get('users');
                          collection.findOne({ username : oldticket.name },{},function(e,user) {
                            if (err) {
                              res.send("There was a problem saving options")
                            }
                            else {


                              // Send to 'Entered by' user
                              smtpTransport.sendMail({
                                 from: "VM Administrator <" + docs.f_email + ">",
                                 to: oldticket.name + "<" + user.useremail + ">",
                                 subject: "VM Ticket Status Changed",
                                 text: "The following ticket changed status from " + oldticket.status + " to " + cStatus + ".\n\nSummary: " + oldticket.summary + "\nEntered By: " + oldticket.name + "\n\n" + oldticket.description
                              }, function(error, response){
                                 if(error){
                                   console.log("Error sending email: " + error);
                                 }else{
                                   console.log("Message sent to " + user.useremail + ": " + response.message);
                                 }
                              });
                            }
                          });
                          // console.log("update finished:");
                          // console.log(doc);
                          res.location("ticketlist");
                          res.redirect("ticketlist");
                        }
                      });
              }
        });
      }
      else {
        console.log("Options did not change");
        res.location("ticketlist");
        res.redirect("ticketlist");
      }
    }
  });

});

router.post('/setemail', function(req, res) {
  var fn, fe, fh3, tn, te;
  var db = req.db;
  var collection = db.get('options');
  collection.findOne({},{},function(e,docs) {
    if (e) {
      res.send("There was a problem saving options")
    }
    else { 
      if (!(docs.f_email.length > 0 )) {
        console.log("Email is empty")
      } else {
        if (f_password == "") {
          if (typeof docs.f_password != 'undefined') {
            f_password = decipher.update(docs.f_password, 'hex', 'utf8') + decipher.final('utf8');
          } else {
            f_password = "";
          }
        }
      }
    }
  });
  //if (req.body.femail != "" && req.body.fpassword != "" && req.body.temail != "") {
  if (req.body.temail != "" && req.body.tname != "") {
  collection.update({
        id : "s34p1n3"
    }, { $set : {
        t_name : req.body.tname,
        t_email : req.body.temail
       }
    }, function (err, doc) {
          if (err) {
            res.send("There was an error storing the options")
          }
          else {
              console.log("Email was saved");
              res.location("/");
              res.redirect("/");
          }
    });




  /*collection.insert({
        id : "s34p1n3",
        f_name : req.body.fname,
        f_email : req.body.femail,
        f_password : f_password,
        t_name : req.body.tname,
        t_email : req.body.temail,
    }, function (err, doc) {
          if (err) {
            res.send("There was an error storing the options")
          }
          else {
              res.location("/");
              res.redirect("/");
          }
    });*/
  }
  else {
    res.send("Missing Name or Email")
  }
});


module.exports = router;
