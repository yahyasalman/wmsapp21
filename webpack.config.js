const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  // Set Webpack to production mode for optimized builds
  mode: 'production',

  // Entry point for the application (source file)
  entry: './src/main.ts',

  // Output configuration
  output: {
    // Output directory for the build files
    path: path.resolve(__dirname, 'dist/analyze'),
    // Name of the output bundle file
    filename: 'bundle.js',
    // Clean the output directory before building
    clean: true,
  },

  // Resolve module imports
  resolve: {
    alias: {
      // Alias for resolving modules (if needed)
      '@': path.resolve(__dirname, 'src'),
    },
    // Extensions Webpack will resolve automatically
    extensions: ['.ts', '.js', '.json'],
  },

  // Plugins for additional functionality
  plugins: [
    new BundleAnalyzerPlugin({
      // Generate a static HTML file for the bundle analysis
      analyzerMode: 'static',
      // Output the report to the dist folder
      reportFilename: path.resolve(__dirname, 'dist/wmsapp21/stats.html'),
      // Automatically open the report in the browser
      openAnalyzer: true,
    }),
  ],

  // Module rules for processing files
  module: {
    rules: [
      {
        // Process TypeScript files
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        // Process JavaScript files
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        // Process CSS files with PostCSS (for Tailwind CSS)
        test: /\.css$/,
        use: [
          'style-loader', // Injects styles into the DOM
          'css-loader', // Resolves @import and url() in CSS
          {
            loader: 'postcss-loader', // Processes CSS with PostCSS
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'), // Tailwind CSS plugin
                  require('autoprefixer'), // Adds vendor prefixes for browser compatibility
                ],
              },
            },
          },
        ],
        include: path.resolve(__dirname, 'src'), // Ensure only your app's CSS is processed
      },
    ],
  },

  // Optimization settings
  optimization: {
    splitChunks: {
      chunks: 'all', // Split vendor and app code into separate bundles
    },
  },
};
