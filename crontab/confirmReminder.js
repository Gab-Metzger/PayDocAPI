var moment = require('moment');
moment.locale('fr');

module.exports = {
  run : function(){
    var nowDate = new Date();
    var minDate = addDays(nowDate,4);
    var maxDate = addDays(nowDate,5);

    Appointment.find({state: 'pending', start: {'>=': minDate, '<': maxDate}})
      .populate('patient')
      .populate('doctor')
      .exec(function found(err, data) {
        if (err) console.log(err);
        for (var i = 0; i < data.length; i++) {
          if (data[i].patient != undefined) {
            var appDate = new Date(data[i].start);
            if (data[i].patient.email.indexOf("paydoc.fr") === -1) {
              //Envoi du template
              Email.send({
                  template: 'email-pour-rappel-de-rdv-non-confirm',
                  data: [{
                    'FNAME': data[i].patient.firstName
                  },{
                    'DNAME': data[i].doctor.lastName
                  }],
                  to: [{
                    name: data[i].patient.name,
                    email: data[i].patient.email
                  }],
                  subject: '[PayDoc] Attention votre rendez-vous n\'est pas confirmé'
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
