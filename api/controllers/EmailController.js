/**
 * EmailController
 *
 * @description :: Server-side logic for managing emails
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

  account: function(req, res, next) {
    var template_name = 'email-la-cr-ation-du-compte-paydoc';
    var template_content = [{
        name: "FNAME",
        content: "Gabriel"
    }];

    var message = {
      to: [{
        name: req.param('name'),
        email: req.param('email')
      }],
      subject: '[PayDoc] Confirmation de création de compte',
    };

    Email.send({
      template: 'email-la-cr-ation-du-compte-paydoc',
      data: template_content,
      to: [{
        name: req.param('name'),
        email: req.param('email')
      }],
      subject: '[PayDoc] Confirmation de création de compte'
    }, function optionalCallback (err) {
          if (err) return res.json(err);
          else return res.json({
            message: 'Le mail avec template est envoyé !'
          });
    });
  }

};

