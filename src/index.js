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

module.exports = function graphqlMask(schema, query) {
  var astSchema =
    typeof schema === "string" ? buildASTSchema(parse(schema)) : schema;
  var typeInfo = new TypeInfo(astSchema);
  return print(
    visit(
      parse(query),
      visitWithTypeInfo(typeInfo, {
        enter: function(node, key, parent, path, ancestors) {
          var parentType = typeInfo.getParentType();
          var type = typeInfo.getType();
          var inputType = typeInfo.getInputType();
          if (
            ((node.kind === "Field" || node.kind === "OperationDefinition") && !type) ||
            (node.kind === "Argument" && !inputType)
          ) {
            return null;
          }
        },
        leave: function(node, key, parent, path, ancestors) {
          var type = typeInfo.getType();
          if (node.kind === "Document" && node.definitions.length === 0) {
            return null;
          }
          if (node.kind === "SelectionSet" && node.selections.length === 0) {
            return null;
          } else if ((node.kind === "Field" && !isLeafType(getNamedType(type)) || node.kind === "OperationDefinition") &&  node.selectionSet === null) {
            return null;
          }
        }
      })
    )
  );
};
