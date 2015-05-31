/**
* Appointment.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  schema: true,

  attributes: {
    start: {
      type:'datetime',
      required: true
    },
    end: {
      type:'datetime',
      required: true
    },
    state: {
      type: 'string',
      enum: ['pending', 'approved', 'denied', 'blocked'],
      defaultsTo: 'pending'
    },
    patient:{
      model:'patient'
    },
    doctor:{
      model:'doctor',
      required: true
    },
    notes: {
      type:'text'
    },
    happened: {
      type: 'boolean',
      defaultsTo: false
    },
    category: {
      type: 'string'
    },

    toJSON: function() {
      var obj = this.toObject();
      if (obj.category != null) {
        obj.color = obj.category
      }
      switch(obj.state) {
        case 'denied'  :  obj.color = 'red';  break;
      }
      if (obj.patient != null) {
        if (obj.happened)
          obj.title = obj.patient.lastName + ' - arrivé';
        else
          obj.title = obj.patient.lastName;
      }
      else {
        if (obj.state == 'blocked') {
          if (obj.notes != null) {
            obj.title = obj.notes
          }
          else {
            obj.title = "Créneau bloqué";
          }
          obj.color = '#A89E9E';
        }
        else {
          obj.title = "RdV proposé !";
          obj.color = 'violet';
        }

      }
      return obj;
    }
  }
};
