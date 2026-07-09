const express=require('express');
const router = express.Router();

router.post('signup',function(req,res){
    res.send("SignUp router working properly");
});

const { signup, login } = require("../controllers/authController");

router.post("/signup", signup);

router.post("/login", login);


module.exports= router;