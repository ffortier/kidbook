import path from "path";
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { Configuration } from "webpack";
import { Options as TsLoaderOptions } from "ts-loader";
import "webpack-dev-server";

const tsLoaderOptions: Partial<TsLoaderOptions> = {
    configFile: path.resolve(__dirname, '..', 'tsconfig.json')
}

export const config: Configuration = {
    devServer: {
        port: 4200,
    },
    devtool: 'source-map',
    entry: [
        path.resolve(__dirname, '..', 'src', 'index.ts')
    ],
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: tsLoaderOptions,
                    }
                ]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin(),
    ]
}
