const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    listUser: {
        type: String,
        required: true
    },
    listItems:[
        {
            itemId:{
                type:String
            },
        }
    ],

})
const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;