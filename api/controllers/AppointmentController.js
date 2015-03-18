/**
 * AppointmentController
 *
 * @description :: Server-side logic for managing appointments
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var moment = require('moment');
moment.locale('fr');

module.exports = {

  create: function(req, res){
    var params = req.params.all();

    var newAppointment = {
      start: params.start,
      end: params.end,
      patient: params.patient,
      doctor: params.doctor,
      notes: params.notes
    };

    Appointment.create(newAppointment).exec(function createCB(err,created){

      if (err) return res.json(err);

      Appointment.findOne(created.id).populate('patient').populate('doctor').exec(function found(err, appoint) {
        if (err) return res.json(err);

        Appointment.publishCreate({
          id : created.id,
          patient : created.patient,
          start : created.start,
          end: created.end,
          doctor: appoint.doctor,
          state : appoint.state,
          notes: appoint.notes
        })

        var email = appoint.patient.email;

        if (email.indexOf("paydoc.fr") === -1) {
          Email.send({
              template: 'email-validation-d-un-rdv-paydoc',
              data: [
                {"FNAME": appoint.patient.firstName},
                {"DNAME": appoint.doctor.lastName}
              ],
              to: [{
                name: appoint.patient.name,
                email: appoint.patient.email
              }],
              subject: '[PayDoc] Validation d\'un rendez-vous'
            },
            function optionalCallback (err) {
              if (err) return res.json(err);
              else return res.json(appoint);
            });
        }
        else {
          return res.json(appoint);
        }
      });
    });
  },

  broadcast: function(req, res) {
    var params = req.params.all();
    var patients = [];
    Appointment.find({doctor: params.doctor, state : {'!': "denied"}, start: {'>': params.start}}).populate('patient').populate('doctor').exec(function (err, appoint){
        for ( var i = 0 ; i < appoint.length; i++ ){
            if (appoint[i].patient != undefined) {
              var trouve = false;
              for ( var j = 0 ; j < patients.length; j++){
                if (patients[j].id == appoint[i].patient.id ) trouve = true;
              }
              if ( !trouve && (appoint[i].patient.receiveBroadcast)) {
                appoint[i].patient.dname = appoint[i].doctor.lastName;
                patients[patients.length] = appoint[i].patient;
              }
            }
        }

        for (var i = 0; i < patients.length; i++) {
          Email.send({
              template: 'email-proposition-de-rendez-vous',
              data: [
                {
                  "FNAME": patients[i].firstName
                },
                {
                  "DNAME": patients[i].dname
                }
              ],
              to: [{
                name: patients[i].name,
                email: patients[i].email
              }],
              subject: '[PayDoc] Profitez d\'une annulation chez votre médecin'
            },
            function optionalCallback (err) {
              if (err) return res.json(err);
              console.log('Broadcast - Mail n°'+i+' sent !');
            });
        }

        //return res.json(patients);
    });

    var newAppointment = {
      start: params.start,
      end: params.end,
      doctor: params.doctor
    };

    Appointment.create(newAppointment).exec(function createCB(err, created) {
      if (req.isSocket){
        Appointment.find({}).exec(function(e,listOfApp){
          Appointment.subscribe(req.socket,listOfApp);
        });
      }
      if (err) return res.json(err);
      return res.json(created);
    })
  },

  getBroadcasted : function (req, res ){
    var params = req.params.all();
    var doctors = [];
    var appointments = [];


    Appointment.find({patient: params.patient, state : {'!': "denied"}, start : {">": new Date().toISOString()} }).populate('doctor').exec(function(err,appoint){

      for ( var i = 0 ; i < appoint.length; i++ ){
        var trouve = false;
        for ( var j = 0 ; j < doctors.length; j++){
          if (doctors[j].id == appoint[i].doctor.id ) trouve = true;
        }
        if ( !trouve ) doctors[doctors.length] = appoint[i].doctor;
      }

      async.each(doctors,
        // 2nd param is the function that each item is passed to
        function(item, callback){

          Appointment.find({doctor: item.id, patient: null}).populate('doctor').exec(function(err, app){
                  for ( var z = 0 ; z < app.length ; z++ ){
                    appointments.push(app[z]);
                  }
            callback();

          })
        },
        // 3rd param is the function to call when everything's done
        function(err){
          // All tasks are done now
          if (err) return res.json(err);
          else return res.json(appointments);
        }
      );

    })

  },

  getBroadcastedHistory: function(req, res) {
    var doctorId = req.param('id');

    Appointment.find({doctor: doctorId, patient: null}).exec(function(err, data) {
      if (err) res.json(err)
      else {
        return res.json(data);
      }
    })
  },

  chooseAppointment: function(req,res){
    var params = req.params.all();
    Appointment.update({id: params.id},{
      patient : params.patient,
      state : params.state
    }).exec(function(err,data){
      if (!err) {
        Patient.find(params.patient).exec(function(err,patient){
          Appointment.publishUpdate(data[0].id,{patient:patient[0],state:params.state});
          return res.json(data)
        })

      } else res.json(err)
    })
  },

  subscribeAppointment: function(req,res){
    if (req.isSocket){
      Appointment.find({}).exec(function(e,listOfApp){
        Appointment.subscribe(req.socket,listOfApp);
      });
    }
  },

  cancel: function(req, res) {
    Appointment.findOne({id : req.param('id')}).populate('patient').populate('doctor').exec(function(err, app) {
      var appDate = new Date(app.start);
      Email.send({
          template: 'email-annulation-d-un-rdv-donn',
          data: [
            {
              "FNAME": app.patient.firstName
            },
            {
              "DNAME": app.doctor.lastName
            },
            {
              "RDVDATE": moment(appDate).format('LL')
            }
          ],
          to: [{
            name: app.patient.name,
            email: app.patient.email
          }],
          subject: '[PayDoc] Annulation d\'un rendez-vous PayDoc'
        },
        function optionalCallback (err) {
          if (err) return res.json(err);
          return res.json({message: 'Email sent'});
        });
    })
  }

};


