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

    mutation Mutation {
      getRidOfThis(foo: "bar")
    }
  `
  );
  expect(resultQueryString).toMatchSnapshot();
});

test("doesn't break minification", () => {
  var UglifyJS = require("uglify-js");
  var fs = require("fs");
  var result = UglifyJS.minify(fs.readFileSync("./src/index.js", "utf8"));
  expect(result).toEqual(jasmine.objectContaining({
    code: jasmine.any(String)
  }));
  expect(result).not.toEqual(jasmine.objectContaining({
    error: jasmine.anything()
  }));
})

test("it doesn't leave behind empty selections", () => {
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
        not
        in
        schema
      }
      thing
    }
  `
  );
  expect(resultQueryString).toMatchSnapshot();
});

test("filters out empty operations", () => {
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
    query Gone {
      woah
      wrong
    }

    query Stay {
      random
      thing
    }
  `
  );
  expect(resultQueryString).toMatchSnapshot();
});


test("returns null if query has no operations", () => {
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
    query Gone {
      woah
      wrong
    }
  `
  );
  expect(resultQueryString).toEqual(null);
});
