import React, { useEffect, useState } from "react";

function Feed() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");

  // -----------------------
  // Get Posts
  // -----------------------
  const getPosts = async () => {
    try {
      const res = await fetch("https://novaplus-social.onrender.com/api/posts");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.log("Error loading posts");
    }
  };

  useEffect(() => {
    getPosts();
  }, []);

  // -----------------------
  // Create Post
  // -----------------------
  const createPost = async () => {
    const token = localStorage.getItem("token");

    if (!text) return alert("Write something!");

    try {
      const res = await fetch("https://novaplus-social.onrender.com/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          text,
          image: ""
        })
      });

      const data = await res.json();

      if (res.ok) {
        setText("");
        getPosts();
      } else {
        alert(data.msg || "Error creating post");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  // -----------------------
  // Like Post
  // -----------------------
  const likePost = async (postId) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `https://novaplus-social.onrender.com/api/posts/${postId}/like`,
        {
          method: "PUT",
          headers: {
            "Authorization": "Bearer " + token
          }
        }
      );

      if (res.ok) {
        getPosts();
      }
    } catch (err) {
      console.log("Like error");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Feed 🚀</h2>

      {/* ---------------- Create Post UI ---------------- */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ padding: "8px", width: "250px" }}
        />
        <button onClick={createPost} style={{ marginLeft: "10px" }}>
          Post 🚀
        </button>
      </div>

      {/* ---------------- Posts ---------------- */}
      {posts.length === 0 ? (
        <p>No posts yet...</p>
      ) : (
        posts.map((post) => (
          <div
            key={post._id}
            style={{
              border: "1px solid gray",
              margin: "10px",
              padding: "10px"
            }}
          >
            <p>{post.text}</p>

            <small>
              {new Date(post.createdAt).toLocaleString()}
            </small>

            <br />

            <button
              onClick={() => likePost(post._id)}
              style={{ marginTop: "10px" }}
            >
              ❤️ Like ({post.likes.length})
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default Feed;
