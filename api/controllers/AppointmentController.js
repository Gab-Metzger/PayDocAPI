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

        for (var i = 0; i < patients.length; i++) {
          Email.send({
              template: 'email-proposition-de-rendez-vous',
              data: [
                {
                  "FNAME": patients[i].firstName
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
      startDate: params.startDate,
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


    Appointment.find({patient: params.patient, state : {'!': "denied"}, startDate : {">": new Date().toISOString() } }).populate('doctor').exec(function(err,appoint){

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
              "RDVDATE": app.startDate.format("dd/mm/yyyy à H'h'MM", true)
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

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
}

var dateFormat = function () {
  var    token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
    timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
    timezoneClip = /[^-+\dA-Z]/g,
    pad = function (val, len) {
      val = String(val);
      len = len || 2;
      while (val.length < len) val = "0" + val;
      return val;
    };

  // Regexes and supporting functions are cached through closure
  return function (date, mask, utc) {
    var dF = dateFormat;

    // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
    if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
      mask = date;
      date = undefined;
    }

    // Passing date through Date applies Date.parse, if necessary
    date = date ? new Date(date) : new Date;
    if (isNaN(date)) throw SyntaxError("invalid date");

    mask = String(dF.masks[mask] || mask || dF.masks["default"]);

    // Allow setting the utc argument via the mask
    if (mask.slice(0, 4) == "UTC:") {
      mask = mask.slice(4);
      utc = true;
    }

    var    _ = utc ? "getUTC" : "get",
      d = date[_ + "Date"](),
      D = date[_ + "Day"](),
      m = date[_ + "Month"](),
      y = date[_ + "FullYear"](),
      H = date[_ + "Hours"](),
      M = date[_ + "Minutes"](),
      s = date[_ + "Seconds"](),
      L = date[_ + "Milliseconds"](),
      o = utc ? 0 : date.getTimezoneOffset(),
      flags = {
        d:    d,
        dd:   pad(d),
        ddd:  dF.i18n.dayNames[D],
        dddd: dF.i18n.dayNames[D + 7],
        m:    m + 1,
        mm:   pad(m + 1),
        mmm:  dF.i18n.monthNames[m],
        mmmm: dF.i18n.monthNames[m + 12],
        yy:   String(y).slice(2),
        yyyy: y,
        h:    H % 12 || 12,
        hh:   pad(H % 12 || 12),
        H:    H,
        HH:   pad(H),
        M:    M,
        MM:   pad(M),
        s:    s,
        ss:   pad(s),
        l:    pad(L, 3),
        L:    pad(L > 99 ? Math.round(L / 10) : L),
        t:    H < 12 ? "a"  : "p",
        tt:   H < 12 ? "am" : "pm",
        T:    H < 12 ? "A"  : "P",
        TT:   H < 12 ? "AM" : "PM",
        Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
        o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
        S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
      };

    return mask.replace(token, function ($0) {
      return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
  };
}();

// Some common format strings
dateFormat.masks = {
  "default":      "ddd mmm dd yyyy HH:MM:ss",
  shortDate:      "m/d/yy",
  mediumDate:     "mmm d, yyyy",
  longDate:       "mmmm d, yyyy",
  fullDate:       "dddd, mmmm d, yyyy",
  shortTime:      "h:MM TT",
  mediumTime:     "h:MM:ss TT",
  longTime:       "h:MM:ss TT Z",
  isoDate:        "yyyy-mm-dd",
  isoTime:        "HH:MM:ss",
  isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
  isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
  dayNames: [
    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ],
  monthNames: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
  ]
};

// For convenience...
Date.prototype.format = function (mask, utc) {
  return dateFormat(this, mask, utc);
};

