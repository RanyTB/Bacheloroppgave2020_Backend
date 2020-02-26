const express = require("express");
const app = express();

//DB
require("./startup/db")();
//Routes
require("./startup/routes")(app);

const port = process.env.PORT || 3900;

const server = app.listen(port, () => {
  console.log("App listening on port " + port);
});

module.exports = server; //Exported for integration testing
