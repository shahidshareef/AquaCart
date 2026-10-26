
const dns = require("node:dns");

// Use Cloudflare DNS for Node.js DNS lookups.
dns.setServers(["1.1.1.1", "1.0.0.1"]);

console.log("AquaCart DNS workaround enabled.");
