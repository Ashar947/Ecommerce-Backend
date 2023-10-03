const express = require("express");
const router = express.Router();
require("dotenv").config();
const User = require("../models/userSchema");
const Admin = require("../models/adminSchema");
const Product = require("../models/productSchema");
const Cart = require("../models/cartSchema");
const Wishlist = require("../models/whishlistSchema");
const Order = require("../models/orderSchema");
const Contact = require("../models/contactUsSchema");
const Return = require("../models/returnSchema");
const bcrypt = require("bcrypt");
const adminAuth = require("../middleware/adminAuth");
const userAuth = require("../middleware/userAuth");
const cookieParser = require("cookie-parser");
router.use(cookieParser());
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


router.post("/user/register", async (req, res) => {
  const { firstName, lastName, email, phone, password, country, city } =req.body;
  console.log(req.body);
  if (
    firstName.length == 0 ||
    lastName.length == 0 ||
    phone.length == 0 ||
    email.length == 0 ||
    password.length == 0 ||
    country.length == 0 ||
    city.length == 0
  ) {
    console.log("fields cannot be left emoty");
    return res.status(204).json({ error: "fields cannot be left emoty" });
  }
  try {
    const userExist = await User.findOne({ email: email });
    if (userExist) {
      console.log("user already registered");
      return res
        .status(422)
        .json({ error: "User already exist with this email" });
    }
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      country,
      city,
    });
    await user.save();
    res.status(201).json({ message: "User regsitered " });
  } catch (error) {
    res.send(error);
    console.log(error);
  }
});

router.post("/user/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email.length == 0 || password.length == 0) {
      return res.status(204).json({ error: "fields cannot be left emoty" });
    }
    const userLogin = await User.findOne({ email: email });
    if (userLogin) {
      const passMatch = await bcrypt.compare(password, userLogin.password);
      // passMatch = true or false ;
      console.log(`passwordMatch = ${passMatch}`);
      if (passMatch) {
        console.log(`Password Match is  : ${passMatch}`);
        const token = await userLogin.generateAuthToken();
        res.cookie("jwtoken", token, {
          httpOnly: true,
        });
        res.status(201).json({ message: "User Logged In" });
      } else {
        return res.status(422).json({ error: "Password Incorrect" });
      }
    } else {
      return res.status(404).json({ error: "Invalid Email" });
    }
  } catch (error) {
    res.send(`error : ${error}`);
  }
});

router.post("/admin/register", async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  console.log(req.body);
  if (
    firstName.length == 0 ||
    lastName.length == 0 ||
    email.length == 0 ||
    phone.length == 0 ||
    password.length == 0
  ) {
    console.log("fields cannot be left emoty");
    return res.status(204).json({ error: "fields cannot be left empty" });
  }
  try {
    const userExist = await Admin.findOne({ email: email });
    if (userExist) {
      console.log("admin already registered");
      return res
        .status(422)
        .json({ error: "admin already exist with this email" });
    }
    const user = new Admin({ firstName, lastName, email, phone, password });
    await user.save();
    res.status(201).json({ message: "Admin regsitered " });
  } catch (error) {
    res.send(error);
    console.log(error);
  }
});

router.post("/admin/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email.length == 0 || password.length == 0) {
      return res.status(204).json({ error: "fields cannot be left emoty" });
    }
    const adminLogin = await Admin.findOne({ email: email });
    if (adminLogin) {
      const passMatch = await bcrypt.compare(password, adminLogin.password);
      // passMatch = true or false ;
      console.log(`passwordMatch = ${passMatch}`);
      if (passMatch) {
        const token = await adminLogin.generateAuthToken();
        res.cookie("jwtoken", token, {
          httpOnly: true,
        });
        res.status(201).json({ message: "Admin Logged In" });
      } else {
        return res.status(422).json({ error: "Password Incorrect" });
      }
    } else {
      return res.status(404).json({ error: "Invalid Email" });
    }
  } catch (error) {
    res.send(`error : ${error}`);
  }
});

router.post("/products/createNew", adminAuth, async (req, res) => {
  try {
    const { productName, productCategory, productPrice, productColor } =
      req.body;
    if (
      productName.length == 0 ||
      productCategory.length == 0 ||
      productName.length == 0 ||
      productCategory.length == 0
    ) {
      return res.status(204).json({ error: "fields cannot be left emoty" });
    }
    const prod = new Product({
      productName,
      productCategory,
      productPrice,
      productColor,
    });
    await prod.save();
    res.status(201).json({ message: "Product Created " });
  } catch (error) {
    console.log(error);
    res.send(`error : ${error}`);
  }
});

