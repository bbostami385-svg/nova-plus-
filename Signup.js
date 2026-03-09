import React, { useState } from "react";
import LoginLogo from "../assets/login_logo.png"; // same logo can be used

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = () => {
    console.log("Signup clicked", email, password);
    // TODO: Firebase Auth integration
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <img src={LoginLogo} alt="Signup Logo" style={{ width: "150px" }} />
      <h2>Signup</h2>
      <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleSignup}>Signup</button>
    </div>
  );
}

export default Signup;
