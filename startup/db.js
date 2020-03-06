const mongoose = require("mongoose");
const config = require("config");

const DB_URI = config.get("DB_URI");

module.exports = function() {
  mongoose
    .connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    })
    .then(() => console.log(`Connected to DB: ${DB_URI}`))
    .catch(error => {
      console.log(`Failed to connect do DB: ${DB_URI}`);
    });
};
