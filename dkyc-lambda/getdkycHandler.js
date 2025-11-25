// getdkycHandler.js
const { ethers } = require("ethers");
const abi = require("./abi.json");

let provider, wallet, contract;

function init() {
  if (contract) return;

  const RPC_URL = process.env.RPC_URL;
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  let PRIVATE_KEY = process.env.PRIVATE_KEY;

  if (!RPC_URL) throw new Error("Missing RPC_URL");
  if (!CONTRACT_ADDRESS) throw new Error("Missing CONTRACT_ADDRESS");
  if (!PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY");

  if (!PRIVATE_KEY.startsWith("0x")) PRIVATE_KEY = "0x" + PRIVATE_KEY;

  provider = new ethers.JsonRpcProvider(RPC_URL);
  wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

exports.handler = async (event) => {
  try {
    init();

    const method =
      event.requestContext?.http?.method || event.httpMethod || "GET";

    if (method === "OPTIONS") {
      return { statusCode: 200, headers: corsHeaders(), body: "" };
    }

    let qs =
      event.queryStringParameters ||
      (event.rawQueryString
        ? Object.fromEntries(new URLSearchParams(event.rawQueryString))
        : {});

    const customer = qs.address || qs.customer;

    if (!customer) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "Missing query param ?address=0x..." })
      };
    }

    if (!ethers.isAddress(customer)) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "Invalid address" })
      };
    }

    const info = await contract.getKYCInfo(customer);

    const result = {
      name: info[0],
      dob: info[1],
      homeAddress: info[2],
      documentHash: info[3],
      isVerified: info[4],
      customer
    };

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(result)
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
