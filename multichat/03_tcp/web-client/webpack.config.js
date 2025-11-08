import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'development',
  // Usamos una sola entrada y el CSS se importa desde index.js
  entry: './index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '',
  },
  module: {
    rules: [
      {
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
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      templateContent: () => {
        const raw = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
        return raw.replace(
          /<script\s+src=["']index\.js["'][^>]*><\/script>/i,
          '<script src="bundle.js"></script>'
        );
      },
      inject: false
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, './'),
    },
    historyApiFallback: true,
    compress: true,
    port: 8080,
    hot: true,
    open: false, // Prevent auto-opening browser
  },
};
