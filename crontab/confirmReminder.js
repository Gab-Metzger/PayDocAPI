var moment = require('moment');
moment.locale('fr');

module.exports = {
  run : function(){
    var nowDate = new Date();
    var minDate = addDays(nowDate,3);
    var maxDate = addDays(nowDate,4);

    Appointment.find({state: 'pending', start: {'>=': minDate, '<': maxDate}})
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
                  {"PNAME": name},
                  {"PMOBILE": data[i].patient.mobilePhone}
                ]
              }
              else {
                var mergedVars = [
                  {"FNAME": data[i].patient.firstName},
                  {"DNAME": data[i].doctor.lastName},
                  {"PNAME": name}
                ]
              }
              Email.send({
                  template: 'email-pour-rappel-de-rdv-non-confirm',
                  data: mergedVars,
                  to: [{
                    name: name,
                    email: data[i].patient.email
                  }],
                  subject: '[PayDoc] Attention votre rendez-vous n\'est pas confirmé'
                },
                function optionalCallback (err) {
                  if (err) return console.log(err);
                  console.log('Mail '+i+' sent !');
                });
            }
            else if (data[i].patient.email.indexOf("paydoc.fr") != -1 && data[i].patient.mobilePhone != undefined) {
              var mergedVars = [
                {"FNAME": data[i].patient.firstName},
                {"DNAME": data[i].doctor.lastName},
                {"PNAME": name},
                {"PMOBILE": data[i].patient.mobilePhone}
              ];

              Email.send({
                  template: 'email-pour-rappel-de-rdv-non-confirm',
                  data: mergedVars,
                  to: [{
                    name: 'PayDoc',
                    email: 'contact@paydoc.fr'
                  }],
                  subject: '[PayDoc] Attention votre rendez-vous n\'est pas confirmé'
                },
                function optionalCallback (err) {
                  if (err) return console.log(err);
                  console.log('Mail to contact@paydoc.fr sent !');
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
