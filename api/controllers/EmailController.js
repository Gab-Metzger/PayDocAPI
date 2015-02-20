/**
 * EmailController
 *
 * @description :: Server-side logic for managing emails
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

  cancelGivenAppointment: function(req, res, next) {
    var template_name = 'email-annulation-d-un-rdv-donn';
    var template_content = [
      {
      "FNAME": req.param('firstName')
      },
      {
        "DNAME": req.param('doctorName')
      },
      {
        "RDVDATE": req.param('startDate')
      }
    ];

    Email.send({
      template: template_name,
      data: template_content,
      to: [{
        name: req.param('name'),
        email: req.param('email')
      }],
      subject: "[PayDoc] Annulation d'un rendez-vous PayDoc"
    }, function optionalCallback (err) {
          if (err) return res.json(err);
          else return res.json({
            message: 'Mail cancel given envoyé'
          });
    });
  }

};

