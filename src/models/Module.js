const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  lesson: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson"
  }],
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  }
},{timestamps: true});



const Module = mongoose.model('Module', moduleSchema);

module.exports = Module;
