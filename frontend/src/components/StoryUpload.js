import React, { useState } from "react";

const API = process.env.REACT_APP_API;

function StoryUpload({ refresh }) {
  const [image, setImage] = useState("");
  const [video, setVideo] = useState("");

  const uploadStory = async () => {
    const token = localStorage.getItem("token");

    await fetch(`${API}/api/stories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ image, video }),
    });

    setImage("");
    setVideo("");
    refresh(); // reload stories
  };

  return (
    <div style={{ marginBottom: "10px" }}>
      <input
        placeholder="Image URL"
        value={image}
        onChange={(e) => setImage(e.target.value)}
      />
      <input
        placeholder="Video URL"
        value={video}
        onChange={(e) => setVideo(e.target.value)}
      />
      <button onClick={uploadStory}>Upload Story 📸</button>
    </div>
  );
}

export default StoryUpload;
