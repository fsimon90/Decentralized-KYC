// getdkycHandler.js
// Lambda for GET /get-dkyc?customer=0x...

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
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
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
    const qs = event.queryStringParameters || {};
    const customer = qs.customer || qs.address;

    if (!customer) {
      return response(400, { error: "Missing 'customer' query parameter." });
    }

    const kyc = await contract.getKYCInfo(customer);

    // ethers v6 returns both array and named fields
    const result = {
      name: kyc.name,
      dob: kyc.dob,
      homeAddress: kyc.homeAddress,
      documentHash: kyc.documentHash,
      fileKey: kyc.fileKey,
      isVerified: kyc.isVerified
    };

    return response(200, {
      customer,
      kyc: result
    });
  } catch (err) {
    console.error("get-dkyc error:", err);
    return response(500, { error: err.reason || err.message || "Get KYC failed" });
  }
};
