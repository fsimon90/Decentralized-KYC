const { ethers } = require("ethers");
const abi = require("./abi.json");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "OPTIONS,POST"
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod;
  if (method === "OPTIONS") {
    return response(200, { ok: true });
  }

  try {
    if (!event.body) {
      return response(400, { error: "Missing request body" });
    }

    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const tx = await contract.updateKYC(
      body.customer,
      body.name,
      body.dob,
      body.homeAddress,
      body.documentHash,
      body.fileKey,
      { value: ethers.parseEther("0.01") }
    );

    await tx.wait();
    return response(200, { message: "KYC updated" });
  } catch (err) {
    console.error("update-dkyc error:", err);
    const message =
      err?.reason ||
      err?.shortMessage ||
      err?.error?.message ||
      err?.message ||
      "Update KYC failed";
    const status = message.toLowerCase().includes("revert") ? 400 : 500;
    return response(status, { error: message });
  }
};
