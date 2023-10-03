const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/ecommerce",{
}).then (()=>{
    console.log("Database Connection Succesful ");
}).catch((err)=>{
    console.log(`${err}`);
});





    