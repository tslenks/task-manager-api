const mongoose = require('mongoose');
const taskSchema = mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  owner:{
    type: mongoose.Schema.Types.ObjectId,
    required:true,
    // reference to a field to another model, it is the name of the model define in the ""mongoose.model('User"...
    ref:'User'
  }
},{
  timestamps:true
})

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
