/**
 * AppointmentController
 *
 * @description :: Server-side logic for managing appointments
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

  create: function(req, res){
    var params = req.params.all();

    var newAppointment = {
      startDate: params.startDate,
      patient: params.patient,
      doctor: params.doctor,
    };

    Appointment.create(newAppointment).exec(function createCB(err,created){

      if (err) return res.json(err);


      Appointment.find({id: created.id}).populate('patient').exec(function found(err, appoint) {
        if (err) return res.json(err);

        var template_content = [
         {
         "FNAME": appoint[0].patient.firstName
         }
         ];



         Email.send({
          template: 'email-validation-d-un-rdv-paydoc',
          data: template_content,
          to: [{
            name: appoint[0].patient.name,
            email: appoint[0].patient.email
          }],
          subject: '[PayDoc] Confirmation de création de compte'
          },
           function optionalCallback (err) {
            if (err) return res.json(err);
            else return res.json(appoint);
         });
      });


      /*var template_content = [
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
      });*/
    });
  }

};

