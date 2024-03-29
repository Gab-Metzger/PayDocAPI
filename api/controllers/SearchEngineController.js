/**
* SearchEngineController
*
* @description :: Server-side logic for managing searchengines
* @help        :: See http://links.sailsjs.org/docs/controllers
*/
var moment = require('moment');
moment.locale('fr');

module.exports = {

  search: function(req, res) {
    var range;
    var i = 0;
    var query = {};
    var nbrRes = 0;
    var availableAppointments = [];
    var interval = req.param('interval') || 15;
    var isAvailable;

    var body = req.params.all();

    if (body.days[0] != null) {
      var range = rangeToDate(req.param('days'), req.param('periods'), parseInt(req.param('week')));
    }
    else {
      var start = moment().set({'hour': 9, 'minute': 0, 'second': 0, 'millisecond': 0});
      var end = moment().set({'hour': 20, 'minute': 0, 'second': 0, 'millisecond': 0});

      var range = [{start: start.toDate(), end: end.toDate()}];
    }

    async.whilst(
      function () { return (i < range.length && nbrRes <= 4); },
      function (callback) {
        async.auto({
          appointments: function(cb) {
            isAvailable = true;
            query = {
              doctor: req.param('doctor'),
              start: {
                '>=': moment(range[i].start).startOf('day').toISOString(),
                '<=': moment(range[i].start).endOf('day').toISOString()
              }
            };
            console.log(query);
            Appointment
            .find(query)
            .exec(cb)
          },
          filter: ['appointments', function (cb, async_data) {
            var results = async_data.appointments;
            console.log(results);
            while (moment(range[i].start).isBefore(moment(range[i].end)) && (nbrRes <= 4)) {
              isAvailable = true;
              for (var j = 0; j < results.length; j++) {
                if (moment(range[i].start).isSame(moment(results[j].start))) {
                  isAvailable = false;
                }
                else if (moment(range[i].start).isBetween(moment(results[j].start), moment(results[j].end))) {
                  isAvailable = false;
                }
              }
              if (isAvailable) {
                availableAppointments.push(moment(range[i].start));
                nbrRes++;
              }
              range[i].start = moment(range[i].start).add(interval,'minutes');
            }
            cb(results);
          }]
        },
        function allDone(err, asyncData) {
          i++;
          callback();
        });
      },
      function (err, result) {
        return res.json(availableAppointments);
      }
    );
  }

};

function nextDay(day) {
  var todayWeek = moment().day();

  if (day < todayWeek) {
    return moment().day(day+7).toISOString();
  }
  else {
    return moment().day(day).toISOString();
  }
}

/**
* `rangeToDate()`
*/
function rangeToDate(days, periods, week) {
  var daysOfWeek = days;
  var intervals = periods;
  var result = [];

  for(var i=0; i < intervals.length; i++) {
    var start = moment(nextDay(daysOfWeek[i])).add(week, 'w');
    var end = moment(nextDay(daysOfWeek[i])).add(week, 'w');

    switch(intervals[i]) {
      case 'morning':
      start.set({'hour': 7, 'minute': 0, 'second': 0, 'millisecond': 0});
      end.set({'hour': 10, 'minute': 0, 'second': 0, 'millisecond': 0});
      break;
      case 'afternoon':
      start.set({'hour': 12, 'minute': 0, 'second': 0, 'millisecond': 0});
      end.set({'hour': 15, 'minute': 0, 'second': 0, 'millisecond': 0});
      break;
      case 'evening':
      start.set({'hour': 15, 'minute': 0, 'second': 0, 'millisecond': 0});
      end.set({'hour': 17, 'minute': 0, 'second': 0, 'millisecond': 0});
      break;
    }

    result.push({start: start.toISOString(), end: end.toISOString()});
  }
  return result;
}
