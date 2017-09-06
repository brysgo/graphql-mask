// @flow

const { parse, buildASTSchema } = require("graphql");

const graphqlMask = require("../src");

test("removing fields from query that aren't in schema", () => {
  const astSchema = buildASTSchema(
    parse(`
    type Query {
      this: [Bar]!
      random: String
      thing: Int!
    }
    type Bar {
      id: ID!
      is: String
      a: Int
    }
    `)
  );

  const resultQueryString = graphqlMask(
    astSchema,
    `
    query RandomQuery {
      this {
        is
        a
      }
      random
      thing
      notInSchema
    }
  `
  );
  expect(resultQueryString).toMatchSnapshot();
});

test("removing arguments that don't exist in schema", () => {
  const astSchema = buildASTSchema(
    parse(`
    type Query {
      something(bar: Int): String
    }
    `)
  );

  const resultQueryString = graphqlMask(
    astSchema,
    `
    query RandomQuery {
      something(foo: "foo", bar: 4)
    }
  `
  );
  expect(resultQueryString).toMatchSnapshot();
});

test("passing a string schema instead of a parsed one", () => {
  const resultQueryString = graphqlMask(
    `
    type Query {
      two: Int
    }`,
    `
    query RandomQuery {
      one
      two      
    }
  `
  );
  expect(resultQueryString).toMatchSnapshot();
});
