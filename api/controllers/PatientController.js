/**
 * PatientController
 *
 * @description :: Server-side logic for managing patients
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var generatePassword = require('password-generator');
var crypto = require('crypto');
var moment = require('moment');
moment.locale('fr');

module.exports = {

  create: function(req, res){
    var params = req.params.all();
    var password = generatePassword();

    var newPatient = {
      lastName: params.lastName,
      firstName: params.firstName,
      email: params.email,
      mobilePhone: params.mobilePhone,
      phone: params.phone,
      dateOfBirth: moment(params.dateOfBirth),
      address: params.address,
      password: password,
      confirmation: password
    };

    Patient.create(newPatient).exec(function createCB(err,created){

      if (err) return res.json(err);

      var template_content = [
        {
          "FNAME": created.firstName
        },
        {
          "EMAIL" : created.email
        },
        {
          "PASSWORD": password
        }
      ];

      if (created.email.indexOf("paydoc.fr") === -1) {
        Email.send({
          template: 'email-la-cr-ation-du-compte-paydoc',
          data: template_content,
          to: [{
            name: created.name,
            email: created.email
          }],
          subject: '[PayDoc] Confirmation de création de compte'
        }, function optionalCallback (err) {
          if (err) return res.json(err);
          else return res.json(created);
        });
      }
      else {
        return res.json(created);
      }

    });
  },

  forgot: function(req, res) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        Patient.findOne({ email: req.param('email') }, function(err, user) {
          if (!user) {
            return res.json({error: 'No account with that email address exists.'});
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = new Date(); // 1 hour
          user.resetPasswordExpires.addHour();

          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        // Send the mail with url + param token

        Email.send({
          template: 'email-mot-de-passe-oubli',
          data: [{
            'FNAME': user.firstName
          },
            {
              'UPDATEPWD': 'http://rdv.paydoc.fr/reset/'+token
            }],
          to: [{
            name: user.name,
            email: user.email
          }],
          subject: '[PayDoc] Réinitialisation de votre mot de passe'
        }, function optionalCallback (err) {
          if (err) return res.json(err);
          else return res.json({message: 'Le mail de réinitialisation à été envoyé !'});
        });

        //done(user, 'done');
      }
    ], function(err) {
      if (err) return res.json(err);
    });
  },

  reset: function(req, res) {
    Patient.findOne({ resetPasswordToken: req.param('token'), resetPasswordExpires: { '>=': new Date() } }, function(err, user) {
      if (!user) {
        return res.json({error: 'Password reset token is invalid or has expired.'});
      }

      user.password = req.param('password');
      user.confirmation = req.param('confirmation');
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      user.save(function(err) {
        if (err) return res.json({error: 'Error updating Patient password.'});
        return res.json({message: 'Password Updated'});
      });
    });
  }

};
