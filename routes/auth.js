var express = require('express');
var router = express.Router();
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens

var User = require('../models/userModal');

var configApp = require('../config/app');

var mw = require('./middleware/middleware.js')

var multer = require("multer"); //for file upload
var upload = multer({ dest: './public/'});
var fs = require('fs');
var type = upload.single('file');
var mkdirp = require('mkdirp');
// var type = upload.single('recfile');




router.use(mw('time'))

router.get('/', function(req, res, next) {
  console.log('/: ',req.requestTime)
  res.json({'Message':'Welcome User'})
});

router.use(mw('time'))
// router.use(mw('haltOnTimedout'))

router.post('/signup', function(req, res, next) {

	console.log('/signup: ',req.requestTime)
	console.log('/signup: ',req.body.email)

  if(!req.body.email) {
    return res.json({'type':'Error','message':'No Email Found'})
  }

  User.findOne({ email: req.body.email }, function (err, user) {

    if (err) { 
   		if(!req.timedout)  return res.json({'type':'Error','message':'Server Error'}) 
    }
    
    if (user) { 
			if(!req.timedout)  return res.json({'type':'Info','message':'Email Already Registered'});    
    }

    if (!user) { 

      var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var token = '';
      for (var i = 16; i > 0; --i) {
        token += chars[Math.round(Math.random() * (chars.length - 1))];
      }


	  	var user = new User();
			user.email = req.body.email,
			user.password = user.generateHash(req.body.password),
			user.name = req.body.name,
			// user.dob = new Date(
			// 	req.body.birthday_year, 
			// 	parseInt(req.body.birthday_month) - 1, 
			// 	parseInt(req.body.birthday_day) 
			// 	, 0, 0, 0, 0),
			// user.gender = req.body.gender,
			// user.active = false;
			user.createdDate = Date.now();
			user.hashtoken = user.generateHash(token);

      const nodemailer = require('nodemailer');

      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'testnodeemail123@gmail.com',
            pass: 'testNode123'
          }
      });



	    user.save(function(err,user) {
		    if (err) { 
		    	if(!req.timedout)  return res.json({'type':'Error','message':'Server Timed Out'}); 
		    }

        var link = configApp.appurl+"/verify/"+token+"/"+user._id;

        // setup email data with unicode symbols
        let mailOptions = {
          from: '"CompanyName: 👻" <admin@company.in>', // sender address
          to: req.body.email, // list of receivers
          subject: 'Company Name: Signup Verification ✔', // Subject line
          // text: 'Hello world ?', // plain text body
          html: "Hello "+user.name +",<br> Please Click on this <a href="+link+">link </a>to verify your signup" // html body
        };


	      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
						if(!req.timedout) {
							 return res.json({'type':'Error','message':'Verification Email could not be sent'});    
						}
          }
	
		      if(!req.timedout)  return res.json({'type':'Success','message':'User Created. Verification Email sent '});
	  
	      });


	    });


    }    
    
  });

});

router.use(mw('time'))

router.post('/verify', function(req, res, next) {
	console.log('/verify: ',req.requestTime)
	console.log('/verify: ',req.body.signupToken)

  var user = new User();
  User.findOne({ '_id': req.body.uid }, function(err, user) {

    if (err) { 
   		if(!req.timedout)  res.json({'type':'Error','message':'Server Error'}) 
    }

    if (!user) { 
      if(!req.timedout)  res.json({'type':'Error','message':'Email not Registered'});    
    }

    if(!user.verifyToken(req.body.token)) {
      if(!req.timedout)  res.json({'type':'Error','message':'Token Mismatch'});       
    }

    user.active = true;
    user.hashtoken = '';

    user.save(function(err) {
	    if (err) { 
	    	if(!req.timedout)  res.json({'type':'Error','message':'Server Timed Out'}); 
	    }

	    if(!req.timedout)  res.json({'type':'Success','message':'User Activated.','name':user.name});

    });

  });

});

router.use(mw('time'))

