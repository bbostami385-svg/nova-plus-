import React, { useEffect, useState } from "react";

function Profile() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    // 👉 Load user
    fetch(`https://novaplus-social.onrender.com/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(() => console.log("User load error"));

    // 👉 Load posts
    fetch("https://novaplus-social.onrender.com/api/posts")
      .then(res => res.json())
      .then(data => {
        const myPosts = data.filter(p => p.userId === userId);
        setPosts(myPosts);
      })
      .catch(() => console.log("Posts load error"));

  }, [userId]);

  if (!user) return <p style={{ textAlign: "center" }}>Loading...</p>;

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>{user.name} 🔥</h2>

      <p>📧 {user.email}</p>
      <p>👥 Followers: {user.followers?.length || 0}</p>
      <p>➡ Following: {user.following?.length || 0}</p>

      <h3 style={{ marginTop: "20px" }}>Posts 📸</h3>

      {posts.length === 0 ? (
        <p>No posts yet...</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
          {posts.map(p => (
            <div key={p._id} style={{ margin: "10px" }}>
              {p.image && (
                <img
                  src={p.image}
                  alt=""
                  width="150"
                  style={{ borderRadius: "10px" }}
                />
              )}

              {p.video && (
                <video
                  width="150"
                  controls
                  style={{ borderRadius: "10px" }}
                >
                  <source src={p.video} />
                </video>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Profile;
