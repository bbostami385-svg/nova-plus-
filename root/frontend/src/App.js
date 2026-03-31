import React, { useState } from "react";
import Splash from "./Splash";
import Login from "./Login";
import Signup from "./Signup";
import Feed from "./Feed";
import Chat from "./Chat";

// 👉 NEW IMPORTS
import Messenger from "./pages/Messenger";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";

function App() {
  const [page, setPage] = useState("splash");

  const renderPage = () => {
    switch (page) {
      case "login":
        return <Login goToSignup={() => setPage("signup")} goToFeed={() => setPage("feed")} />;

      case "signup":
        return <Signup goToLogin={() => setPage("login")} />;

      case "feed":
        return (
          <>
            <Feed />
            <Chat />

            {/* 🔥 NAV BUTTONS */}
            <div style={{ marginTop: "20px" }}>
              <button onClick={() => setPage("messenger")}>Messenger 💬</button>
              <button onClick={() => setPage("profile")}>Profile 🔥</button>
              <button onClick={() => setPage("friends")}>Friends 👥</button>
            </div>
          </>
        );

      // 👉 NEW PAGES
      case "messenger":
        return <Messenger />;

      case "profile":
        return <Profile />;

      case "friends":
        return <Friends />;

      default:
        return <Splash goToLogin={() => setPage("login")} />;
    }
  };

  return <div>{renderPage()}</div>;
}

export default App;
