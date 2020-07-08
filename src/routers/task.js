const express = require('express')
const Task = require('../model/task')
const auth = require('../middleware/auth');
const { findOne } = require('../model/task');

// use this to allow separating router, instance a new Router from Express
const router = new express.Router()

// creation of a task
router.post('/tasks', auth, async(req, res) => {
  // Get the paramters inside to body request property
  const task =  new Task({
    ...req.body, 
    owner: req.user._id
  })
  
  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// so now, instead of using directly the express (app.post, app.get, ..., we now use the router)
// read tasks
// /tasks?completed=true|false

// pagination :: limit // skip; tasks?limit=10&skip=0  (skip = 10 -> second page, skip = 20, skip the 20 first results => page 3)
// GEt /tasks?sortBy=createdAt[_|:|...][asc|desc]
router.get('/tasks', auth, async(req, res) => {
    // const tasks = await Task.find({});   
    const match = {}
    const sort = {}
    if(req.query.completed) {
      match.completed =  req.query.completed === 'true'     
    }
    if(req.query.sortBy) {
      /*sort:{
        createdAt: -1 //1(asc)|-1(desc)
        //completed:-1|1
      }*/
      const parts = req.query.sortBy.split(':')
      sort[parts[0]] =  parts[1] === 'desc' ? -1 : 1
    }

    try {
      // 1st method
      // const user = await Task.find({owner: req.user._id});

      // 2nd method
      // await req.user.populate('tasks').execPopulate()

      //2nd method with filter
      await req.user.populate({
       path: 'tasks',
       match,
       options: {
        // here we paginate and sort the request
        limit:parseInt(req.query.limit), //2 , if limit is not defined, it will be ignored
        skip:parseInt(req.query.skip), //  || 2,
        sort
      }
      }).execPopulate()
      res.send(req.user.tasks);
    } catch (e) {
      res.status(500).send(e);
    }
  });
  
  // read task by id
  router.get('/tasks/:id', auth, async(req, res) => {
    const _id = req.params.id;
    try {
      // const task = await Task.findById(_id);
      const task = await Task.findOne({ _id, owner: req.user._id})
      if (!task) {
        return res.status(404).send();
      }
      res.send(task);
    } catch (e) {
      res.status(500).send(e);
    }
  });
  
  // update task by id
  router.patch('/tasks/:id', auth, async(req, res) => {
    const fields = ['description', 'completed'];
    const isValidOperation = Object.keys(req.body).every((update) => fields.includes(update));
    
    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid task updates!' });
    }
    const _id = req.params.id;
  
    try {
      // method to allow middeware (<=> schema functinality) to be used
      const task = await Task.findOne({_id, owner: req.user._id})
      if (!task) {
        return res.status(404).send();
      }
      Object.keys(req.body).forEach(update => task[update] = req.body[update])
      await task.save()
      res.send(task);
    } catch (e) {
      res.status(400).send(e);
    }
  });
  
  // delete task by id
  router.delete('/tasks/:id', auth, async(req, res) => {
    const _id = req.params.id
    try {
      const task = await Task.findOneAndDelete({_id, owner: req.user._id})
      if(!task) {
        return res.status(404).send('task not found')
      }
      res.send(task)
    } catch (e) {
      return res.status(500).send(e)
    }
  })

  module.exports = router 