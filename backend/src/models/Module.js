const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
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
