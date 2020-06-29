const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken')
const task =require('./task');
const Task = require('./task');

// create a schema to allow some operations with middleware
const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, // sanitization
  },
  email: {
    type: String,
    unique:true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Invalid email!');
      }
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 7,
    validate(value) {
      if (value.toLowerCase().includes('password')) {
        const errorMessage = 'The password must not contain the password word ';
        throw new Error(errorMessage);
      }
    },
  },
  age: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) {
        throw new Error('Invalid Age, it must be a positive number');
      }
    },
  },
  tokens: [{
    token:{
      type: String,
      required:true
    }
  }], 
  avatar: {
    type: Buffer
  }
},{
  // to have field createdAt and updateAt in timestamp values, we have to define it like this
  timestamps:true 
})

// Add a virtual property for linking two entities, mongoose can know what relation this model will be linked
userSchema.virtual('tasks', {
    ref:'Task',
    localField:'_id',
    foreignField: 'owner'
})

// to hide a private data (1st Method)
userSchema.methods.getPublicProfile = function() {
  const user = this
  const userObject = user.toObject()

  delete userObject.password
  delete userObject.tokens
  return userObject
}

// to hide a private data (2nd Method), this method toJSON is like an overriding method
// so in the router we don't have to call it
userSchema.methods.toJSON = function() {
  const user = this
  const userObject = user.toObject()

  delete userObject.password
  delete userObject.tokens
  delete userObject.avatar
  
  return userObject
}

userSchema.methods.generateAuthToken = async function() {
  const user = this
  const token = jwt.sign({_id:user._id.toString()}, process.env.JWT_SECRET)  
  user.tokens = user.tokens.concat({ token })
  await user.save()
  return token
}

userSchema.statics.findByCredentials = async(email, password) => {
  const user = await User.findOne({email})
  
  if(!user) {
    throw new Error('Unable to login')
  }

  const isMatch = await bcryptjs.compare(password, user.password)
  if(!isMatch){
    throw new Error('Unable to login')
  }

  return user
}

// do before saving the user
userSchema.pre('save', async function (next) {
  const user = this;

  // if the password is modified, we hash it
  if(user.isModified('password')){
    user.password = await bcryptjs.hash(user.password, 8)
  }

  next() // this method is used to continue the normal operations
})

// Delete user's tasks when user is removed
userSchema.pre('remove', async function(next) {
  const user = this
  // adding criterias
  await Task.deleteMany({ owner: user._id})
  next()
})

// create a model, "capitalized"
const User = mongoose.model('User', userSchema);

module.exports = User;
