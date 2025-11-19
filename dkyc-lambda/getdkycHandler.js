const { ethers } = require("ethers");
const abi = require("./abi.json");

let provider, contract;

function init() {
  if (contract) return;

  const RPC_URL = process.env.RPC_URL;
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

  if (!RPC_URL) throw new Error("Missing RPC_URL");
  if (!CONTRACT_ADDRESS) throw new Error("Missing CONTRACT_ADDRESS");

  provider = new ethers.JsonRpcProvider(RPC_URL);
  contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
}

exports.handler = async (event) => {
  try {
    init();

    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers: corsHeaders(), body: "" };
    }

    const qs = event.queryStringParameters || {};
    const customerIdHex = qs.customerId;

    if (!customerIdHex) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "Missing ?customerId=" })
      };
    }

    const r = await contract.getKYC(customerIdHex);

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        name: r[0],
        dob: r[1],
        homeAddress: r[2],
        documentHash: r[3],
        isVerified: r[4],
        exists: r[5],
        customerId: customerIdHex
      })
    };
  } catch (err) {
    console.error("getdkyc error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: err.reason || err.message })
    };
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
