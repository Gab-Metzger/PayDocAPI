/**
* Appointment.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  schema: true,

  attributes: {
    startDate: {
      type:'datetime',
      required: true
    },

    state: {
      type: 'string',
      enum: ['pending', 'approved', 'denied'],
      defaultsTo: 'pending'
    },

    patient:{
      model:'patient'
    },

    doctor:{
      model:'doctor',
      required: true
    },

    toJSON: function() {
      var obj = this.toObject();
      obj.start = obj.startDate;
      obj.end = new Date(obj.startDate.getTime() + 15*60000);
      obj.title = obj.patient.name;
      switch(obj.state) {
        case 'pending'   :  obj.color = 'yellow';  break;
        case 'approved':  obj.color = 'green';  break;
        case 'denied'  :  obj.color = 'red';  break;
      }
      return obj;
    }
  }
};

