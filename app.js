const express = require('express')
const app = express()
app.use(express.json());
require('dotenv').config();
require('./database/connection')
app.use(require('./router/router'));
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')
app.use(cookieParser())


PORT = process.env.PORT

app.get('/app', (req,res) => {
    res.json({msg:"Running"});
})


app.listen(PORT,()=>{
    console.log(`Server is running at port ${PORT} .`)
})



// res.send(req.rootUser);