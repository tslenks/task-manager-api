const jwt  = require('jsonwebtoken')
const User = require('../model/user')

const auth = async(req, res, next) => {
    try {
        const token = req.header('Authorization').replace(/^Bearer /, '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user  = await User.findOne({ _id: decoded._id, 'tokens.token': token })
        if(!user) {
            throw new Error();
        }
        // add user to the request for the next request done by this user
        req.token = token
        req.user = user
        next()
    } catch(err) {
        res.status(401).send({error: 'error:  Authentication failed'})
    }
}

module.exports = auth