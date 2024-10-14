import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../assets/css/login.css";

interface LoginProps {
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}

const Login: React.FC<LoginProps> = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:3001/auth/login", {
        username,
        password,
      });
      localStorage.setItem("access_token", response.data.access_token);
      setIsAuthenticated(true);
      navigate("/my-profile");
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  return (
    <div className="container p-5">
        <div className="card">
          <p className="login">Log in</p>
          <div className="inputBox">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <span className="user">Username</span>
          </div>

          <div className="inputBox">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span>Password</span>
          </div>

          <button onClick={handleLogin} className="enter">Login</button>
        </div>
      </div>
  );
};

export default Login;
