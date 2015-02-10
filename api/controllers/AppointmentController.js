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
      doctor: params.doctor
    };

    Appointment.create(newAppointment).exec(function createCB(err,created){

      if (err) return res.json(err);



      Appointment.find({id: created.id}).populate('patient').populate('doctor').exec(function found(err, appoint) {
        if (err) return res.json(err);

        Appointment.publishCreate({
          id : created.id,
          patient : created.patient,
          startDate : created.startDate,
          doctor: appoint[0].doctor,
          state : appoint[0].state
        })

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
  },

  broadcast: function(req, res) {
    console.log("Appel de la fonction broadcast")
    var params = req.params.all();
    var patients = [];
    Appointment.find({doctor: params.doctor, state : "approved"}).populate('patient').exec(function (err, appoint){

        for ( var i = 0 ; i < appoint.length; i++ ){
            var trouve = false;
            for ( var j = 0 ; j < patients.length; j++){
                if (patients[j].id == appoint[i].patient.id ) trouve = true;
            }
            if ( !trouve ) patients[patients.length] = appoint[i].patient;
        }
        console.log(patients)

        // TODO : Parcours tableau patients & envoie mail
    })

    var newAppointment = {
      startDate: params.startDate,
      doctor: params.doctor
    };

    Appointment.create(newAppointment).exec(function createCB(err, created) {
      if (err) return res.json(err);
      return res.json(created);
    })
  },

  getBroadcasted : function (req, res ){

  }

};

