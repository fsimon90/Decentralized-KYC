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
  wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
}

exports.handler = async (event) => {
  try {
    init();

    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers: corsHeaders(), body: "" };
    }

    const body = JSON.parse(event.body || "{}");
    const { customerIdHex, name, dob, homeAddress, documentHashHex } = body;

    if (!customerIdHex || !name || !dob || !homeAddress || !documentHashHex) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }

    const fee = await contract.verificationFee();

    const tx = await contract.submitKYC(
      customerIdHex,
      name,
      dob,
      homeAddress,
      documentHashHex,
      { value: fee }
    );

    const receipt = await tx.wait();

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        message: "KYC submitted successfully",
        txHash: receipt.hash
      })
    };
  } catch (err) {
    console.error("submitdkyc error:", err);
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
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
