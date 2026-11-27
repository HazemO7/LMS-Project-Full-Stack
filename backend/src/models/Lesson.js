const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
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
  },
  videoUrl: {
    type: String,
    required: false
  }
}, { timestamps: true });

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = Lesson;
