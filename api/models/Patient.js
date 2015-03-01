/**
* Patient.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  schema: true,

  attributes: {

    lastName: {
      type: 'string',
      required: true
    },

    firstName: {
      type: 'string',
      required: true
    },

    email: {
      type: 'string',
      required: true,
      unique: true
    },

    phone: {
      type: 'string'
    },

    address: {
      type: 'string'
    },

    encryptedPassword: {
      type: 'string'
    },

    resetPasswordToken: {
      type: 'string'
    },

    resetPasswordExpires: {
      type: 'datetime'
    },

    appointments:{
      collection: 'appointment',
      via: 'patient'
    },

    receiveBroadcast: {
      type: 'boolean',
      defaultsTo: true
    },

    toJSON: function() {
      var obj = this.toObject();
      delete obj.encryptedPassword;
      obj.name = obj.lastName.toUpperCase() + ' ' + obj.firstName;
      obj.token = sailsTokenAuth.issueToken(obj.id);
      return obj;
    }

  },

  beforeCreate: function (values, next) {

    // This checks to make sure the password and password confirmation match before creating record
    if (!values.password || values.password != values.confirmation) {
      return next({err: ["Password doesn't match password confirmation."]});
    }
    require('bcrypt').hash(values.password, 10, function passwordEncrypted(err, encryptedPassword) {
      if (err) return next(err);
      values.encryptedPassword = encryptedPassword;
      delete values.confirmation;
      // values.online= true;
      next();
    });
  },

  beforeUpdate: function (values, next) {

    if (!values.password && !values.confirmation) {
      next();
    }
    else if(values.password === values.confirmation) {
      require('bcrypt').hash(values.password, 10, function passwordEncrypted(err, encryptedPassword) {
        if (err) return next(err);
        values.encryptedPassword = encryptedPassword;
        delete values.confirmation;
        next();
      });
    }
    else {
      delete values.password;
      delete values.confirmation;
      next();
    }
  }
};

