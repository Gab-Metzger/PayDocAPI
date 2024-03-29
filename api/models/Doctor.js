/**
* Doctor.js
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
      type: 'string',
      required: true
    },

    address: {
      type: 'string',
      required: true
    },

    appointments:{
      collection: 'appointment',
      via: 'doctor'
    },

    encryptedPassword: {
      type: 'string'
    },

    speciality: {
      type: 'string'
    },

    nbValidated: {
      type: 'integer',
      defaultsTo: 0
    },

    nbGiven: {
      type: 'integer',
      defaultsTo: 0
    },

    nbCancelled: {
      type: 'integer',
      defaultsTo: 0
    },

    consultTime: {
      type: 'integer',
      defaultsTo: 15,
      required: true
    },

    categories:{
      collection: 'category',
      via: 'owner'
    },

    toJSON: function() {
      var obj = this.toObject();
      delete obj.encryptedPassword;
      obj.token = sailsTokenAuth.issueToken(obj.id);
      obj.name = obj.lastName.toUpperCase() + ' ' + obj.firstName;
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
