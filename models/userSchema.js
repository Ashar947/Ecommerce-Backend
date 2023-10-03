const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique:true
    },
    phone: {
        type: Number,
        required: true
    },
    role: {
        type: String,
        required: true,
        default:"User"
    },
    password: {
        type: String,
        required: true
    },
    picture: {
        type: String
    },
    address:{
        type:String
    },
    country:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ]
})
// hasing passowrd
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
})

// Genrating Token
userSchema.methods.generateAuthToken = async function () {
    try {
        console.log(`Token == generating `)
        let genToken = jwt.sign({ _id: this._id },"mernapplication5678912345");
        console.log(`Token == ${genToken}`)
        this.tokens = this.tokens.concat({token:genToken}); 
        await this.save();
        return genToken;
        
    } catch (error) {
        console.log(`error is ${error}`);
    }
}

userSchema.methods.comparePassword = async function (enteredPassword,next) {
    // console.log(`Entered Password ${enteredPassword} this passowrd is ${this.password}` )
    return await bcrypt.compare(`${enteredPassword}`, `${this.password}`);

}




const User = mongoose.model('User', userSchema);
module.exports = User;