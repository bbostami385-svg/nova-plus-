import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer/simplepeer.min.js";

const API = process.env.REACT_APP_API;
const socket = io(API);

function Messenger() {
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [currentChat, setCurrentChat] = useState(null);
  const [isGroup, setIsGroup] = useState(false);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [typingUser, setTypingUser] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [stories, setStories] = useState([]);

  // VIDEO CALL
  const [stream, setStream] = useState(null);
  const [call, setCall] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [callerSignal, setCallerSignal] = useState(null);

  const myVideo = useRef();
  const userVideo = useRef();
  const peerRef = useRef();

  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

  // -----------------------
  // LOAD DATA
  // -----------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const f = await fetch(`${API}/api/users/friends`, {
          headers: { Authorization: "Bearer " + token }
        });
        setFriends(await f.json());

        const g = await fetch(`${API}/api/groups`, {
          headers: { Authorization: "Bearer " + token }
        });
        setGroups(await g.json());

        const s = await fetch(`${API}/api/story`, {
          headers: { Authorization: "Bearer " + token }
        });
        setStories(await s.json());

        const n = await fetch(`${API}/api/notification`, {
          headers: { Authorization: "Bearer " + token }
        });
        setNotifications(await n.json());

      } catch (err) {
        console.log(err);
      }
    };

    loadData();
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
      setMessages(prev => [...prev, msg]);
    });

    socket.on("receiveGroupMessage", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on("typing", () => {
      setTypingUser("typing...");
      setTimeout(() => setTypingUser(""), 1000);
    });

    socket.on("newNotification", (notif) => {
      setNotifications(prev => [notif, ...prev]);
    });

    // CALL
    socket.on("incomingCall", ({ from, signal }) => {
      setCall({ from });
      setCallerSignal(signal);
    });

    socket.on("callAccepted", ({ signal }) => {
      setCallAccepted(true);
      peerRef.current.signal(signal);
    });

    return () => socket.off();
  }, [myId]);

  // -----------------------
  // CHAT OPEN
  // -----------------------
  const openChat = (id) => {
    setCurrentChat(id);
    setIsGroup(false);

    socket.emit("joinRoom", {
      senderId: myId,
      receiverId: id
    });

    setMessages([]);
  };

  const openGroup = (group) => {
    setCurrentChat(group._id);
    setIsGroup(true);
    setMessages([]);
  };

  // -----------------------
  // SEND MESSAGE
  // -----------------------
  const sendMessage = () => {
    if (!currentChat) return;

    const msg = {
      senderId: myId,
      receiverId: currentChat,
      text
    };

    if (isGroup) {
      socket.emit("sendGroupMessage", {
        groupId: currentChat,
        senderId: myId,
        text
      });
    } else {
      socket.emit("sendMessage", msg);
    }

    setMessages(prev => [...prev, msg]);
    setText("");
  };

  // -----------------------
  // VIDEO
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
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream
    });

    peer.on("signal", (signal) => {
      socket.emit("callUser", {
        from: myId,
        to: currentChat,
        signal
      });
    });

    peer.on("stream", (remoteStream) => {
      userVideo.current.srcObject = remoteStream;
    });

    peerRef.current = peer;
  };

  const acceptCall = () => {
    setCallAccepted(true);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream
    });

    peer.on("signal", (signal) => {
      socket.emit("answerCall", {
        to: call.from,
        signal
      });
    });

    peer.on("stream", (remoteStream) => {
      userVideo.current.srcObject = remoteStream;
    });

    peer.signal(callerSignal);
    peerRef.current = peer;
  };

  const endCall = () => {
    setCallEnded(true);
    setCall(null);
    setCallAccepted(false);

    if (peerRef.current) peerRef.current.destroy();

    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
  };

  // -----------------------
  // UI
  // -----------------------
  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* LEFT PANEL */}
      <div style={{ width: "30%", borderRight: "1px solid gray", padding: "10px" }}>

        <h3>🔔 Notifications ({notifications.length})</h3>

        {notifications.map((n, i) => (
          <div key={i}>{n.text}</div>
        ))}

        <h3>📖 Stories</h3>

        <div style={{ display: "flex", overflowX: "auto" }}>
          {stories.map((s, i) => (
            <img
              key={i}
              src={s.media}
              alt=""
              width="60"
              height="60"
              style={{ borderRadius: "50%", margin: "5px" }}
            />
          ))}
        </div>

        <h3>Friends</h3>
        {friends.map(f => (
          <div key={f._id} onClick={() => openChat(f._id)}>
            {onlineUsers.includes(f._id) ? "🟢" : "⚪"} {f.name}
          </div>
        ))}

        <h3>Groups</h3>
        {groups.map(g => (
          <div key={g._id} onClick={() => openGroup(g)}>
            👥 {g.name}
          </div>
        ))}

      </div>

      {/* RIGHT CHAT */}
      <div style={{ width: "70%", padding: "10px" }}>
        <h3>Chat</h3>

        <div style={{ height: "60%", overflowY: "scroll" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ textAlign: m.senderId === myId ? "right" : "left" }}>
              {m.text}
            </div>
          ))}
        </div>

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

        <button onClick={sendMessage}>Send</button>

        <div>
          <button onClick={startVideo}>🎥 Start</button>
          <button onClick={callUser}>📞 Call</button>
        </div>

        <video ref={myVideo} autoPlay muted width="120" />
        <video ref={userVideo} autoPlay width="120" />

        {typingUser && <p>{typingUser}</p>}
      </div>

      {/* CALL UI */}
      {call && !callAccepted && (
        <div style={{ position: "fixed", top: 20, right: 20, background: "#fff", padding: 10 }}>
          <p>📞 Incoming Call</p>
          <button onClick={acceptCall}>Accept</button>
          <button onClick={() => setCall(null)}>Reject</button>
        </div>
      )}

      {callAccepted && !callEnded && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "black",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <video ref={userVideo} autoPlay style={{ width: "80%" }} />

          <video
            ref={myVideo}
            autoPlay
            muted
            style={{ position: "absolute", bottom: 100, right: 20, width: 120 }}
          />

          <button onClick={endCall} style={{ position: "absolute", bottom: 20 }}>
            ❌ End Call
          </button>
        </div>
      )}

    </div>
  );
}

export default Messenger;
