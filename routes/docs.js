const express = require("express");
const router = express.Router();

const swaggerUI = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("swagger.yaml");

router.use("/", swaggerUI.serve);
router.get("/", swaggerUI.setup(swaggerDocument));

router.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

module.exports = router;
