const submitKyc = require("./submitdkycHandler");
const updateKyc = require("./updatedkycHandler");
const getKyc = require("./getdkycHandler");
const uploadUrl = require("./upload-url");
const downloadUrl = require("./download-url");
const { corsHeaders } = require("./cors");

exports.handler = async (event) => {
  console.log("Incoming event:", JSON.stringify(event));

  const method = event.requestContext?.http?.method || event.httpMethod;
  const rawPath = event.rawPath || event.path || "";
  const routeKey = `${method} ${rawPath}`;

  // Global CORS preflight handler
  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: ""
    };
  }

  try {
    switch (routeKey) {
      case "POST /submit-dkyc":
        return await submitKyc.handler(event);

      case "POST /update-dkyc":
        return await updateKyc.handler(event);

      case "GET /get-dkyc":
        return await getKyc.handler(event);

      case "POST /upload-url":
      case "POST /get-upload-url": // legacy
        return await uploadUrl.handler(event);

      case "POST /download-url":
        return await downloadUrl.handler(event);

      default:
        console.warn("Unknown route:", routeKey);
        return {
          statusCode: 404,
          headers: corsHeaders(),
          body: JSON.stringify({ error: `Route not found: ${routeKey}` })
        };
    }
  } catch (err) {
    console.error("Top-level error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: err.message || "Internal server error" })
    };
  }
};
