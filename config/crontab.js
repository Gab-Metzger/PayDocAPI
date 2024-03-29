module.exports.crontab = {

  /*
   * The asterisks in the key are equivalent to the
   * schedule setting in crontab, i.e.
   * minute hour day month day-of-week year
   * so in the example below it will run every minute
   */

  '0 6 * * *': function(){
    var continueTask = true;
    if (continueTask)
      continueTask = require('../crontab/mycooljob.js').run();
  },

  '0 16 * * *': function(){
    var continueTask = true;
    if (continueTask)
      continueTask = require('../crontab/confirmReminder.js').run();
  }
};
