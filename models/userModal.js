var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var UserSchema   = new mongoose.Schema({

  email : String,
  password  : String,
  name  : String,
  dob : Date,
  gender  : String,
  address : String,
  phone  : String,
  profileImagePath :  String,
  active  : Boolean, // upon email activation set to true
  hashtoken  : String, // one time token for email activation of user
  providerName  : String,
  providerId  : String,
  createdDate : Date,
  modifiedDate  : Date,
  resetPassword : [{
    requestDate : Date,
    hashtoken : String
  }]
});


// generating a hash

UserSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, 10);
};

// checking if password is valid
UserSchema.methods.verifyPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

UserSchema.methods.verifyToken = function(token) {
    return bcrypt.compareSync(token, this.hashtoken);
};

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);
