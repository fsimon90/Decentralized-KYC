import React, { useState } from "react";

const API_BASE = "https://34nc2jng06.execute-api.us-east-1.amazonaws.com/prod";

// ---------- SHA-256 HASH (bytes32 format) ----------
async function computeFileHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return "0x" + hex; // MUST be 0x-prefixed bytes32
}

// ---------- Upload file to S3 ----------
async function getUploadURL(filename, contentType) {
  const res = await fetch(`${API_BASE}/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, contentType }),
  });

  if (!res.ok) throw new Error("Failed to get upload URL");
  return res.json(); // { uploadURL, key }
}

async function uploadFileToS3(uploadURL, file) {
  const res = await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!res.ok) throw new Error("Failed to upload file to S3");
}

// ---------- Submit new KYC ----------
async function submitNewKYC(body) {
  const res = await fetch(`${API_BASE}/submit-dkyc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Submit KYC failed");
  return data;
}

// ---------- Update existing KYC ----------
async function updateExistingKYC(body) {
  const res = await fetch(`${API_BASE}/update-dkyc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Update KYC failed");
  return data;
}

export default function CustomerPage() {
  const [customer, setCustomer] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [file, setFile] = useState(null);
  const [isUpdate, setIsUpdate] = useState(false);
  const [message, setMessage] = useState("");

  // ---------- Handle Submit ----------
  const handleSubmit = async () => {
    try {
      setMessage("");

      if (!customer || !name || !dob || !homeAddress) {
        throw new Error("All fields are required");
      }
      if (!file) throw new Error("Please select a file");

      // Step 1: Get presigned URL
      const filename = `${Date.now()}-${file.name}`;
      const { uploadURL, key: fileKey } = await getUploadURL(
        filename,
        file.type || "application/octet-stream"
      );

      // Step 2: Upload file to S3
      await uploadFileToS3(uploadURL, file);

      // Step 3: Compute SHA256 bytes32 hash
      const documentHash = await computeFileHash(file);

      // Step 4: Validate hash format
      if (!/^0x[0-9a-fA-F]{64}$/.test(documentHash)) {
        throw new Error("Invalid SHA-256 hash format");
      }

      // Step 5: Body payload for lambda
      const payload = {
        customer,
        name,
        dob,
        homeAddress,
        documentHash,
        fileKey,
      };

      let result;

      if (!isUpdate) {
        result = await submitNewKYC(payload);
      } else {
        result = await updateExistingKYC(payload);
      }

      setMessage(result.message || "Success!");

    } catch (err) {
      console.error(err);
      setMessage("Error: " + err.message);
    }
  };

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
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "820px", textAlign: "center" }}>
        <h2 style={{ marginBottom: "12px", fontSize: "26px" }}>
          Customer KYC Submission / Update
        </h2>

        <div style={{ marginBottom: "16px", fontSize: "15px" }}>
          <label style={{ marginRight: "20px" }}>
            <input
              type="radio"
              checked={!isUpdate}
              onChange={() => setIsUpdate(false)}
            />{" "}
            New KYC Submission
          </label>
          <label>
            <input
              type="radio"
              checked={isUpdate}
              onChange={() => setIsUpdate(true)}
            />{" "}
            Update Existing KYC
          </label>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type="text"
            placeholder="Customer Address"
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

          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "760px",
              margin: "0 auto",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          />

          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "760px",
              margin: "0 auto",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          />

          <input
            type="text"
            placeholder="Home Address"
            value={homeAddress}
            onChange={(e) => setHomeAddress(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "760px",
              margin: "0 auto",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          />

          <div
            style={{
              width: "100%",
              maxWidth: "760px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
            }}
          >
            <span style={{ whiteSpace: "nowrap" }}>Upload file:</span>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          </div>
        </div>

        <div style={{ marginTop: "18px" }}>
          <button
            onClick={handleSubmit}
            style={{
              padding: "10px 28px",
              background: "#1e3a8a",
              color: "#fff",
              fontSize: "15px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {isUpdate ? "Update KYC" : "Submit KYC"}
          </button>
        </div>

        {message && (
          <div
            style={{
              marginTop: "20px",
              padding: "14px 16px",
              maxWidth: "820px",
              marginLeft: "auto",
              marginRight: "auto",
              background: message.startsWith("Error") ? "#fff5f5" : "#f1fbf1",
              color: message.startsWith("Error") ? "#b91c1c" : "#166534",
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
      </div>
    </div>
  );
}
