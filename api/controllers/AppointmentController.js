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
  console.log("Appel de la fonction getBroadcast")
    var params = req.params.all();
    var doctors = [];
    var appointments = [];


    Appointment.find({patient: params.patient, state : "approved"}).populate('doctor').exec(function(err,appoint){

      for ( var i = 0 ; i < appoint.length; i++ ){
        var trouve = false;
        for ( var j = 0 ; j < doctors.length; j++){
          if (doctors[j].id == appoint[i].doctor.id ) trouve = true;
        }
        if ( !trouve ) doctors[doctors.length] = appoint[i].doctor;
      }


      //async.forEach(doctors, function (item, callback){
      //  console.log(item); // print the key
      //  Appointment.find({doctor: item.id, patient: null}).exec(function(err, app){
      //    for ( var z = 0 ; z < app.length ; z++ ){
      //      appointments.push(app[z]);
      //    }
      //
      //  })
      //  callback(); // tell async that the iterator has completed
      //
      //}, function(err) {
      //  console.log('iterating done');
      //  console.log(appointments)
      //});
      async.each(doctors,
        // 2nd param is the function that each item is passed to
        function(item, callback){
          // Call an asynchronous function, often a save() to DB
          //item.someAsyncCall(function (){
          //  // Async call is done, alert via callback
          //  callback();
          //});
          Appointment.find({doctor: item.id, patient: null}).exec(function(err, app){
                  for ( var z = 0 ; z < app.length ; z++ ){
                    appointments.push(app[z]);
                  }
            callback();

          })
        },
        // 3rd param is the function to call when everything's done
        function(err){
          // All tasks are done now
          console.log(appointments);
          if (err) return res.json(err);
          else return res.json(appointments);
        }
      );


      //async.series([
      //  //Load user to get userId first
      //  function(callback) {
      //
      //    async.forEach(doctors, function (item, callback){
      //      console.log(item); // print the key
      //      Appointment.find({doctor: item.id, patient: null}).exec(function(err, app){
      //        for ( var z = 0 ; z < app.length ; z++ ){
      //          appointments.push(app[z]);
      //        }
      //
      //      })
      //      callback(); // tell async that the iterator has completed
      //
      //    }, function(err) {
      //      console.log('iterating done');
      //
      //    });
      //    callback();
      //  },
      //  //Load posts (won't be called before task 1's "task callback" has been called)
      //  function(callback) {
      //      console.log(appointments);
      //      callback();
      //  }
      //], function(err) { //This function gets called after the two tasks have called their "task callbacks"
      //  console.log(appointments)
      //  console.log("Finsih")
      //});



    })


  }

};

