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
  }

};

