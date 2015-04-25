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

    toJSON: function() {
      var obj = this.toObject();
      switch(obj.state) {
        case 'pending'   :  obj.color = '#FFFF00';  break;
        case 'approved':  obj.color = '#2EFE64 ';  break;
        case 'denied'  :  obj.color = 'red';  break;
      }
      if (obj.patient != null) {
        if (obj.happened)
          obj.title = obj.patient.lastName + ' - arrivé';
        else
          obj.title = obj.patient.lastName;
        if ((parseInt(obj.patient) !== obj.patient) && (obj.patient.email.indexOf('paydoc.fr') != -1) && (obj.patient.mobilePhone == null)) {
          obj.color = '#2E64FE';
        }
      }
      else {
        if (obj.state == 'blocked') {
          obj.title = "Créneau bloqué";
          obj.color = '#A89E9E';
        }
        else {
          obj.title = "RdV proposé !";
          obj.color = 'violet';
        }

      }
      //obj.allDay = false;
      return obj;
    }
  }
};
