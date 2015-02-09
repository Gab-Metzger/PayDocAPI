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
          subject: '[PayDoc] Validation d\'un rendez-vous'
          },
           function optionalCallback (err) {
            if (err) return res.json(err);
            else return res.json(appoint);
         });
      });
    });
  }

};

