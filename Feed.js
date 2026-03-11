import React, { useState } from "react";

function Feed(){

  const [post,setPost] = useState("");
  const [posts,setPosts] = useState([]);

  const addPost = () => {
    setPosts([...posts, post]);
    setPost("");
  };

  return(
    <div style={{textAlign:"center"}}>

      <h2>NovaPlus Feed</h2>

      <input
        placeholder="Write something..."
        value={post}
        onChange={(e)=>setPost(e.target.value)}
      />

      <button onClick={addPost}>Post</button>

      <div>
        {posts.map((p,i)=>(
          <p key={i}>{p}</p>
        ))}
      </div>

    </div>
  );
}

export default Feed;
