/// **** index.js for DKYC-Lambda (Single Lambda Version) *** ///


const { ethers } = require("ethers");
const abi = require("./abi.json");

// ---------------------
// Blockchain Setup
// ---------------------
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

// Helper response with CORS
function res(code, body) {
  return {
    statusCode: code,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  try {
    const { httpMethod, path } = event;

    // ---------------------------
    // SUBMIT KYC  (POST)
    // ---------------------------
    if (path.endsWith("/submit-dkyc") && httpMethod === "POST") {
      const body = JSON.parse(event.body);
      const { name, dob, homeAddress, documentHash } = body;

      if (!name || !dob || !homeAddress || !documentHash)
        return res(400, { error: "Missing required fields" });

      const tx = await contract.submitKYC(
        name,
        dob,
        homeAddress,
        ethers.getBytes(documentHash),
        { value: ethers.parseEther("0.01") }
      );

      const r = await tx.wait();
      return res(200, { message: "KYC submitted", tx: r.hash });
    }

    // ---------------------------
    // UPDATE KYC  (PUT)
    // ---------------------------
    if (path.endsWith("/update-dkyc") && httpMethod === "PUT") {
      const body = JSON.parse(event.body);
      const { name, dob, homeAddress, documentHash } = body;

      const tx = await contract.updateKYC(
        name,
        dob,
        homeAddress,
        ethers.getBytes(documentHash),
        { value: ethers.parseEther("0.01") }
      );

      const r = await tx.wait();
      return res(200, { message: "KYC updated", tx: r.hash });
    }

    // ---------------------------
    // GET KYC  (GET)
    // ---------------------------
    if (path.endsWith("/get-dkyc") && httpMethod === "GET") {
      const q = event.queryStringParameters || {};
      const customer = q.address || q.customer;

      if (!customer) return res(400, { error: "Missing ?address=" });

      const r = await contract.getKYCInfo(customer);

      return res(200, {
        name: r.name,
        dob: r.dob,
        homeAddress: r.homeAddress,
        documentHash: r.documentHash,
        isVerified: r.isVerified,
      });
    }

    return res(404, { error: "Invalid route" });
  } catch (e) {
    console.error("ERR:", e);
    return res(500, { error: e.message });
  }
};
