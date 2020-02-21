const express = require("express");
const router = express.Router();

const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

// https://swagger.io/specification/#infoObject

//Build swaggerOptions for JsDoc
//https://github.com/Surnet/swagger-jsdoc/blob/HEAD/docs/GETTING-STARTED.md
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Loan-app API",
      version: "1.0.0",
      servers: ["http://localhost:3900/api"]
    },
    basePath: "/api"
  },
  apis: ["routes/*.js"]
};

//Initialize swagger-jsdoc -> returns validated swagger spec in json format
const swaggerSpec = swaggerJsDoc(swaggerOptions);

router.use("/", swaggerUI.serve);
router.get("/", swaggerUI.setup(swaggerSpec));

router.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

module.exports = router;
