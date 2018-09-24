// @flow
var graphqlLanguage = require("graphql/language"),
  parse = graphqlLanguage.parse,
  visit = graphqlLanguage.visit,
  print = graphqlLanguage.print;

var graphqlType = require("graphql/type"),
  GraphQLList = graphqlType.GraphQLList,
  GraphQLNonNull = graphqlType.GraphQLNonNull,
  isLeafType = graphqlType.isLeafType,
  getNamedType = graphqlType.getNamedType;

var graphqlUtilities = require("graphql/utilities"),
  TypeInfo = graphqlUtilities.TypeInfo,
  buildASTSchema = graphqlUtilities.buildASTSchema,
  typeFromAST = graphqlUtilities.typeFromAST;

var graphqlValidation = require("graphql/validation"),
  validate = graphqlValidation.validate;

var graphqlExecutionValues = require("graphql/execution/values"),
  getVariableValues = graphqlExecutionValues.getVariableValues;

var rules = require("./rules");

function isBlank(str) {
  return !str || /^\s*$/.test(str);
}

function resolveType(type) {
  if (!type) {
    return type;
  }
  var innerType = type;
  while (
    innerType instanceof GraphQLNonNull ||
    innerType instanceof GraphQLList
  ) {
    innerType = innerType.ofType;
  }
  return innerType;
}

module.exports = function graphqlMask(schema, query, variables) {
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
  var query = print(incrementalAst);
  query = isBlank(query) ? null : query;
  if (!variables) {
    return query;
  }

  var operation = incrementalAst.definitions.find(function(d) {
    return d.kind === "OperationDefinition";
  });

  var filteredVariables = {};
  var variableDefinitions = operation.variableDefinitions;
  var varDefNode = variableDefinitions[0];
  var varName = varDefNode.variable.name.value;
  var varType = resolveType(typeFromAST(astSchema, varDefNode.type));
  var varValue = variables[varName];
  var varFields = varType.getFields();
  // Ensure every provided field is defined.
  for (var fieldName in varValue) {
    if (Object.prototype.hasOwnProperty.call(varValue, fieldName)) {
      if (!varFields[fieldName]) {
        delete varValue[fieldName];
      }
    }
  }
  filteredVariables[varName] = varValue;
  return { query: query, variables: filteredVariables };
};
