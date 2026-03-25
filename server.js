const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// -----------------------
// Middleware
// -----------------------
app.use(cors());
app.use(express.json());

// -----------------------
// MongoDB Connection
// -----------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("MongoDB error ❌", err));

// -----------------------
// Models
// -----------------------
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  followers: [String],
  following: [String],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);

const PostSchema = new mongoose.Schema({
  userId: String,
  text: String,
  image: String,
  video: String,
  likes: [String],
  sharedFrom: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model("Post", PostSchema);

// -----------------------
// Auth Middleware
// -----------------------
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};

// -----------------------
// AUTH ROUTES
// -----------------------
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ msg: "Email exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hash
    });

    await user.save();

    res.json({ msg: "Signup success", user });

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ msg: "Login success", token, user });

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// -----------------------
// POSTS ROUTES
// -----------------------

// CREATE POST
app.post("/api/posts", auth, async (req, res) => {
  try {
    const { text, image, video } = req.body;

    const post = new Post({
      userId: req.user.id,
      text,
      image,
      video
    });

    await post.save();
    res.json(post);

  } catch {
    res.status(500).json({ msg: "Error creating post" });
  }
});

// GET POSTS
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch {
    res.status(500).json({ msg: "Error fetching posts" });
  }
});

// LIKE / UNLIKE
app.put("/api/posts/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: "Post not found" });

    if (!post.likes.includes(req.user.id)) {
      post.likes.push(req.user.id);
    } else {
      post.likes = post.likes.filter(id => id !== req.user.id);
    }

    await post.save();
    res.json(post);

  } catch {
    res.status(500).json({ msg: "Error" });
  }
});

// DELETE POST
app.delete("/api/posts/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: "Not found" });

    if (post.userId !== req.user.id)
      return res.status(403).json({ msg: "Not allowed" });

    await post.deleteOne();
    res.json({ msg: "Deleted" });

  } catch {
    res.status(500).json({ msg: "Error" });
  }
});

// SHARE POST
app.post("/api/posts/:id/share", auth, async (req, res) => {
  try {
    const original = await Post.findById(req.params.id);

    if (!original) return res.status(404).json({ msg: "Post not found" });

    const post = new Post({
      userId: req.user.id,
      text: original.text,
      image: original.image,
      video: original.video,
      sharedFrom: original._id
    });

    await post.save();
    res.json(post);

  } catch {
    res.status(500).json({ msg: "Error sharing post" });
  }
});

// -----------------------
// USER ROUTES
// -----------------------

// PROFILE
app.get("/api/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  res.json(user);
});

// FOLLOW / UNFOLLOW
app.post("/api/users/:id/follow", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const me = await User.findById(req.user.id);

    if (!user || !me)
      return res.status(404).json({ msg: "User not found" });

    if (!user.followers.includes(me._id.toString())) {
      user.followers.push(me._id);
      me.following.push(user._id);
    } else {
      user.followers = user.followers.filter(f => f !== me._id.toString());
      me.following = me.following.filter(f => f !== user._id.toString());
    }

    await user.save();
    await me.save();

    res.json({ msg: "Follow updated" });

  } catch {
    res.status(500).json({ msg: "Error" });
  }
});

// -----------------------
// HOME
// -----------------------
app.get("/", (req, res) => {
  res.send("NovaPlus Social Backend 🚀");
});

// -----------------------
// START SERVER
// -----------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
