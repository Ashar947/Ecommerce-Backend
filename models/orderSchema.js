const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderUser: {
        type: String,
        required: true
    },
    items:[
        {
            itemId:{
                type:String,
                required:true
            },
            reviewCheck: {
                type: Boolean,
                default: false,
              },
              reviewStar: {
                type: Number,
              },
              reviewText: {
                type: String,
              },
              reviewPictures:[
                {
                    path:{
                        type:String
                    },
                }
              ],
            
            
        }
    ],
    totalPrice:{
        type:Number,
        required:true
    },
    shippingAddress:{
        type:String,
        required:true
    },
    country:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    PaymentInfo:{
        type:String,
        default:"Cash"
    },
    placedOn:{
        type:Date,
        default:Date.now
    },
    orderStatus:{
        type:String,
        default:"Pending"
    },
    returnRequest:{
        type:Boolean,
        default:false
    }
    
    
})
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;