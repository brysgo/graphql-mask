// @flow

const { parse, visit, visitWithTypeInfo, print } = require("graphql/language");
const { TypeInfo, buildASTSchema } = require("graphql/utilities");

module.exports = function graphqlMask(schema, query) {
  const astSchema =
    typeof schema === "string" ? buildASTSchema(parse(schema)) : schema;
  const typeInfo = new TypeInfo(astSchema);
  return print(
    visit(
      parse(query),
      visitWithTypeInfo(typeInfo, {
        enter(node, key, parent, path, ancestors) {
          const parentType = typeInfo.getParentType();
          const type = typeInfo.getType();
          const inputType = typeInfo.getInputType();
          if (
            (node.kind === "Field" && !type) ||
            (node.kind === "Argument" && !inputType)
          ) {
            return null;
          }
        },
        leave(node, key, parent, path, ancestors) {}
      })
    )
  );
};
