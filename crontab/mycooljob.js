var moment = require('moment');
moment.locale('fr');

module.exports = {
  run : function(){
    var nowDate = new Date();
    var minDate = addDays(nowDate,2);
    var maxDate = addDays(nowDate,3);

    Appointment.find({state: {'!': 'denied'}, start: {'>=': minDate, '<': maxDate}})
      .populate('patient')
      .populate('doctor')
      .exec(function found(err, data) {
        if (err) console.log(err);
        for (var i = 0; i < data.length; i++) {
          if (data[i].patient != undefined) {
            var appDate = new Date(data[i].start);
            if (data[i].patient.email.indexOf("paydoc.fr") === -1) {
              if (data[i].patient.mobilePhone != undefined) {
                var mergedVars = [
                  {"FNAME": data[i].patient.firstName},
                  {"DATERDV": moment(appDate).format('LL')},
                  {"DNAME": data[i].doctor.lastName},
                  {"PNAME": data[i].patient.name},
                  {"PMOBILE": data[i].patient.mobilePhone}
                ]
              }
              else {
                var mergedVars = [
                  {"FNAME": data[i].patient.firstName},
                  {"DATERDV": moment(appDate).format('LL')},
                  {"DNAME": data[i].doctor.lastName},
                  {"PNAME": data[i].patient.name}
                ]
              }
              Email.send({
                  template: 'email-rappel-du-rendez-vous',
                  data: mergedVars,
                  to: [{
                    name: data[i].patient.name,
                    email: data[i].patient.email
                  }],
                  subject: '[PayDoc] Rappel de rendez-vous'
                },
                function optionalCallback (err) {
                  if (err) return console.log(err);
                  console.log('Mail n°'+i+' sent !');
                });
            }
          }

        }
      })

      return false;
  }
};

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
}
