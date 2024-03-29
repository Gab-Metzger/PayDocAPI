/**
 * AppointmentController
 *
 * @description :: Server-side logic for managing appointments
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var moment = require('moment');
moment.locale('fr');

module.exports = {

  getAppointmentsByDoctor: function(req, res) {
    Appointment.find({doctor: req.param('id'), start: {'>': new Date()}}).populate('patient').exec(function got(appointments, err) {
      if (err) return res.json(err)
      else return res.json(appointments);
    });
  },

  create: function(req, res){
    var params = req.params.all();

    var newAppointment = {
      start: params.start,
      end: params.end,
      state: params.state,
      patient: params.patient,
      doctor: params.doctor,
      notes: params.notes,
      category: params.category
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
          notes: appoint.notes,
          category: appoint.category
        });

        if (appoint.patient != undefined) {
          var email = appoint.patient.email;
          var mobile = appoint.patient.mobilePhone;
          var name = appoint.patient.lastName.toUpperCase() + ' ' + appoint.patient.firstName;
          if (email.indexOf("paydoc.fr") === -1) {
            if (mobile != undefined) {
              var mergedVars = [
                {"FNAME": appoint.patient.firstName},
                {"DNAME": appoint.doctor.lastName},
                {"DATERDV": moment(appoint.start).format('L')},
                {"PID": appoint.id},
                {"PNAME": name},
                {"PMOBILE": appoint.patient.mobilePhone}
              ]
            }
            else {
              var mergedVars = [
                {"FNAME": appoint.patient.firstName},
                {"DNAME": appoint.doctor.lastName},
                {"DATERDV": moment(appoint.start).format('L')},
                {"PID": appoint.id},
                {"PNAME": name}
              ]
            }
            Email.send({
                template: 'email-confirmation-annulation',
                data: mergedVars,
                to: [{
                  name: name,
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
    console.log("Start");
    var query = {
      where : {
        doctor: params.doctor,
        state : {
          '!': ['denied', 'blocked']
        },
        start: {
          '>': params.start
        }
      },
      sort:'start',
      limit:250
    };
    console.log(query);
    async.waterfall([
      function(callback) {
        Appointment.find(query).populate('patient').populate('doctor').exec(function (err, appoint) {
          console.log("Found " + appoint.length + " records");
          callback(null, appoint);
        });
      },
      function(appoint, callback) {
        for (var i = 0 ; i < appoint.length; i++) {
          if (appoint[i].patient != undefined) {
            var trouve = false;
            for ( var j = 0 ; j < patients.length; j++){
              if (patients[j].id == appoint[i].patient.id ) trouve = true;
            }
            if ( !trouve && (appoint[i].patient.receiveBroadcast) && (appoint[i].patient.email.indexOf("paydoc.fr") === -1)) {
              appoint[i].patient.dname = appoint[i].doctor.lastName;
              appoint[i].patient.start = appoint[i].start;
              patients[patients.length] = appoint[i].patient;
            }
          }
        }
        console.log(patients.length + " email should be sent !")
        callback(null, patients);
      },
      function(patients, callback) {
        for (var i = 0; i < patients.length; i++) {
          Email.send({
              template: 'email-proposition-rdv',
              data: [
                {
                  "FNAME": patients[i].firstName
                },
                {
                  "DNAME": patients[i].dname
                },
                {
                  "DATERDV": moment(patients[i].start).format('L')
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
        callback(null);
      },
      function(callback) {
        var newAppointment = {
          start: params.start,
          end: params.end,
          doctor: params.doctor
        };

        Appointment.create(newAppointment).exec(function createCB(err, created) {
          console.log("Create appointment");
          if (req.isSocket){
            Appointment.find({}).exec(function(e,listOfApp){
              Appointment.subscribe(req.socket,listOfApp);
            });
          }
          if (err) return res.json(err)
          else {
            callback(null, created)
          }
        })
      }
    ], function (err, created) {
      return res.json(created);
    });
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

          Appointment.find({doctor: item.id, patient: null, state: {'!': 'blocked'}, start : {">": new Date().toISOString()}}).populate('doctor').exec(function(err, app){
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

  confirmAppointmentByEmail: function(req,res){
    var params = req.params.all();
    Appointment.update({id: params.id},{
      state : 'approved'
    }).exec(function(err,data){
      if (!err)
        return res.json(err)
      else
        return res.send('Votre rendez-vous à bien été confirmé !')
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
      if ((app.patient != undefined) && (app.patient.email.indexOf("paydoc.fr") === -1)) {
        Email.send({
            template: 'email-annulation-rdv',
            data: [
              {
                "FNAME": app.patient.firstName
              },
              {
                "DNAME": app.doctor.lastName
              },
              {
                "RDVDATE": moment(app.start).format('L')
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
      }
      else {
        return res.json({message: 'Compte mail fictif'});
      }

    })
  },

  getPendingAppointments: function(req, res) {
    var appointments = [];
    var params = req.params.all();
    var query = {
      where : {
        doctor: params.doctor,
        state : 'pending',
        start: {
          '>': new Date(params.start),
          '<': new Date(params.end)
        }
      },
      sort:'start',
    };
    Appointment.find(query).populate('patient').populate('doctor').exec(function(err, data) {
      if (err)
        return res.json(err);

      for (var i = 0; i < data.length; i++) {
        if (data[i].patient != null) {
          email = data[i].patient.email;
          phone = data[i].patient.mobilePhone;
          if (email.indexOf('paydoc.fr') == -1) {
            data[i].start = new Date(data[i].start);
            data[i].disabled = false;
            appointments.push(data[i]);
          }
          else if ((email.indexOf('paydoc.fr') > -1) && (phone != null)) {
            data[i].start = new Date(data[i].start);
            data[i].disabled = true;
            appointments.push(data[i]);
          }
        }
      }
      return res.json(appointments);
    })
  },

  actionByEmail: function(req, res) {
    var params = req.params.all();
    if (params.action && params.id) {
      Appointment.findOneById(params.id)
        .exec(function(err, app) {
          if (err) return res.json(500, {success: false, message: "Bad Request"})
          if (!app) return res.json(401, {success: false, message: "This appointment doesn't exist"})
          if (params.action == 'confirm') {
            app.state = 'approved';
            app.save();
            return res.send("Votre rendez-vous à bien été confirmé");
          }
          else if (params.action == 'cancel') {
            app.state = 'denied';
            app.save()
            return res.send("Votre rendez-vous à bien été annulé");
          }
          else {
            return res.json(400, {success: false, message: "Wrong action"});
          }
        })
    }
    else {
      return res.json(400, {success: false, message: "Wrong params"})
    }
  }

};
