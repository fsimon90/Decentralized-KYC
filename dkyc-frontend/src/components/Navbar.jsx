import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const activeStyle = {
    color: "#6a0dad",
    fontWeight: "bold",
    borderBottom: "2px solid #6a0dad",
  };

  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 25px",
      background: "#f8f8ff",
      borderBottom: "1px solid #ddd",
      marginBottom: "20px"
    }}>
      
      <h2 style={{ color: "#6a0dad", margin: 0 }}>
        🔐 DKYC System
      </h2>

      <div style={{ display: "flex", gap: "25px" }}>
        <Link
          to="/customer"
          style={location.pathname === "/customer" ? activeStyle : {}}
        >
          Customer KYC
        </Link>

        <Link
          to="/bank"
          style={location.pathname === "/bank" ? activeStyle : {}}
        >
          Banker View
        </Link>
      </div>
    </nav>
  );
}
