const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    devServer: {
        port: 4200,
    },
    devtool: 'source-map',
    entry: [
        path.resolve(__dirname, 'src', 'index.js'),
    ],
    module: {
        rules: [
            {
                test: /\.css/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({ template: path.resolve(__dirname, 'src', 'index.html') }),
    ]
}