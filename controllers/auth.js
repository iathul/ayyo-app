const User = require('../models/user')
const jwt = require('jsonwebtoken')

// User signup
exports.signUp = async (req, res) => {

    try {
        const userExists = await User.findOne({ email:req.body.email })
        if (userExists){
            return res.status(400).json({
                error: 'User already exists'
            })
        } 
    
        const user = new User(req.body)
        const newUser = await user.save()

        if(!newUser){
            return res.status(400).json({
                error: "Signup failed. Please try again"
            })
        }else {
            return res.status(200).json({
                message: "Signup success"
            })
        }

    } catch (error) {
        console.log(error)
        throw error
    }
}

// User signin
exports.signIn = async (req, res) => {

    try {
        const { email, password } = req.body
        const user = await User.findOne({email: email})
    
        if(!user){
            return res.status(400).json({
                error: "User not found. Please signup" 
            })
        }

        if(!user.autheticate(password)){
            return res.status(401).json({
                error: "Invalid password"
            })
        }
    
        const token = jwt.sign({ _id: user._id },
            process.env.TOKEN_SECRET, { expiresIn: '7d'}
        )

        let authUser = user.userData()

        return res.json({token, authUser})     

    } catch (error) {
        console.log(error)
        throw error
    }
}