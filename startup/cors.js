const cors = require("cors");

const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200
};

module.exports = function(app) {
  app.use(cors(corsOptions));
};
