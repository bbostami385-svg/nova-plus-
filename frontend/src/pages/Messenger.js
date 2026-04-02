import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const API = process.env.REACT_APP_API;
const socket = io(API);

function Messenger() {
  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");

  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

  // -----------------------
  // SOCKET REGISTER
  // -----------------------
  useEffect(() => {
    if (myId) {
      socket.emit("addUser", myId);
    }

    socket.on("getUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("typing", (data) => {
      setTypingUser(data.senderId);

      setTimeout(() => {
        setTypingUser("");
      }, 1000);
    });

    return () => {
      socket.off("getUsers");
      socket.off("receiveMessage");
      socket.off("typing");
    };
  }, [myId]);

  // -----------------------
  // LOAD OLD MESSAGES
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
  // SEND MESSAGE
  // -----------------------
  const sendMessage = async () => {
    if (!text) return;

    const msg = {
      senderId: myId,
      receiverId: userId,
      text,
      createdAt: new Date()
    };

    // real-time
    socket.emit("sendMessage", msg);

    // DB save
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

    setMessages((prev) => [...prev, msg]);
    setText("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Messenger 💬 (Live)</h2>

      {/* ONLINE USERS */}
      <p>🟢 Online Users: {onlineUsers.length}</p>

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
              textAlign: m.senderId === myId ? "right" : "left"
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

        {/* TYPING INDICATOR */}
        {typingUser && (
          <p><i>Typing...</i></p>
        )}
      </div>

      {/* INPUT */}
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);

          // typing emit
          socket.emit("typing", {
            senderId: myId,
            receiverId: userId
          });
        }}
        placeholder="Type message..."
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Messenger;
