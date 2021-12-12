"use strict"

const User = require('../models/user')

// Get user
exports.getUser = (req, res) => {

    try {

        const user = req.authUser
        return res.json(user)

    } 
    catch (error) {
        throw error
    }
}

// Update user 
exports.updateUser = async (req, res) => {

    try {
        const user = req.authUser
        const { firstName, lastName } = req.body

        user.firstName = firstName
        user.lastName = lastName

        const updated = await user.save()

        if(!updated) {
            return res.status(500).json({
                error: "Something went wrong. Please try again" 
            })
        }else {
            return res.status(200).json({
                message: "User updated successfully"
            })
        }
    } 
    catch (error) {
        throw error
    } 
}