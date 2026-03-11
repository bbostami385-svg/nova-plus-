const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

let posts = [];

app.get("/", (req, res) => {
  res.send("NovaPlus Backend Running 🚀");
});

// Create Post
app.post("/posts", (req, res) => {
  const post = req.body;
  posts.push(post);
  res.json({ message: "Post added", post });
});

// Get Posts
app.get("/posts", (req, res) => {
  res.json(posts);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
