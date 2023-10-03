const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  user_name: {
    type: String,
    required: true,
  },
  user_email: {
    type: String,
    required: true,
    unique: true,
  },
  user_contact: {
    type: Number,
    required: true,
  },
  message_subject: {
    type: String,
    requried: true,
  },
  user_message: {
    type: Number,
    required: true,
  },
  response: {
    type: Boolean,
    default: false,
  },
  admin_response: {
    type: String
  },
  submittedOn: {
    type: Date,
    default: Date.now,
  },
});

const ContactUs = mongoose.model("ContactUs", contactSchema);
module.exports = ContactUs;
