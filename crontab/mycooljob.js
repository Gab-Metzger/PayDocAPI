var moment = require('moment');
moment.locale('fr');

module.exports = {
  run : function(){
    var nowDate = new Date();
    var minDate = addDays(nowDate,1);
    var maxDate = addDays(nowDate,2);

    Appointment.find({state: {'!': 'denied'}, start: {'>=': minDate, '<': maxDate}})
      .populate('patient')
      .populate('doctor')
      .exec(function found(err, data) {
        if (err) console.log(err);
        for (var i = 0; i < data.length; i++) {
          if (data[i].patient != undefined) {
            var name = data[i].patient.lastName.toUpperCase() + ' ' + data[i].patient.firstName;
            var appDate = new Date(data[i].start);
            if (data[i].patient.email.indexOf("paydoc.fr") === -1) {
              if (data[i].patient.mobilePhone != undefined) {
                var mergedVars = [
                  {"FNAME": data[i].patient.firstName},
                  {"DNAME": data[i].doctor.lastName},
                  {"DATERDV": moment(appDate).format('LL')},
                  {"PID": data[i].id},
                  {"PNAME": name},
                  {"PMOBILE": data[i].patient.mobilePhone}
                ]
              }
              else {
                var mergedVars = [
                  {"FNAME": data[i].patient.firstName},
                  {"DNAME": data[i].doctor.lastName},
                  {"DATERDV": moment(appDate).format('LL')},
                  {"PID": data[i].id},
                  {"PNAME": name}
                ]
              }
              Email.send({
                  template: 'email-rappel-rdv',
                  data: mergedVars,
                  to: [{
                    name: name,
                    email: data[i].patient.email
                  }],
                  subject: '[PayDoc] Rappel de rendez-vous'
                },
                function optionalCallback (err) {
                  if (err) return console.log(err);
                  console.log('Mail '+i+' sent !');
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
