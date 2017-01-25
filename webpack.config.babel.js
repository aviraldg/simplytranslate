import webpack from 'webpack';

module.exports = {
  context: __dirname + '/app',
  entry: './index.js',

  output: {
    filename: 'app.js',
    path: __dirname + '/dist',
  },

  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loaders: ['babel-loader']
    }, {
      test: /\.scss$/,
      loaders: ['style-loader', 'css-loader', 'sass-loader']
    }, {
      test: /\.json$/,
      loaders: ['json']
    }]
  },

  plugins: [
    new webpack.EnvironmentPlugin(['GAPI_KEY'])
  ],

  devtool: 'source-map'
};
