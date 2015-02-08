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
      model:'patient',
      required: true
    },

    doctor:{
      model:'doctor',
      required: true
    }
  }
};

