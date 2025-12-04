// download-url.js
// Lambda for POST /download-url
// Generates a pre-signed GET URL for S3 and returns { downloadURL }

const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const BUCKET = process.env.KYC_BUCKET;

const s3 = new S3Client({ region: REGION });

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
    if (!BUCKET) {
      return response(500, { error: "KYC_BUCKET env var is not set." });
    }

    if (!event.body) {
      return response(400, { error: "Missing request body" });
    }

    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const key = body.key || body.fileKey;

    if (!key) {
      return response(400, { error: "Missing 'key' (S3 object key) in body." });
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key
    });

    // URL valid for 10 minutes
    const downloadURL = await getSignedUrl(s3, command, { expiresIn: 600 });

    return response(200, { downloadURL, key });
  } catch (err) {
    console.error("download-url error:", err);
    return response(500, { error: err.message || "Failed to generate download URL" });
  }
};
