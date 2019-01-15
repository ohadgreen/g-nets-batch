if (process.env.NODE_ENV === "production") {
    // PROD
    module.exports = require("./prod");
  } else {
    // DEV
    module.exports = require("./dev");
  }