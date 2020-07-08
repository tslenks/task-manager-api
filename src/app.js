// Exrepss will set up here

const express = require('express');
// no need to attribute any variable to it as it is only for db connection
require('./db/mongoose');
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express();

// it will parse all incoming requests to json
app.use(express.json());

// register the routers to be available on browser
app.use(userRouter)
app.use(taskRouter)

module.exports  =  app