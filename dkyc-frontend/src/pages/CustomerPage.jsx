import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function CustomerPage() {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [status, setStatus] = useState("");

  const submitKYC = async () => {
    if (!name || !dob || !homeAddress) {
      alert("Fill all fields");
      return;
    }

    try {
      setStatus("⏳ Submitting KYC...");

      const res = await fetch(`${API_BASE}/submit-dkyc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dob, homeAddress }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus(`✅ Success! TxHash: ${data.txHash}`);
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setStatus("❌ Failed: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", textAlign: "center" }}>
      <h2>👤 Customer KYC Submission</h2>

      <input type="text" placeholder="Full Name" value={name}
        onChange={(e) => setName(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />

      <input type="date" value={dob}
        onChange={(e) => setDob(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />

      <input type="text" placeholder="Home Address" value={homeAddress}
        onChange={(e) => setHomeAddress(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />

      <button onClick={submitKYC} style={{ marginTop: 15 }}>
        🚀 Submit KYC
      </button>

      <pre style={{ background: "#f6f8fa", padding: 12, marginTop: 20 }}>
        {status}
      </pre>
    </div>
  );
}
