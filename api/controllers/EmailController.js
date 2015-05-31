var moment = require('moment');
moment.locale('fr');

module.exports = {
  confirm: function(req, res) {
    var app = req.param('app');
    var name = app.patient.lastName.toUpperCase() + ' ' + app.patient.firstName;
    var email = app.disabled ? 'contact@kalendoc.com' : app.patient.email;
    var dateTemplate = moment(app.start).format('L');

    if (app.patient.mobilePhone != undefined) {
      var mergedVars = [
        {"FNAME": app.patient.firstName},
        {"DNAME": app.doctor.lastName},
        {"DATE": dateTemplate},
        {"PNAME": name},
        {"PMOBILE": app.patient.mobilePhone}
      ]
    }
    else {
      var mergedVars = [
        {"FNAME": app.patient.firstName},
        {"DNAME": app.doctor.lastName},
        {"DATE": dateTemplate},
        {"PNAME": name}
      ]
    }

    name = app.disabled ? 'KalenDoc' : (app.patient.lastName.toUpperCase() + ' ' + app.patient.firstName);

    Email.send({
        template: 'email-pour-rappel-de-rdv-non-confirm',
        data: mergedVars,
        to: [{
          name: name,
          email: email
        }],
        subject: '[PayDoc] Attention votre rendez-vous n\'est pas confirmé'
      },
      function optionalCallback (err) {
        if (err) return console.log(err);
        return res.json({success : 'Mail envoyé !'})
      });
  }
}
