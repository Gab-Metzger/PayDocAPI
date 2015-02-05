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

    name: {
      type: 'string'
    },

    email: {
      type: 'string',
      required: true
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

    appointments:{
      collection: 'appointment',
      via: 'patient'
    },

    toJSON: function() {
      var obj = this.toObject();
      delete obj.encryptedPassword;
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
      values.name = values.lastName.toUpperCase() + ' ' + values.firstName;
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
        values.name = values.lastName.toUpperCase() + ' ' + values.firstName;
        next();
      });
    }
    else {
      delete values.password;
      delete values.confirmation;
      values.name = values.lastName.toUpperCase() + ' ' + values.firstName;
      next();
    }
  }
};

