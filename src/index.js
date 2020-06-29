const express = require('express');
// no need to attribute any variable to it as it is only for db connection
require('./db/mongoose');
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express();
const port = process.env.PORT;

// it will parse all incoming requests to json
app.use(express.json());

// register the routers to be available on browser
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
  console.log(`app running !! ${port}`);
});
