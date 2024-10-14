import React, { useEffect, useState } from "react";
import { api } from "../api";
import { jwtDecode } from "jwt-decode";

const MyProfile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/auth/profile", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setProfile(response.data);
      setFullname(response.data.fullname);
      setEmail(response.data.email);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const edit = () => {
    setEditing(true);
  };

  const update = async () => {
    const formData = new FormData();
    formData.append("fullname", fullname);
    formData.append("email", email);

    if (avatar) {
      formData.append("avatar", avatar); 
    }

    try {
      const token: any = localStorage.getItem("access_token");
      const decoded: any = jwtDecode(token);
      await api.put(`/auth/users/${decoded.userId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setEditing(false);
      fetchProfile(); 
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div>
      <h1 className="text-center font-monospace">My Profile</h1>
      {profile ? (
        <div className="container">
          <div className="row">
            <div className="col-4">
              <img src={profile.avatar} alt="avatar" width={'100%'} height={'100%'} />
            </div>
            <div className="col-8">
              <form className="justify-content-center">
                <div className="form-group">
                  <label htmlFor="fullname" className="form-label">FullName:</label>
                  <input
                    id="fullname"
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="form-control"
                    readOnly={!editing}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email:</label>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                    readOnly={!editing}
                  />
                </div>
                {editing && (
                  <div className="form-group">
                    <label htmlFor="avatar" className="form-label">Avatar:</label>
                    <input
                      id="avatar"
                      type="file"
                      className="form-control"
                      onChange={(e) => setAvatar(e.target.files ? e.target.files[0] : null)}
                    />
                  </div>
                )}
              </form>
              <button className="mt-2 btn btn-warning" onClick={edit}>Edit</button>
              {editing && (
                <button className="ms-2 mt-2 btn btn-success" onClick={update}>Update</button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
};

export default MyProfile;
