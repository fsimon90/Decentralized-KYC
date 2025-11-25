// updatedkycHandler.js  (CommonJS version)

const { ethers } = require("ethers");
const abi = require("./abi.json");

exports.handler = async (event) => {
  console.log("Incoming event:", event);

  try {
    // ---------- Parse body ----------
    const body = JSON.parse(event.body || "{}");
    const { customer, name, dob, homeAddress } = body;

    if (!customer || !name || !dob || !homeAddress) {
      return {
        statusCode: 400,
        headers: cors(),
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // ---------- Connect to Ethereum ----------
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      abi,
      wallet
    );

    // ---------- Update KYC (pay the fee) ----------
    const tx = await contract.updateKYC(
      customer,
      name,
      dob,
      homeAddress,
      { value: ethers.parseEther("0.01") } // send fee
    );

    console.log("TX sent:", tx.hash);
    await tx.wait();

    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify({
        message: "KYC updated successfully",
        txHash: tx.hash,
      }),
    };
  } catch (err) {
    console.error("updateKYC error:", err);

    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({ error: err.message }),
    };
  }
};

// ---------- CORS Helper ----------
function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
