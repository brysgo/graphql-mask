var validation = require("graphql/validation"),
  specifiedRules = validation.specifiedRules;

module.exports = [].concat.apply(
  [require("./NoEmptySelections"), require("./UnsupportedOperation")],
  specifiedRules
);
