import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

const UserProfile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <img
        src={user.picture}
        alt={user.name}
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          marginRight: "0.5rem",
          border: "2px solid #3d70b2" // Carbon blue border for style
        }}
      />
      <div>
        <div style={{ fontWeight: "bold" }}>{user.name}</div>
        <div style={{ fontSize: "0.85em", color: "#666" }}>{user.email}</div>
      </div>
    </div>
  );
};

export default UserProfile; 