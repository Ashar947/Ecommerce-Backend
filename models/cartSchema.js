const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    cartUser: {
        type: String,
        required: true
    },
    cartItems:[
        {
            itemId:{
                type:String
            },
            quantity:{
                type:Number,
                default:1
            },
            totalPrice:{
                type:Number
            }
        }
    ],

})
const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;