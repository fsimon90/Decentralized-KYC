import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function BankerView() {
  const [customerAddress, setCustomerAddress] = useState("");
  const [status, setStatus] = useState("");
  const [kyc, setKyc] = useState(null);

  const fetchKYC = async () => {
    if (!customerAddress.startsWith("0x") || customerAddress.length !== 42) {
      alert("Enter valid customer Ethereum wallet address");
      return;
    }

    try {
      setStatus("⏳ Fetching KYC...");
      const res = await fetch(`${API_BASE}/get-dkyc?address=${customerAddress}`);
      const data = await res.json();

      if (!res.ok) {
        setStatus(`❌ Error: ${data.error}`);
        return;
      }

      setKyc(data);
      setStatus("✅ KYC retrieved!");

    } catch (err) {
      setStatus("❌ Failed: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto" }}>
      <h2>🏦 Banker View</h2>

      <input
        type="text"
        placeholder="Customer Wallet Address (0x...)"
        value={customerAddress}
        onChange={(e) => setCustomerAddress(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <button onClick={fetchKYC}>🔍 Fetch KYC</button>

      <pre style={{ marginTop: 20, padding: 10, background: "#f6f8fa" }}>
        {status}
      </pre>

      {kyc && (
        <div style={{ marginTop: 20, padding: 15, background: "#e8f5e9" }}>
          <h3>KYC Details</h3>
          <p><strong>Name:</strong> {kyc.name}</p>
          <p><strong>DOB:</strong> {kyc.dob}</p>
          <p><strong>Address:</strong> {kyc.homeAddress}</p>
          <p><strong>Hash:</strong> {kyc.documentHash}</p>
          <p><strong>Verified:</strong> {kyc.verified ? "✔️ Yes" : "❌ No"}</p>
        </div>
      )}
    </div>
  );
}
