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

    notes: {
      type:'text'
    },

    toJSON: function() {
      var obj = this.toObject();
      switch(obj.state) {
        case 'pending'   :  obj.color = 'orange';  break;
        case 'approved':  obj.color = 'green';  break;
        case 'denied'  :  obj.color = 'red';  break;
      }
      if (obj.patient != undefined) {
        obj.title = obj.patient.name;
        if (obj.patient.email.indexOf('paydoc.fr') != -1) {
          obj.color = 'blue';
        }
      }
      else {
        obj.title = "RdV proposé !";
        obj.color = 'violet';
      }
      obj.allDay = false;
      return obj;
    }
  }
};