router.get("/logout", (req, res) => {
  try {
    console.log("Logout Page");
    res.clearCookie("jwtoken", { path: "/" });
    return res.status(200).send("User Logout");
  } catch (error) {
    return res.status(404).json({ catch: true, errormsg: error });
  }
});


router.get("/cart", userAuth, async (req, res) => {
  try {
    const currentUser = req.rootUser;
    const getCart = await Cart.findOne({ cartUser: currentUser._id });
    // console.log(getCart.cartItems.quantity)
    return res.status(200).json({ Data: getCart });
  } catch (error) {
    return res.status(404).json({ errormsg: error });
  }
});

router.post("/addCart/:product_id", userAuth, async (req, res) => {
  try {
    const product_data = await Product.findOne({ _id: req.params.product_id });
    const price = product_data.productPrice;
    const user = req.rootUser;
    const prod = await Product.findOne({ _id: req.params.product_id });
    if (!prod) {
      return res.status(400).json({ ProductFound: false, msg: "Invalid Id" });
    }
    const checkCart = await Cart.findOne({ cartUser: user._id });
    if (checkCart === null) {
      console.log("cart is null");
      const createCart = new Cart({ cartUser: user._id });
      await createCart.save();
      const UserCart = await Cart.updateOne(
        { cartUser: user._id },
        {
          $push: {
            cartItems: { itemId: req.params.product_id, totalPrice: price },
          },
        }
      );
      return res.status(200).json({ ProductFound: true, Cart: createCart });
    }
    const checkProd = await checkCart.cartItems.find(
      (item) => item.itemId === req.params.product_id
    );
    if (!checkProd) {
      console.log("!(checkProd)");
      const UserCart = await Cart.updateOne(
        { cartUser: user._id },
        {
          $push: {
            cartItems: { itemId: req.params.product_id, totalPrice: price },
          },
        }
      );
      return res
        .status(200)
        .json({ ProductFound: true, cartUpdated: UserCart });
    }

    console.log("here");
    checkProd.quantity += 1;
    checkProd.totalPrice = checkProd.quantity * price;
    await checkCart.save();
    return res.status(200).json({ ProductFound: true, cartUpdated: checkCart });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.get("/wishlist", userAuth, async (req, res) => {
  try {
    const currentUser = req.rootUser;
    const getitems = await Wishlist.findOne({ listUser: currentUser._id });
    return res.status(200).json({ Data: getitems });
  } catch (error) {
    return res.status(404).json({ errormsg: error });
  }
});

router.post("/addtoWishlist/:product_id", userAuth, async (req, res) => {
  try {
    const user = req.rootUser;
    const prod = await Product.findOne({ _id: req.params.product_id });
    if (!prod) {
      return res.status(400).json({ ProductFound: false, msg: "Invalid Id" });
    }
    const checklist = await Cart.findOne({ listUser: user._id });
    if (checklist === null) {
      console.log("wishlist is null");
      const createList = new Wishlist({
        listUser: user._id,
        "listItems.itemId": req.params.product_id,
      });
      await createList.save();
      return res.status(200).json({ ProductFound: true, List: createList });
    }
    const checkProd = await Wishlist.find({
      cartUser: user._id,
      "listItems.itemId": req.params.product_id,
    });
    console.log(checkProd);
    const UserList = await Wishlist.updateOne(
      { listUser: user._id },
      {
        $push: {
          listItems: { itemId: req.params.product_id },
        },
      }
    );
    return res
      .status(200)
      .json({ ProductFound: true, Wishlist_Updated: UserList });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.get("/products/viewall", adminAuth, async (req, res) => {
  try {
    const allProds = await Product.find();
    res.status(200).json({ adminLogin: true, data: allProds });
  } catch (error) {
    res.status(404).json({ catch: true, msg: error, adminLogin: false });
  }
});

router.delete("/products/delete/:id", adminAuth, async (req, res) => {
  try {
    const del_id = req.params.id;
    const delProd = await Product.deleteOne({ _id: del_id });
    res.status(200).json({ adminLogin: true, data: delProd });
  } catch (error) {
    res.status(404).json({ catch: true, msg: error, adminLogin: false });
  }
});

router.put("/products/update/:id", adminAuth, async (req, res) => {
  try {
    const {
      productName,
      productCategory,
      productPrice,
      productColor,
      feature,
      productRating,
    } = req.body;
    const udpdateProd_data = await Product.updateOne(
      { _id: req.params.id },
      {
        $set: {
          productName: productName,
          productCategory: productCategory,
          productPrice: productPrice,
          productColor: productColor,
          feature: feature,
          productRating: productRating,
        },
      }
    );
    res.status(200).json({ Update: "Success", data: udpdateProd_data });
  } catch (error) {
    return res.status(404).json({ catch: true, errormsg: error });
  }
});

router.put("/user/update/:id", userAuth, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, country, city } = req.body;
    const userAbout = req.rootUser;
    const user_id = req.params.id;
    if (user_id === userAbout._id) {
      const userData = await User.updateOne(
        { _id: userAbout._id },
        {
          $set: {
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone,
            country: country,
            city: city,
          },
        }
      );
      return res.status(200).json({ Update: "Success", data: userData })  ;
    }
    return res.status(400).json({ message: "id's doesnot match" });
  } catch (error) {
    return res.status(404).json({ catch: true, errormsg: error });
  }
});

router.get("/user/about", userAuth, async (req, res) => {
  try {
    const userAbout = req.rootUser;
    const userData = await User.findOne({ _id: userAbout._id });
    res.status(404).json({ data: userData });
  } catch (error) {
    return res.status(404).json({ catch: true, errormsg: error });
  }
});

router.post("/order/create/:cartid", userAuth, async (req, res) => {
  try {
    const { address, country, city } = req.body;
    const user = req.rootUser;
    const cart = await Cart.findOne({ cartUser: user._id });
    const orderItems = cart.cartItems.map((cartItem) => {
      return {
        itemId: cartItem.itemId,
      };
    });
    const priceItems = cart.cartItems.map((cartItem) => {
      return {
        totalPrice: cartItem.totalPrice,
      };
    });
    const totalPrice = priceItems.reduce((total, item) => {
      return total + item.totalPrice;
    }, 0);
    const newOrder = new Order({
      orderUser: user._id,
      items: orderItems,
      totalPrice: totalPrice,
      shippingAddress: address,
      country: country,
      city: city,
    });
    await newOrder.save();

    const delCart = await Cart.deleteOne({ cartUser: user._id });

    res.status(200).json({
      msg: "Order Created",
      OrderDetails: newOrder,
      CartDeleted: delCart,
    });
  } catch (error) {
    console.log("Order wasnot Created");
    return res
      .status(404)
      .json({ catch: true, errormsg: error, msg: "Error Creating Order" });
  }
});

router.get("/order/user/viewall", userAuth, async (req, res) => {
  try {
    const user = req.rootUser;
    const user_orders = await Order.find({ orderUser: user._id });
    res.status(200).json({ msg: "Orders Found", Orders: user_orders });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.get("/order/user/view/:id", userAuth, async (req, res) => {
  try {
    const user = req.rootUser;
    const user_order = await Order.findOne({ _id: req.params.id });
    res.status(200).json({ msg: "Order Found", Order: user_order });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.get("/order/admin/viewallOrders", adminAuth, async (req, res) => {
  try {
    const admin = req.rootAdmin;
    const all_orders = await Order.find();
    res.status(200).json({ msg: "Orders Found", Orders: all_orders });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.get("/order/admin/viewOrder/:id", adminAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id });
    res.status(200).json({ msg: "Order Found", Order: user_order });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.put("/order/admin/updateStatus/:id", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const update_order = await Order.updateOne(
      { _id: req.params.id },
      {
        $set: {
          orderStatus: status,
        },
      }
    );
    res.status(200).json({ msg: "Order Found", Order: update_order });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.post("/user/contactUs", userAuth, async (req, res) => {
  try {
    const user = req.rootUser;
    const { subject, message } = req.body;
    const contact = new Contact({
      user_id: user._id,
      user_name: user.firstName + " " + user.lastName,
      user_email: user.email,
      user_contact: user.phone,
      message_subject: subject,
      user_message: message,
    });
    await contact.save();
    res.status(201).json({ msg: "Contact Saved", Contact_Data: contact });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.get("/user/contactUs/viewOnly", userAuth, async (req, res) => {
  try {
    const user = req.rootUser;
    const getContact = await Contact.find({ user_id: user._id });
    res.status(200).json({ msg: "Contact Found", Contact_Data: getContact });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.get("/user/contactUs/viewOnly/:id", userAuth, async (req, res) => {
  try {
    const user = req.rootUser;
    const getContact = await Contact.findOne({
      user_id: user._id,
      _id: req.params.id,
    });
    res.status(200).json({ msg: "Contact Found", Contact_Data: getContact });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.get("/admin/contactUs/viewall", adminAuth, async (req, res) => {
  try {
    const getallContact = await Contact.find();
    res.status(200).json({ msg: "Contact Found", Contact_Data: getallContact });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.put("/admin/contactUs/update/:id", adminAuth, async (req, res) => {
  try {
    const { response } = req.body;
    const updateContact = await Contact.updateOne(
      { _id: req.params.id },
      {
        $set: {
          response: true,
          admin_response: response,
        },
      }
    );
    res
      .status(200)
      .json({ msg: "Response Added", Contact_Data: updateContact });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.post("/user/changePassword", userAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword, confrimPassword } = req.body;
    if (oldPassword.length == 0 ||newPassword.length == 0 ||confrimPassword.length == 0) 
    {return res.status(400).json({status: false,message: "Fields cannot be left blank"});
    }
    const user = req.rootUser;
    if (newPassword != confrimPassword) 
    {return res.status(401).json({status: false,message: "Password doesnot match",});
    }
    const getUser = await User.findById(user._id);
    if (!getUser) {
      return res.status(501).json({status: false,message: "No User"});
    }
    const isPasswordMatched = await getUser.comparePassword(oldPassword);
    // console.log(`isPasswordMatched`)
    if (!isPasswordMatched) {
      console.log(`PasswordMatched`);
      return res.status(502).json({
        status: false,
        message: "Invalid Password",
      });
    }
    const newPassHash = await bcrypt.hash(newPassword, 12);
    const update = await User.updateOne(
      { _id: user._id },
      {
        $set: { password: newPassHash },
      }
    );
    return res.status(201).json({
      status: true,
      message: "Success {Password Change Successfull}",
      Data: update,
    });
  } catch (error) {
    return res
      .status(404)
      .json({ catch: true, errormsg: error, PassowrdChanged: false });
  }
});

router.post("/admin/changePassword", adminAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword, confrimPassword } = req.body;
    if (
      oldPassword.length == 0 ||
      newPassword.length == 0 ||
      confrimPassword.length == 0
    ) {
      return res.status(400).json({
        status: false,
        message: "Fields cannot be left blank",
      });
    }
    const admin = req.rootUser;
    if (newPassword != confrimPassword) {
      return res.status(401).json({
        status: false,
        message: "Password doesnot match",
      });
    }
    const getAdmin = await Admin.findById(admin._id);
    if (!getAdmin) {
      console.log("Admin not found");
      return res.status(501).json({
        status: false,
        message: "Admin not found",
      });
    }
    const isPasswordMatched = await getAdmin.comparePassword(oldPassword);
    if (!isPasswordMatched) {
      console.log(`PasswordMatched`);
      return res.status(502).json({
        status: false,
        message: "Invalid Password",
      });
    }
    const newPassHash = await bcrypt.hash(newPassword, 12);
    const update = await Admin.updateOne(
      { _id: admin._id },
      {
        $set: { password: newPassHash },
      }
    );
    return res.status(201).json({
      PassowrdChanged: false,
      message: "Success {Password Change Successfull}",
      Data: update,
    });
  } catch (error) {
    return res
      .status(404)
      .json({ catch: true, errormsg: error, PassowrdChanged: false });
  }
});

router.post(
  "/user/orders/:order_id/review/:productID",
  userAuth,
  async (req, res) => {
    try {
      const orderID = req.params.order_id;
      const productID = req.params.productID;
      const checkOrder = await Order.findOne({ _id: orderID });
      if (!checkOrder) {
        return res.status(400).json({ message: "Order not found" });
      }
      const orderItems = await checkOrder.items.find(
        (item) => item.itemId === req.params.productID
      );
      if (!orderItems) {
        return res.status(401).json({
          message: "Product not found in Orders",
          OrderItems: orderItems,
        });
      }
      // if (orderItems.reviewCheck) == TRUE
      if (orderItems.reviewCheck) {
        return res.status(400).json({
          Status: false,
          message:
            "Review already submitted for this order or Can't Review this at the moment",
        });
      }
      const { reviewStar, reviewText } = req.body;
      if (reviewStar > 5 || reviewStar < 1 || reviewText.length == 0) {
        return res.status(400).json({
          status: false,
          message: "Please rate the product from 1 to 5",
        });
      }
      // Update order with review information
      orderItems.reviewCheck = true;
      orderItems.reviewStar = 5;
      orderItems.reviewText = "reviewText demo FIRST";
      await checkOrder.save();

      // Update product with review information and calculate average rating based on all ratings

      const product_avgReview = await Product.findOne({ _id: productID });
      const allReviews = product_avgReview.productReview.map(
        (productReviews) => {
          return {
            reviewStar: productReviews.reviewStar,
          };
        }
      );
      const sumReviews = allReviews.reduce((total, item) => {
        return total + item.reviewStar;
      }, 0);
      const avgReview = sumReviews / allReviews.length;
      const updateInProducts = await Product.updateOne(
        { _id: productID },
        {
          $push: {
            productRating: avgReview,
            productReview: {
              reviewUserName:
                req.rootUser.firstName + " " + req.rootUser.lastName,
              reviewStar: reviewStar,
              reviewText: reviewText,
            },
          },
        }
      );
      return res.status(200).json({
        Status: true,
        NewRating: avgReview,
        message: "Review submitted successfully",
        Order: checkOrder,
        ProductsUpdated: updateInProducts,
      });
    } catch (error) {
      res
        .status(404)
        .json({ catch: true, errormsg: error, ReviewUpdated: false });
    }
  }
);

router.get("/test/product/:product_ID", async (req, res) => {
  try {
    const product_avgReview = await Product.findOne({
      _id: req.params.product_ID,
    });
    const allReviews = product_avgReview.productReview.map((productReviews) => {
      return {
        reviewStar: productReviews.reviewStar,
      };
    });
    const sumReviews = allReviews.reduce((total, item) => {
      return total + item.reviewStar;
    }, 0);
    const avgReview = sumReviews / allReviews.length;
    res.status(200).json({
      NewRating: avgReview,
      ProductOLDRating: product_avgReview.productRating,
      sumReviews: sumReviews,
      length: allReviews.length,
    });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.get("/test/payment", userAuth, async (req, res) => {
  let payment = false;
  try {
    console.log(req.body.stripeToken);
    const user = req.rootUser;
    stripe.customers
      .create({
        email: user.email,
        source: req.body.stripeToken,
        name: user.firstName,
        address: {
          line1: user.address,
          postal_code: "test code :012345",
          city: "Test City",
          state: "Test State",
          country: "Test Country",
        },
      })
      .then((customer) => {
        return stripe.charges.create({
          amount: parseInt(200) * 100, // amount will be amount*100
          description: "Test Product",
          currency: "PKR",
          customer: user._id,
        });
      })
      .then((charge) => {
        payment = true;
        console.log("Payment Successsful ");
      })
      .catch((err) => {
        payment = false;
      });
    res.status(200).json({ PaymentSuccess: payment });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.post("/test/payment/create-payment", async (req, res) => {
  try {
    // const { amount, currency, source } = req.body;
    let paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: "4242424242424042",
        exp_month: 12,
        exp_year: 2024,
        cvc: "123",
      },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(100) * 100,
      currency: "usd",
      payment_method_types: ["card"],
      payment_method: {
        object: "card",
        number: "4242424242424242",
        exp_month: 12,
        exp_year: 2024,
        cvc: "123",
      },
    });
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing payment." });
  }
});

router.post("/create-payment-intent", async (req, res) => {
  try {
    let paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: "4242424242424042",
        exp_month: 12,
        exp_year: 2024,
        cvc: "123",
      },
    });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100 * 100,
      currency: "usd",
      payment_method_types: ["card"],
      payment_method: paymentMethod.id,
      confirm: true,
    });
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing payment." });
  }
});

router.post("/process-payment", async (req, res) => {
  try {
    // const { amount, currency, source } = req.body;
    const charge = await stripe.charges.create({
      amount: 100 * 100,
      currency: "usd",
      source: {
        object: "card",
        number: " 4242 4242 4242 4242",
        exp_month: 12,
        exp_year: 2034,
        cvc: "567",
      }, // The payment source (card token, token ID, or payment method ID)
    });
    res.status(200).json({ success: true, charge });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing payment." });
  }
});

router.get("/returns/viewall", adminAuth, async (req, res) => {
  try {
    const getallReturns = await Return.find();
    res.status(200).json({ msg: "Returns Found", Returns_Data: getallReturns });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.get("/returns/view/:id", adminAuth, async (req, res) => {
  try {
    const returns_id = await Return.findOne({ _id: req.params.id });
    res.status(200).json({ msg: "Return Found", Return_Data: returns_id });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.get("/returns/view/pendings", adminAuth, async (req, res) => {
  try {
    const returns_pending = await Return.find({ returnStatus: "Pending" });
    res
      .status(200)
      .json({ msg: "Returns Found", Return_Data: returns_pending });
  } catch (error) {
    res.status(404).json({ catch: true, errormsg: error });
  }
});

router.post(
  "/returns/create/:order_id/:product_id",
  userAuth,
  async (req, res) => {
    try {
      const user = req.rootUser;
      const order_id = req.params.order_id;
      const product_id = req.params.product_id;
      const find_order = await Order.findOne({ _id: order_id });
      if (!find_order) {
        return res.status(400).json({ message: "Order not found" });
      }
      if (find_order.returnRequest) {
        return res
          .status(402)
          .json({ message: "Return Request already submitted for this order" });
      }
      const checkProd = await find_order.items.find(
        (item) => item.itemId == product_id
      );
      if (!checkProd) {
        return res
          .status(401)
          .json({ status: false, message: "Product not found in Orders" });
      }
      const checkReview = checkProd.reviewCheck;
      const returnRequest = new Return({
        returnUser: user._id,
        returnReason: "Not Satisfied",
        returnMessage: "I am not satisfied with the product",
        orderId: order_id,
        itemId: product_id,
        reviewSubmitted: checkReview,
      });
      await returnRequest.save();
      const updateOrder = await Order.updateOne(
        { _id: order_id },
        {
          $set: {
            returnRequest: true,
          },
        }
      );
      // await updateOrder.save();
      res
        .status(201)
        .json({
          msg: "Return Request Created",
          Data: returnRequest,
          updateOrder: updateOrder,
        });
    } catch (error) {
      res.status(404).json({ catch: true, errormsg: error });
    }
  }
);

router.get("/returns/user/viewall", userAuth, async (req, res) => {
  try {
    const getUser_returns = await Return.find({ returnUser: req.rootUser._id });
    return res
      .status(200)
      .json({
        status: true,
        msg: "Returns Found",
        Returns_Data: getUser_returns,
      });
  } catch (error) {
    return res.status(404).json({ catch: true, errormsg: error });
  }
});

router.get("/returns/user/view/:id", userAuth, async (req, res) => {
  try {
    const getReturn = await Return.findOne({ _id: req.params.id });
    return res
      .status(200)
      .json({ status: true, msg: "Returns Found", Returns_Data: getReturn });
  } catch (error) {
    return res.status(404).json({ catch: true, errormsg: error });
  }
});

router.put("/returns/admin/update/:id", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const updateReturn = await Return.updateOne(
      { _id: req.params.id },
      {
        $set: {
          returnStatus: status,
        },
      }
    );
    return res
      .status(200)
      .json({
        status: true,
        msg: "Return Updated",
        Returns_Data: updateReturn,
      });
  } catch (error) {
    return res.status(404).json({ catch: true, errormsg: error });
  }
});

router.get("/search", async (req, res) => {
  try{
    const { name, category, feature } = req.query;
    const queryObj = {};
    if (name){queryObj.productName = { $regex: productName, $options: "i" };}
    if (category){queryObj.productCategory = { $regex: productCategory, $options: "i" };}
    if (feature) queryObj.feature = { $regex: feature, $options: "i" };
    console.log("queryObj is : ", queryObj);
    console.log(`Req.query is : ${req.query}`);
    const searchResult = await Product.find({queryObj});
    return res.status(200).json({status: true,msg: "Search Results",Returns_Data: searchResult,});
  }catch (error) {
    return res.status(404).json({ catch: true, errormsg: error });
  }
});

router.get("/search", async (req, res) => {
  try {
  } catch (error) {
    return res.status(404).json({ catch: true, errormsg: error });
  }
});

module.exports = router;
