/**
 * PatientController
 *
 * @description :: Server-side logic for managing patients
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var generatePassword = require('password-generator');

module.exports = {

  create: function(req, res){
    var params = req.params.all();
    var password = generatePassword();

    var newPatient = {
      lastName: params.lastName,
      firstName: params.firstName,
      email: params.email,
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
        Patient.findOne({ email: req.params('email') }, function(err, user) {
          if (!user) {
            return res.json({error: 'No account with that email address exists.'});
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        // Send the mail with url + param token

        Email.send({
          template: 'email-la-cr-ation-du-compte-paydoc',
          data: [{
            'FNAME': user.firstName
          }],
          to: [{
            name: user.name,
            email: user.email
          }],
          subject: '[PayDoc] Réinitialisation de votre mot de passe'
        }, function optionalCallback (err) {
          if (err) return res.json(err);
          else return res.json(created);
        });

        // End with done(err, 'done')
      }
    ], function(err) {
      if (err) return next(err);
    });
  }

};

