function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
        "Access-Control-Allow-Headers": "*"
    };
}

exports.corsHeaders = corsHeaders;

exports.handler = async () => {
    return {
        statusCode: 200,
        headers: corsHeaders(),
        body: ""
    };
};

