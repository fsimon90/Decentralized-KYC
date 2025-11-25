// src/CustomerPage.jsx
import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function CustomerPage() {
  const [wallet, setWallet] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [homeAddress, setHomeAddress] = useState("");

  const [mode, setMode] = useState("new"); // new or update
  const [status, setStatus] = useState("");

  const handleSubmit = async () => {
    if (!wallet || !name || !dob || !homeAddress) {
      setStatus("❌ Please fill all required fields.");
      return;
    }

    setStatus("⏳ Sending request…");

    const url =
      mode === "new"
        ? `${API_BASE}/submit-dkyc`
        : `${API_BASE}/update-dkyc`;

    const method = mode === "new" ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: wallet,
          name,
          dob,
          homeAddress,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(`❌ Error: ${data.error || "Unknown error"}`);
        return;
      }

      setStatus(
        `✅ Success!\nTX Hash: ${data.txHash}\nMessage: ${data.message}`
      );
    } catch (err) {
      setStatus("❌ Unexpected error: " + err.message);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>
         Customer KYC Submission / Update
      </h2>

      <div style={{ marginTop: "20px" }}>
        <label>
          <input
            type="radio"
            checked={mode === "new"}
            onChange={() => setMode("new")}
          />
          New KYC Submission
        </label>

        <label style={{ marginLeft: "20px" }}>
          <input
            type="radio"
            checked={mode === "update"}
            onChange={() => setMode("update")}
          />
          Update Existing KYC
        </label>
      </div>

      <div
        style={{
          width: "50%",
          margin: "0 auto",
          marginTop: "20px",
          textAlign: "left",
        }}
      >
        <input
          className="form-control"
          placeholder="Wallet Address"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <input
          className="form-control"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <input
          className="form-control"
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <input
          className="form-control"
          placeholder="Home Address"
          value={homeAddress}
          onChange={(e) => setHomeAddress(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>

      <button
        onClick={handleSubmit}
        style={{
          marginTop: "20px",
          backgroundColor: "#698cffff",
          border: "none",
          padding: "8px 20px",
          color: "white",
          borderRadius: "5px",
        }}
      >
         Submit KYC
      </button>

      {status && (
        <pre
          style={{
            marginTop: "30px",
            width: "60%",
            marginLeft: "auto",
            marginRight: "auto",
            background: "#f8f9fa",
            padding: "15px",
            borderRadius: "8px",
            textAlign: "left",
            border: "1px solid #ddd",
            whiteSpace: "pre-wrap",
          }}
        >
          {status}
        </pre>
      )}
    </div>
  );
}
