const config = require("config");

module.exports = function() {
  if (!config.get("jwtPrivateKey")) {
    throw new Error("FATAL ERROR: jwtPrivateKey is not defined!");
  }

  if (config.get("jwtPrivateKey") === "development") {
    console.log("WARNING: jwtPrivateKey is set to default value");
  }
};
