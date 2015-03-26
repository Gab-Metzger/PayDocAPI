/**
 * AuthController
 *
 * @description :: Server-side logic for managing Auths
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var bcrypt = require('bcrypt');

module.exports = {
  create: function(req, res, next) {

    // Check for email and password in params sent via the form, if none
    // redirect the browser back to the sign-in form.
    if (!req.param('email') || !req.param('password')) {
      // return next({err: ["Password doesn't match password confirmation."]});

      return res.json({
        name: 'usernamePasswordRequired',
        message: 'You must enter both a username and password.'
      });
    }

    // Try to find the user by there email address.
    // findOneByEmail() is a dynamic finder in that it searches the model by a particular attribute.
    // User.findOneByEmail(req.param('email')).done(function(err, user) {
    Patient.findOneByEmail(req.param('email'), function foundPatient(err, patient) {
      if (err) return next(err);

      // If no patient is found...
      if (!patient) {

        Doctor.findOneByEmail(req.param('email'), function foundDoctor(err, doctor) {
          if (err) return next(err);

          // If no doctor is found...
          if (!doctor) {
            return res.json({
              name: 'noAccount',
              message: 'The email address ' + req.param('email') + ' not found.'
            });
          }

          // Compare password from the form params to the encrypted password of the user found.
          bcrypt.compare(req.param('password'), doctor.encryptedPassword, function(err, valid) {
            if (err) return next(err);

            // If the password from the form doesn't match the password from the database...
            if (!valid) {
              return res.json({
                name: 'usernamePasswordMismatch',
                message: 'Invalid username and password combination.'
              });
            }

            doctor.role = 'doctor';
            doctor.token = sailsTokenAuth.issueToken(doctor.id);
            return res.json(doctor);
          });
        });


      }
      else {
        // Compare password from the form params to the encrypted password of the user found.
        bcrypt.compare(req.param('password'), patient.encryptedPassword, function(err, valid) {
          if (err) return next(err);

          // If the password from the form doesn't match the password from the database...
          if (!valid) {
            return res.json({
              name: 'usernamePasswordMismatch',
              message: 'Invalid username and password combination.'
            });
          }

          /*if (!patient.onceConnected) {
            patient.onceConnected = false;
            patient.save(function(error) {
              if (error) return res.json(error)
            })
          }*/

          patient.role = 'patient';
          patient.token = sailsTokenAuth.issueToken(patient.id);
          return res.json(patient);
        });
      }
    });
  }
};
