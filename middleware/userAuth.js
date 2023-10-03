const jwt = require("jsonwebtoken");
const User = require('../models/userSchema');
require('dotenv').config();
const bcrypt = require('bcrypt')


const userAuthenticate = async (req , res , next) =>{
    try{
        const token = req.cookies.jwtoken;
        const verifyToken = jwt.verify(token,process.env.SECRETKEY);
        const rootUser = await User.findOne({_id:verifyToken._id , "tokens.token":token});
        if (!rootUser){
            throw new Error('User not found')
        }
        req.token = token;
        req.rootUser = rootUser;
        req.userID = rootUser._id;

        next();
                                                               
    }catch(error){
        res.status(401).send('User not Auth')
        console.log(error)
    }

}

module.exports = userAuthenticate;