router.post('/login', function(req, res, next) {
  console.log('/login: ',req.requestTime)
  console.log('/login: ',req.body.email)

  User.findOne({ 'email' :  req.body.email, 'active':true }, function(err, user) { 

    if (err) { 
      if(!req.timedout)  res.json({'type':'Error','message':'Server Error'}) 
    }
    if (!user){
      if(!req.timedout)  res.json({'type':'Warning', 'message': 'User does not exist or User has not verified the link on the signup email.' });
    }

    if (!user.verifyPassword(req.body.password)) {
      if(!req.timedout)  res.json({'type':'Warning', 'message': 'Wrong Password. Please try again' });
    }

    var token = jwt.sign(
          user, 
          app.get('superSecret'), 
          {
            expiresIn : 60*60*24 //in seconds--- 24 hours * 60 minutes * 60 seconds
          }
        );

    if(!req.timedout)  res.json({
      'type':'Success',
      'email': user.email,
      'name': user.name,
      'id': user._id,
      'gender':user.gender,
      'dob':user.dob,
      'active':user.active,
      'token': token,
      'profileImagePath':user.profileImagePath,
    });

  });

});

router.use(mw('time'))


router.post('/forgotPassword', function(req, res, next) {

  console.log('/forgotPassword: ',req.requestTime)
  console.log('/forgotPassword: ',req.body.email)

  User.findOne({ email: req.body.email }, function (err, user) {

    if (err) { 
      if(!req.timedout)  res.json({'type':'Error','message':'Server Error'}) 
    }
    
    if (!user) { 
      if(!req.timedout)  res.json({'type':'Info','message':'This Email is not Registered. Please sign up'});    
    }

    if (user) { 

      var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var token = '';
      for (var i = 16; i > 0; --i) {
        token += chars[Math.round(Math.random() * (chars.length - 1))];
      }

      var hashtoken = user.generateHash(token)
      user.resetPassword.push({'requestDate':Date.now(),'hashtoken':hashtoken})  
      user.hashtoken = hashtoken

      const nodemailer = require('nodemailer');

      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'testnodeemail123@gmail.com',
            pass: 'testNode123'
          }
      });

      var link = configApp.appurl+"/resetPassword/"+token+"/"+user._id;

      // setup email data with unicode symbols
      let mailOptions = {
        from: '"Company Name: 👻" <admin@company.in>', // sender address
        to: req.body.email, // list of receivers
        subject: 'Company Name: Reset Password ✔', // Subject line
        // text: 'Hello world ?', // plain text body
        html: `Hello `+user.name+`,<br> Please Click on the link below to reset your password.<br> 
        If you did not request for resetting your password, an unauthorized attempt was made<br>
        by someone at `+req.connection.remoteAddress+` to login to your account. <br>
        If you did indeed request for resetting password, please continue to click the link below<br>
        Click <a href=`+link+`>here</a>`        

      };


      user.save(function(err) {
        if (err) { 
          if(!req.timedout)  res.json({'type':'Error','message':'Server Timed Out'}); 
        }
        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            if(!req.timedout) {
               res.json({'type':'Error','message':'Password Reset Email could not be sent'});    
            }
          }
  
          if(!req.timedout)  res.json({'type':'Success','message':'Password Reset Email Sent '});
    
        });


      });


    }    
    
  });

});

router.use(mw('time'))

router.post('/resetPassword', function(req, res, next) {
  console.log('/resetPassword: ',req.requestTime)
  console.log('/resetPassword: ',req.body.hashtoken)

  var user = new User();
  User.findOne({ "_id": req.body.uid },function(err, user) {

    if (err) { 
      if(!req.timedout)  res.json({'type':'Error','message':'Server Error'}) 
    }

    if (!user) { 
      if(!req.timedout)  res.json({'type':'Error','message':'Error on Reset. Please call customer support'});    
    }

    if(!user.verifyToken(req.body.token)) {
      if(!req.timedout)  res.json({'type':'Error','message':'Token Mismatch'});       
    }


    user.password = user.generateHash(req.body.password);
    user.hashtoken = ''
    
    user.save(function(err) {
      if (err) { 
        if(!req.timedout)  res.json({'type':'Error','message':'Server Timed Out'}); 
      }

      if(!req.timedout)  res.json({'type':'Success','message':'Password Reset.','name':user.name});

    });

  });

});

module.exports = router;
