const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    core: './src/core/index.js',
    item: './src/pages/item/index.js',
    'compare-craft': './src/pages/compare-craft/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: (pathData) => {
      return pathData.chunk.name === 'core' ? 'core.js' : '[name].bundle.js';
    }
  }
};
