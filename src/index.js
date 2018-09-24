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

module.exports = function graphqlMask(argsOrSchema, deprecatedQuery) {
  var deprecatedUsage = deprecatedQuery && !argsOrSchema.schema;

  if (deprecatedUsage) {
    console.warn(
      "Use of positional arguments has been deprecated. Please use argument object with named properties."
    );
  }
  var schema = deprecatedUsage ? argsOrSchema : argsOrSchema.schema;
  var query = deprecatedUsage ? deprecatedQuery : argsOrSchema.query;
  var variables = argsOrSchema.variables;

  var result = mask(schema, query, variables);

  if (deprecatedUsage) {
    console.warn(
      "Return value of only masked query has been deprecated. Please migrate to use return object containing masked query and variables."
    );
    return result.maskedQuery;
  } else {
    return {
      maskedQuery: result.maskedQuery,
      maskedVariables: result.maskedVariables
    };
  }
};

function mask(schema, query, variables) {
  var astSchema =
    typeof schema === "string" ? buildASTSchema(parse(schema)) : schema;

  var maskedQuery = maskQuery(astSchema, query);
  var maskedVariables = maskVariables(astSchema, maskedQuery, variables);
  return { maskedQuery: maskedQuery, maskedVariables: maskedVariables };
}

function maskQuery(astSchema, query) {
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
  var maskedQuery = print(incrementalAst);
  maskedQuery = isBlank(maskedQuery) ? null : maskedQuery;
  return maskedQuery;
}

function maskVariables(astSchema, maskedQuery, variables) {
  if (!variables) {
    return variables;
  }
  var maskedQueryAst = parse(maskedQuery);
  var operation = maskedQueryAst.definitions.find(function(d) {
    return d.kind === "OperationDefinition";
  });

  var maskedVariables = {};
  var variableDefinitions = operation.variableDefinitions;
  if (!variableDefinitions || variableDefinitions.length === 0) {
    return maskedVariables;
  }
  variableDefinitions.forEach(function(varDefNode) {
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
    maskedVariables[varName] = varValue;
  });
  return maskedVariables;
}
