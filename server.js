const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.log(err));

const UserSchema = new mongoose.Schema({
  name:String,
  email:String,
  password:String
});

const User = mongoose.model("User",UserSchema);

app.get("/",(req,res)=>{
  res.send("NovaPlus Backend Running 🚀");
});

app.post("/api/signup",async(req,res)=>{

  const {name,email,password} = req.body;

  try{

    const existing = await User.findOne({email});

    if(existing){
      return res.status(400).json({message:"Email already exists"});
    }

    const hashed = await bcrypt.hash(password,10);

    const user = new User({
      name,
      email,
      password:hashed
    });

    await user.save();

    res.json({message:"User created"});

  }catch(err){
    res.status(500).json(err);
  }

});

app.post("/api/login",async(req,res)=>{

  const {email,password} = req.body;

  try{

    const user = await User.findOne({email});

    if(!user){
      return res.status(400).json({message:"User not found"});
    }

    const match = await bcrypt.compare(password,user.password);

    if(!match){
      return res.status(400).json({message:"Wrong password"});
    }

    const token = jwt.sign(
      {id:user._id},
      process.env.JWT_SECRET,
      {expiresIn:"7d"}
    );

    res.json({
      message:"Login success",
      token
    });

  }catch(err){
    res.status(500).json(err);
  }

});

app.listen(PORT,()=>{
  console.log("Server running on port "+PORT);
});
