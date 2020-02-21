const express = require("express");
const router = express.Router();

/**
 * @swagger
 * /products:
 *  get:
 *      description: Use to request all products
 *      responses:
 *          '200':
 *              description: A successful response
 */
router.get("/", (req, res) => {
  res.send("Product results");
});

module.exports = router;
