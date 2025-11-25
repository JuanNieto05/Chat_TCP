import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DETECTAR SI ESTAMOS EN PRODUCCIÓN
const isProduction = process.env.NODE_ENV === 'production';

export default {
  mode: isProduction ? 'production' : 'development',
  // Usamos una sola entrada y el CSS se importa desde index.js
  entry: './index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: isProduction ? '/' : '', // IMPORTANTE: cambiar para producción
  },
  resolve: {
    fallback: {
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false
    }
  },
  module: {
    rules: [
      {
        test: /ChatService\.js$/,
        use: 'script-loader',
      },
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
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/services/ChatService.js', to: 'src/services/ChatService.js' }
      ]
    })
  ],
  // SOLO para desarrollo local
  ...(isProduction ? {} : {
    devServer: {
      static: {
        directory: path.join(__dirname, './'),
      },
      historyApiFallback: true,
      compress: true,
      port: 3000,
      hot: true,
      open: false, // Prevent auto-opening browser
    },
  }),
  
  // OPTIMIZACIONES PARA PRODUCCIÓN
  ...(isProduction ? {
    optimization: {
      minimize: true,
    },
    performance: {
      hints: 'warning',
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    }
  } : {})
};