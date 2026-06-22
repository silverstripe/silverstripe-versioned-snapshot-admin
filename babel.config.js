// Babel config consumed by jest (babel-jest) so it can transform the ESM/JSX in the tests
// and the silverstripe/admin client source they import. It is scoped to the test environment
// only - the webpack build supplies its own presets via @silverstripe/webpack-config's
// babel-loader, so we must not add a second (conflicting) preset-env there.
module.exports = (api) => {
  if (!api.env('test')) {
    return {};
  }

  return {
    presets: [
      '@babel/preset-env',
      '@babel/preset-react',
    ],
  };
};
