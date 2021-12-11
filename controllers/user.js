"use strict"

const User = require('../models/user')

exports.getUser = (req, res) => {

    const user = req.authUser
    return res.json(user)
    
}