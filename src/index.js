// @flow

var graphqlLanguage = require("graphql/language"),
  parse = graphqlLanguage.parse,
  visit = graphqlLanguage.visit,
  visitWithTypeInfo = graphqlLanguage.visitWithTypeInfo,
  print = graphqlLanguage.print;

var graphqlType = require("graphql/type"),
  isLeafType = graphqlType.isLeafType,
  getNamedType = graphqlType.getNamedType;

var graphqlUtilities = require("graphql/utilities"),
  TypeInfo = graphqlUtilities.TypeInfo,
  buildASTSchema = graphqlUtilities.buildASTSchema;

var graphqlValidation = require("graphql/validation"),
  validate = graphqlValidation.validate;

var rules = require("./rules");

function isBlank(str) {
  return !str || /^\s*$/.test(str);
}
module.exports = function graphqlMask(schema, query) {
  var astSchema =
    typeof schema === "string" ? buildASTSchema(parse(schema)) : schema;
  var typeInfo = new TypeInfo(astSchema);
  var incrementalAst = parse(query);
  var errors;
  while ((errors = validate(astSchema, incrementalAst, rules)).length > 0) {
    var nodes = [].concat.apply(
      [],
      errors.map(function(e) {
        return e.nodes;
      })
    );
    incrementalAst = visit(incrementalAst, {
      enter: function(node, key, siblings, path, ancestors) {
        if (nodes.indexOf(node) !== -1) {
          return null;
        }
      },
      leave: function(node) {
        if (!node) return null;
        switch (node.kind) {
          case "FragmentDefinition":
            if (!node.typeCondition) {
              return null;
            }
          case "FragmentSpread":
            if (!node.name) {
              return null;
            }
            break;
        }
      }
    });
  }
  var result = print(incrementalAst);
  return isBlank(result) ? null : result;
};
