import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "carbon-components-react";

const LogoutButton = () => {
  const { logout } = useAuth0();
  return (
    <Button
      kind="secondary"
      size="small"
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      style={{ marginLeft: "1rem" }}
    >
      Log Out
    </Button>
  );
};

export default LogoutButton; 