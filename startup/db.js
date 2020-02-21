const mongoose = require("mongoose");
const config = require("config");

const DB_URI = config.get("DB_URI");

module.exports = function() {
  mongoose
    .connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(console.log(`Connected to DB: ${DB_URI}`));
};
