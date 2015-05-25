module.exports = {
  confirm: function(req, res) {
    var app = req.param('app');
    var name = app.patient.lastName.toUpperCase() + ' ' + app.patient.firstName;
    var mergedVars = [
      {"FNAME": app.patient.firstName},
      {"DNAME": app.doctor.lastName},
      {"PNAME": name}
    ];

    Email.send({
        template: 'email-pour-rappel-de-rdv-non-confirm',
        data: mergedVars,
        to: [{
          name: name,
          email: app.patient.email
        }],
        subject: '[PayDoc] Attention votre rendez-vous n\'est pas confirmé'
      },
      function optionalCallback (err) {
        if (err) return console.log(err);
        return res.json({success : 'Mail envoyé !'})
      });
  }
}
