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
		var range = rangeToDate(req.param('day'), req.param('period'));
		var nbrRes = 0;

		Appointment.find({start: { '>': new Date(range.start), '<': new Date(range.end) }, end: { '>': new Date(range.start), '<': new Date(range.end) }})
			.exec(function(err, results) {
				console.log(results);
			})
    return res.json({
      todo: 'search() is not implemented yet!'
    });
  },

};

/**
* `rangeToDate()`
*/
function rangeToDate(day, period) {
	var dayOfWeek = parseInt(day);
	var interval = period;
	var start = moment().weekday(dayOfWeek);
	var end = moment().weekday(dayOfWeek);

	switch(interval) {
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

	return {
		start: start,
		end: end
	};
}
