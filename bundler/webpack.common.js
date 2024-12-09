const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')

const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
require('dotenv').config({ path: path.resolve(__dirname, './.env') })

module.exports = {

    entry: {
        main: './src/script.js',

        index: './src/js/bitcoin-draw-lines-v2-supabase-works-new-paint-both.js',

        archive: './src/js/bitcoin-draw-lines-v2-archive-lines-new-paint-both.js',

    },
    output:
    {
        filename: 'bundle.[contenthash].js',
        path: path.resolve(__dirname, '../dist'),
        publicPath: '',
    },
    devtool: 'source-map',
    plugins:
        [
            new CopyWebpackPlugin({
                patterns: [
                    { from: path.resolve(__dirname, '../static') }
                ]
            }),

            new Dotenv({
                path: './.env',
                safe: false,
            }),

            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, '../src/index.html'),
                chunks: ['main', 'index'],
                minify: true
            }),
            new HtmlWebpackPlugin({
                filename: 'archive.html',
                template: path.resolve(__dirname, '../src/archive.html'),
                chunks: ['main', 'archive'],
                minify: true,
            }),

            new MiniCSSExtractPlugin({
                filename: "[name]-[contenthash].css",
                chunkFilename: "[id]-[contenthash].css"
            }),
        ],
    module:
    {
        rules:
            [

                {
                    test: /\.(html)$/,
                    use: ['html-loader'
                    ]

                },


                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use:
                        [
                            'babel-loader'
                        ]
                },



                {
                    test: /\.css$/,
                    use:
                        [
                            MiniCSSExtractPlugin.loader,
                            'css-loader'

                        ]

                },


                {
                    test: /\.s[ac]ss$/i,
                    use: [

                        MiniCSSExtractPlugin.loader, "css-loader", "sass-loader"
                    ],
                },


                {
                    test: /\.(jpg|jpeg|png|webp|gif|svg)$/,
                    use:
                        [
                            {
                                loader: 'file-loader',

                                options:
                                {
                                    outputPath: 'assets/images/'
                                }

                            }
                        ],

                },

                // Fonts
                {
                    test: /\.(ttf|eot|woff|woff2)$/,
                    use:
                        [
                            {
                                loader: 'file-loader',
                                options:
                                {
                                    outputPath: 'assets/fonts/'
                                }
                            }
                        ]
                }
            ]
    }
}
