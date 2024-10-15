import React, { useEffect, useState } from "react";
import { api } from "../api";
import { v4 as uuidv4} from 'uuid';

const Users: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    id: uuidv4(),
    fullname: '',
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  const forceLogout = async (id: number) => {
    try {
      const token: any = localStorage.getItem("access_token");

      await api.post("/auth/force-logout", {
        userId: id
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchUsers();
    } catch (error) {
      console.error("Error force logout:", error);
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await api.get("http://localhost:3001/auth/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
      setTimeout(fetchUsers, 500);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access_token");
      await api.post("/auth/users", newUser, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNewUser({
        id: uuidv4(),
        fullname: '',
        username: '',
        email: '',
        password: '',
        role: 'user'
      });
      
      fetchUsers(); 
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const configLougout = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token");
      await api.put(`/auth/user/config/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });
      fetchUsers();
    } catch (error) {
      console.log("Error configs");
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container">
      <h1 className="text-center font-monospace">List Users</h1>
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Full name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: any, index: number) => (
            <tr key={user.id}>
              <td>{index + 1}</td>
              <td>{user.fullname}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <button className="btn btn-outline-danger" onClick={() => forceLogout(user.id)}>Force Logout</button>
                <button className="ms-2 btn btn-outline-warning" onClick={() => configLougout(user.id)}>Config</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-5">Add New User</h2>
      <form onSubmit={addUser}>
        <div className="mb-3">
          <label htmlFor="fullname" className="form-label">Full Name</label>
          <input
            type="text"
            className="form-control"
            id="fullname"
            value={newUser.fullname}
            onChange={(e) => setNewUser({ ...newUser, fullname: e.target.value })}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            id="username"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            id="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            id="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="role" className="form-label">Role</label>
          <select
            className="form-select"
            id="role"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            required
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">Add User</button>
      </form>
    </div>
  );
};

export default Users;
