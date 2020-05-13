const cors = require("cors");
const config = require("config");

const origin = config.get("corsOrigin");

const corsOptions = {
  origin,
  optionsSuccessStatus: 200,
};

module.exports = function (app) {
  app.use(cors(corsOptions));
};
