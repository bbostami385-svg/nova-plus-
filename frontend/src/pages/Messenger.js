import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const API = process.env.REACT_APP_API;
const socket = io(API);

function Messenger() {
  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const token = localStorage.getItem("token");

  // -----------------------
  // LOAD OLD MESSAGES (API)
  // -----------------------
  const loadMessages = async () => {
    try {
      const res = await fetch(`${API}/api/messages/${userId}`, {
        headers: { Authorization: "Bearer " + token }
      });

      const data = await res.json();
      setMessages(data || []);
    } catch {
      alert("Error loading messages");
    }
  };

  // -----------------------
  // RECEIVE REAL-TIME MESSAGE
  // -----------------------
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("receiveMessage");
  }, []);

  // -----------------------
  // SEND MESSAGE
  // -----------------------
  const sendMessage = async () => {
    if (!text) return;

    const msg = {
      senderId: "me",
      receiverId: userId,
      text,
      createdAt: new Date()
    };

    // 🔥 REAL-TIME SEND
    socket.emit("sendMessage", msg);

    // 🔥 DATABASE SAVE
    try {
      await fetch(`${API}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          receiverId: userId,
          text
        })
      });
    } catch {
      console.log("DB save failed");
    }

    // UI update
    setMessages((prev) => [...prev, msg]);
    setText("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Messenger 💬 (Live)</h2>

      <input
        placeholder="Enter userId"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />

      <button onClick={loadMessages}>Load Chat</button>

      {/* CHAT BOX */}
      <div style={{
        border: "1px solid gray",
        marginTop: "10px",
        padding: "10px",
        height: "300px",
        overflowY: "scroll"
      }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.senderId === "me" ? "right" : "left"
            }}
          >
            <p style={{
              background: "#eee",
              display: "inline-block",
              padding: "5px 10px",
              borderRadius: "10px"
            }}>
              {m.text}
            </p>
          </div>
        ))}
      </div>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type message..."
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Messenger;
