// src/BankerView.jsx
import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function BankerView() {
  const [customer, setCustomer] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");

  const fetchKYC = async () => {
    if (!customer) {
      setStatus("❌ Enter a customer wallet address.");
      return;
    }

    try {
      setStatus("⏳ Fetching KYC from blockchain...");
      setResult(null);

      const res = await fetch(`${API_BASE}/get-dkyc?address=${customer}`);
      const data = await res.json();

      if (!res.ok) {
        setStatus(`❌ Error: ${data.error || "Unknown error"}`);
        return;
      }

      setResult(data);
      setStatus("✅ KYC record retrieved.");
    } catch (err) {
      setStatus("❌ Failed: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", textAlign: "center" }}>
      <h2>🏦 Banker / Validator View</h2>

      <input
        type="text"
        placeholder="Customer wallet address (0x...)"
        value={customer}
        onChange={(e) => setCustomer(e.target.value.trim())}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <button onClick={fetchKYC}>🔍 Fetch KYC</button>

      <pre
        style={{
          background: "#f6f8fa",
          marginTop: 16,
          padding: 12,
          textAlign: "left",
          whiteSpace: "pre-wrap"
        }}
      >
        {status}
      </pre>

      {result && (
        <div
          style={{
            marginTop: 16,
            textAlign: "left",
            background: "#fff",
            border: "1px solid #ddd",
            padding: 12
          }}
        >
          <p>
            <strong>Customer:</strong> {result.customer}
          </p>
          <p>
            <strong>Name:</strong> {result.name}
          </p>
          <p>
            <strong>DOB:</strong> {result.dob}
          </p>
          <p>
            <strong>Address:</strong> {result.homeAddress}
          </p>
          <p>
            <strong>Document Hash:</strong> {result.documentHash}
          </p>
          <p>
            <strong>Verified:</strong> {result.isVerified ? "✅ Yes" : "❌ No"}
          </p>
        </div>
      )}
    </div>
  );
}
