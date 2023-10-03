const jwt = require("jsonwebtoken");
const Admin = require('../models/adminSchema');
require('dotenv').config();


const adminAuthenticate = async (req , res , next) =>{
    try{
        const token = req.cookies.jwtoken;
        const verifyToken = jwt.verify(token,process.env.SECRETKEY);
        const rootUser = await Admin.findOne({_id:verifyToken._id , "tokens.token":token});
        if (!rootUser){
            throw new Error('User not found')
        }
        req.token = token;
        req.rootUser = rootUser;
        req.userID = rootUser._id;
        next();                                                          
    }catch(error){
        res.status(401).send('Admin not auth')
        console.log(error)
    }

}

module.exports = adminAuthenticate;