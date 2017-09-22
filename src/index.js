// @flow

var graphqlLanguage = require("graphql/language"),
parse = graphqlLanguage.parse,
visit = graphqlLanguage.visit,
visitWithTypeInfo = graphqlLanguage.visitWithTypeInfo,
print = graphqlLanguage.print;

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
            (node.kind === "Field" && !type) ||
            (node.kind === "Argument" && !inputType)
          ) {
            return null;
          }
        },
        leave: function(node, key, parent, path, ancestors) {}
      })
    )
  );
};
