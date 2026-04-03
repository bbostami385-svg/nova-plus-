import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const API = process.env.REACT_APP_API;
const socket = io(API);

function Messenger() {
  const [friends, setFriends] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState(null);
  const [typingUser, setTypingUser] = useState("");

  // 🔥 VIDEO CALL
  const [stream, setStream] = useState(null);
  const [call, setCall] = useState(null);

  const myVideo = useRef();
  const userVideo = useRef();

  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const chatRef = useRef();

  // -----------------------
  // LOAD FRIENDS
  // -----------------------
  const loadFriends = async () => {
    try {
      const res = await fetch(`${API}/api/users/friends`, {
        headers: { Authorization: "Bearer " + token }
      });
      const data = await res.json();
      setFriends(data);
    } catch {
      console.log("Friend load error");
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  // -----------------------
  // SOCKET
  // -----------------------
  useEffect(() => {
    if (!myId) return;

    socket.emit("addUser", myId);

    socket.on("getUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("receiveMessage", (msg) => {
      msg.status = "delivered";
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("typing", (data) => {
      setTypingUser(data.senderId);
      setTimeout(() => setTypingUser(""), 1000);
    });

    socket.on("incomingCall", (data) => {
      setCall(data);
    });

    socket.on("callAccepted", () => {
      console.log("Call accepted");
    });

    return () => {
      socket.off("getUsers");
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("incomingCall");
      socket.off("callAccepted");
    };
  }, [myId]);

  // -----------------------
  // LOAD CHAT
  // -----------------------
  const loadMessages = async (id) => {
    setCurrentChat(id);

    socket.emit("joinRoom", {
      senderId: myId,
      receiverId: id
    });

    try {
      const res = await fetch(`${API}/api/messages/${id}`, {
        headers: { Authorization: "Bearer " + token }
      });
      const data = await res.json();
      setMessages(data);
    } catch {
      console.log("Message load error");
    }
  };

  // -----------------------
  // AUTO SCROLL
  // -----------------------
  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // -----------------------
  // UPLOAD FILE
  // -----------------------
  const uploadFile = async (file) => {
    const fileRef = ref(storage, "chat/" + Date.now());
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  // -----------------------
  // SEND MESSAGE
  // -----------------------
  const sendMessage = async () => {
    if (!currentChat) return alert("Select user first");
    if (!text && !media) return;

    let fileUrl = "";
    if (media) {
      fileUrl = await uploadFile(media);
    }

    const msg = {
      senderId: myId,
      receiverId: currentChat,
      text,
      media: fileUrl,
      status: "sent"
    };

    socket.emit("sendMessage", msg);

    try {
      await fetch(`${API}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(msg)
      });
    } catch {}

    setMessages((prev) => [...prev, msg]);
    setText("");
    setMedia(null);
    setPreview(null);
  };

  // -----------------------
  // VOICE
  // -----------------------
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);

    mediaRecorder.current.ondataavailable = (e) => {
      chunks.current.push(e.data);
    };

    mediaRecorder.current.onstop = async () => {
      const blob = new Blob(chunks.current);
      const url = await uploadFile(blob);

      const msg = {
        senderId: myId,
        receiverId: currentChat,
        audio: url
      };

      socket.emit("sendMessage", msg);
      setMessages((prev) => [...prev, msg]);

      chunks.current = [];
    };

    mediaRecorder.current.start();
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
  };

  // -----------------------
  // VIDEO CALL
  // -----------------------
  const startVideo = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    setStream(mediaStream);
    myVideo.current.srcObject = mediaStream;
  };

  const callUser = () => {
    if (!currentChat) return alert("Select user first");

    socket.emit("callUser", {
      from: myId,
      to: currentChat
    });
  };

  const acceptCall = () => {
    socket.emit("acceptCall", {
      from: myId,
      to: call.from
    });
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}>

      {/* FRIEND LIST */}
      <div style={{ width: "30%", borderRight: "1px solid gray" }}>
        <h3>Friends</h3>
        {friends.map((f) => (
          <div key={f._id} onClick={() => loadMessages(f._id)}>
            {onlineUsers.includes(f._id) ? "🟢" : "⚪"} {f.name}
          </div>
        ))}
      </div>

      {/* CHAT */}
      <div style={{ width: "70%", padding: "10px" }}>
        <h3>Chat 💬</h3>

        <div style={{ height: "70%", overflowY: "scroll" }}>
          {messages.length === 0 && <p>No messages yet...</p>}

          {messages.map((m, i) => (
            <div key={i} style={{
              textAlign: m.senderId === myId ? "right" : "left"
            }}>
              {m.text && (
                <p style={{
                  background: m.senderId === myId ? "#dcf8c6" : "#eee",
                  padding: "8px",
                  borderRadius: "10px",
                  display: "inline-block"
                }}>
                  {m.text}
                </p>
              )}

              {m.media && <video src={m.media} controls width="150" />}
              {m.audio && <audio src={m.audio} controls />}

              {m.senderId === myId && (
                <span>
                  {m.status === "sent" && "✔"}
                  {m.status === "delivered" && "✔✔"}
                </span>
              )}
            </div>
          ))}

          {typingUser && <p><i>typing...</i></p>}
          <div ref={chatRef}></div>
        </div>

        {/* INPUT */}
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);

            socket.emit("typing", {
              senderId: myId,
              receiverId: currentChat
            });
          }}
        />

        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files[0];
            setMedia(file);
            setPreview(URL.createObjectURL(file));
          }}
        />

        {preview && <img src={preview} width="80" alt="preview" />}

        <button onClick={sendMessage} disabled={!text && !media}>
          Send 🚀
        </button>

        <button onMouseDown={startRecording} onMouseUp={stopRecording}>
          🎤
        </button>

        {/* VIDEO CALL */}
        <div>
          <button onClick={startVideo}>🎥 Camera</button>
          <button onClick={callUser}>📞 Call</button>
        </div>

        {call && (
          <div>
            <p>Incoming Call...</p>
            <button onClick={acceptCall}>Accept</button>
          </div>
        )}

        <video ref={myVideo} autoPlay muted width="120" />
        <video ref={userVideo} autoPlay width="120" />

      </div>
    </div>
  );
}

export default Messenger;
