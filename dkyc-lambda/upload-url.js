// upload-url.js
// Lambda for POST /upload-url
// Generates a pre-signed PUT URL for S3 and returns { uploadURL, key }

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
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
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT"
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

    const body = event.body ? JSON.parse(event.body) : {};
    const filename = body.filename || "document";
    const contentType = body.contentType || "application/octet-stream";

    const key = `uploads/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType
    });

    // URL valid for 10 minutes
    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 600 });

    return response(200, {
      uploadURL,
      key
    });
  } catch (err) {
    console.error("upload-url error:", err);
    return response(500, { error: err.message || "Failed to generate upload URL" });
  }
};
