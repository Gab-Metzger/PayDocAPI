/**
 * SearchEngineController
 *
 * @description :: Server-side logic for managing searchengines
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var moment = require('moment');
moment.locale('fr');

module.exports = {



  /**
   * `SearchEngineController.search()`
   */
  search: function (req, res) {
		var range = rangeToDate(JSON.parse(req.param('days')), JSON.parse(req.param('periods')));
		var nbrRes = 0;
    var availableAppointments = [];
    var interval = req.param('interval') || 15;
    var count = 0;
    var isAvailable;
    var query = {};

    while (count < range.length) {
      isAvailable = true;

      query = {
        start: {
          '>=': new Date(range[count].start).toISOString(),
          '<': new Date(range[count].end).toISOString()
        },
        end: {
          '>=': new Date(range[count].start).toISOString(),
          '<': new Date(range[count].end).toISOString()
        }
      };

      async.series([
        function(callback){
          Appointment.find(query)
            .exec(function(err, results) {
              console.log(count);
              while (moment(range[count].start).isBefore(moment(range[count].end)) || (nbrRes <= 4)) {
                isAvailable = true;
                console.log("I'm in");
                for (var j = 0; j < results.length; j++) {
                  if (moment(range[count].start).isSame(moment(results[j].start))) {
                    isAvailable = false;
                  }
                }
                if (isAvailable) {
                  availableAppointments.push(moment(range[count].start));
                  nbrRes++;
                }
                range[count].start = moment(range[count].start).add(interval,'minutes');
              }
              callback()
            })
          },
          function(callback){
            console.log("Test");
            count++;
            callback();
          }
        ]);
    }    
    console.log(nbrRes);
    return res.json(availableAppointments);
  },

};

/**
* `rangeToDate()`
*/
function rangeToDate(days, periods) {
  var daysOfWeek = days;
  var intervals = periods;

  var result = [];

  for(var i=0; i < intervals.length; i++) {
    var start = moment().weekday(daysOfWeek[i]);
    var end = moment().weekday(daysOfWeek[i]);

    switch(intervals[i]) {
      case 'morning':
        start.set({'hour': 9, 'minute': 0, 'second': 0, 'millisecond': 0});
        end.set({'hour': 12, 'minute': 0, 'second': 0, 'millisecond': 0});
      break;
      case 'afternoon':
        start.set({'hour': 14, 'minute': 0, 'second': 0, 'millisecond': 0});
        end.set({'hour': 17, 'minute': 0, 'second': 0, 'millisecond': 0});
      break;
      case 'evening':
        start.set({'hour': 17, 'minute': 0, 'second': 0, 'millisecond': 0});
        end.set({'hour': 20, 'minute': 0, 'second': 0, 'millisecond': 0});
      break;
    }

    result.push({start: start, end: end});
  }

  return result;
}
