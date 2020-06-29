const express = require('express')
const User = require('../model/user')
const auth = require('../middleware/auth')
const router = new express.Router()
const jwt = require('jsonwebtoken')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeMail, sendCancelationAccountMail} = require('../emails/account')

//endpoint is the pattern /... <=> the url
router.post('/users/login', async(req,res) => {
  const {email='', password=''} = req.body
  try {
    const user = await User.findByCredentials(email, password)

    // This token as long as it is present (not expired) will be available for all devices
    // That means if the user is connected and that the token exists, even though he deconnects on one device, in the other device 
    // he will not deconnected, but to do that we must add the token as a part 
    const token = await user.generateAuthToken()

    // first method
    // for more secure, we can add some controls to data to send back to the user
    // res.send({user: user.getPublicProfile(), token})
    res.send({user, token})
  } catch (error) {
    res.status(400).send(error)
  }
})

router.post('/users/logout', auth, async(req, res) => {
  try {
      req.user.tokens = req.user.tokens.filter((token) => {
        return token.token !== req.token
      })
      await req.user.save()
      res.send()
  } catch (error) {
      res.status(500).send()
  }
})

router.post('/users/logoutAll', auth, async(req, res) => {
  try {
      req.user.tokens = []
      await req.user.save()
      res.status(200).send()
  } catch (error) {
      res.status(500).send()
  }
})

// creation of Creation API
router.post('/users', async(req, res) => {
    // get the paramters inside to body request property
    const user = new User(req.body);   
    try {
      // save it to database
      await user.save();
      sendWelcomeMail(user.email, user.name)
      const token = await user.generateAuthToken();
      res.status(201).send({user, token});
    } catch (e) {
      res.status(400).send(e); 
    }
  });
  
  router.get('/users/me', auth ,async(req, res) => {
      // allow user to see only
      res.send(req.user);
  });
 
  // update user by id
  router.patch('/users/me', auth, async(req, res) => {
    const { user } = req
    const updates = Object.keys(req.body);
    const allowUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => allowUpdates.includes(update));
  
    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }
  
    try {
      updates.forEach(update => user[update] = req.body[update])
      await user.save();
      res.send(user);
    } catch (e) {
      res.status(400).send(e);
    }
  });
  
  // delete user by id
  router.delete('/users/me', auth, async(req, res) => {
    const _id = req.user._id
    try {
      await req.user.remove()
      sendCancelationAccountMail(req.user.email, req.user.name)
      res.send(req.user)
    } catch (e) {
      return res.status(500).send(e)
    }
    })

// add an avatar

// The memory storage engine stores the files in memory as Buffer objects. It doesn't have any options.
// We put this because actually, due to security, we need to set this memoryStorage configuration
// and in the upload configuration, we add it in the storage property
const storage = multer.memoryStorage()
const upload = multer({
  dest:'avatars/',
  limits:{
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if(!file.originalname.match(/\.(jpg|jpeg|png)$/i)){
      return cb(new Error('Invalid image extenstion'))
    }
    cb(undefined, true)
  },
  storage
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async(req, res) => {
   // convert all images to png and resize so we have a normalized data
   const buffer = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer()

  // req for multi part data
  req.user.avatar = buffer
  await req.user.save()
  res.send()
}, (error, req, resp, next) => {
   // we can directly use it because it will arrive here in case of any errors appear
    resp.status(400).send({error: error.message})
})

// delete the user avatar
router.delete('/users/me/avatar', auth, async(req, res) => {
  req.user.avatar = undefined
  await req.user.save()
  res.send()
})

router.get('/users/:id/avatar', async(req, res) => {

  try {
    const user = await User.findById(req.params.id)
    if(!user || !user.avatar){
      throw new Error()
    }
    // res.set('Content-Type', 'application/json')
    res.set('Content-Type', 'image/png')
    res.send(user.avatar) // in url :: http://localhost:3000/users/5ef1d897a4a47337141ee026/avatar return the image

  } catch (error) {
    res.status(404).send()
  }

})

module.exports = router 