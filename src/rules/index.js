var validation = require("graphql/validation"),
  specifiedRules = validation.specifiedRules;

module.exports = [].concat.apply(
  [
    require("./UnsupportedOperation"),
    require("./NoUnknownInputTypes")
  ],
  specifiedRules
);
