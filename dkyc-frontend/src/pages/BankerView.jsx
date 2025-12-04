import React, { useState } from "react";

const API_BASE = "https://34nc2jng06.execute-api.us-east-1.amazonaws.com/prod";

// Normalize truthy flags coming back from the API/chain
function toBool(value) {
  if (typeof value === "string") {
    return ["true", "1", "yes", "verified"].includes(value.trim().toLowerCase());
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return !!value;
}

// Try a few possible fields and finally fall back to “has data” to mark verified
function deriveVerifiedFlag(kyc) {
  if (!kyc) return false;
  const candidates = [
    kyc.isVerified,
    kyc.verified,
    kyc.isverified,
    kyc.status,
    kyc.kycStatus,
  ];
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null) {
      return toBool(candidate);
    }
  }
  // If there is a non-zero document hash, treat it as completed/verified
  if (typeof kyc.documentHash === "string") {
    const trimmed = kyc.documentHash.trim();
    if (trimmed && !/^0x0+$/i.test(trimmed)) {
      return true;
    }
  }
  return false;
}

function BankerPage() {
  const [customer, setCustomer] = useState("");
  const [kycData, setKycData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch KYC from blockchain via get-dkyc Lambda
  async function fetchKYC() {
    setMessage("");
    setKycData(null);

    const lookup = customer.trim();
    if (!lookup) {
      setMessage("Please enter a valid customer blockchain address.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/get-dkyc?customer=${encodeURIComponent(lookup)}`, {
        method: "GET",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch KYC data");
      }

      const merged = data.kyc ? { customer: data.customer, ...data.kyc } : data;
      setKycData(merged);
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Generate download URL for KYC document
  async function getDownloadURL(key) {
    try {
      const res = await fetch(`${API_BASE}/download-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate download URL");

      window.open(data.downloadURL, "_blank");
    } catch (err) {
      alert("Download Error: " + err.message);
    }
  }

  const verifiedFlag = deriveVerifiedFlag(kycData);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f7f7",
        padding: "32px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: "#1f2937",
        fontFamily: "Times New Roman, serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "820px", textAlign: "center" }}>
        <h2 style={{ marginBottom: "14px", fontSize: "26px" }}>
          Banker / Validator View
        </h2>

        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Enter Customer Blockchain Address"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "760px",
              margin: "0 auto",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "14px",
            }}
          />
        </div>

        <div style={{ marginBottom: "18px" }}>
          <button
            onClick={fetchKYC}
            style={{
              padding: "8px 20px",
              background: "#1e3a8a",
              color: "white",
              border: "1px solid #1e3a8a",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {loading ? "Fetching..." : "Fetch KYC"}
          </button>
        </div>

        {message && (
          <div
            style={{
              marginTop: "4px",
              padding: "10px 12px",
              maxWidth: "820px",
              marginLeft: "auto",
              marginRight: "auto",
              background: message.startsWith("Error") ? "#fff5f5" : "#eef7ff",
              color: message.startsWith("Error") ? "#b91c1c" : "#0f172a",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              textAlign: "left",
              fontFamily: "monospace",
              fontSize: "13px",
            }}
          >
            {message}
          </div>
        )}

        {kycData && (
          <div
            style={{
              marginTop: "18px",
              padding: "18px 20px",
              maxWidth: "820px",
              marginLeft: "auto",
              marginRight: "auto",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              textAlign: "left",
            }}
          >
            <div style={{ marginBottom: "6px" }}>
              <strong>Customer:</strong> {kycData.customer || customer}
            </div>
            <div style={{ marginBottom: "6px" }}>
              <strong>Name:</strong> {kycData.name}
            </div>
            <div style={{ marginBottom: "6px" }}>
              <strong>DOB:</strong> {kycData.dob}
            </div>
            <div style={{ marginBottom: "6px" }}>
              <strong>Address:</strong> {kycData.homeAddress}
            </div>
            <div style={{ marginBottom: "6px", wordBreak: "break-all" }}>
              <strong>Document Hash:</strong> {kycData.documentHash}
            </div>
            <div style={{ marginBottom: "6px" }}>
              <strong>Verified:</strong> {verifiedFlag ? "Yes" : "No"}
            </div>
            {kycData.fileKey && (
              <div style={{ marginTop: "10px" }}>
                <strong>File Key:</strong> {kycData.fileKey}
                <button
                  onClick={() => getDownloadURL(kycData.fileKey)}
                  style={{
                    marginLeft: "10px",
                    padding: "6px 10px",
                    background: "#0f9d58",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Download
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BankerPage;
