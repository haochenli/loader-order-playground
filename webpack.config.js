const path = require('path');
const Webpack = require('webpack');
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const devServerPort = 8000; // 开发服务器端口号

// 是否是开发环境
// process.env拿到的是一个对象，它的属性可以通过命令行参数传入
// 这个NODE_ENV就是从package.json的dev/build scripts传进来的
const isDev = false;

const config = {
    // 指定webpack的模式，然后一些第三方库（比如vue、react等）也会针对这个值采用不同的包
    // 像vue就有完整版、运行时版等。参考：https://vuejs.org/v2/guide/deployment.html#With-Build-Tools
    mode: "development",
    entry: path.join(__dirname, './index.js'), // 项目总入口js文件
    // 输出文件
    output: {
        path: path.join(__dirname, 'dist'),
        /**
         * hash跟chunkhash的区别，如果entry有多个，或者需要单独打包类库到
         * 一个js文件的时候，hash是所有打包出来的每个js文件都是同样的哈希，
         * 而chunkhash就是只是那个chunk的哈希，也就是chunkhash如果那个chunk
         * 没有变化就不会变，而hash只要某一个文件内容有变化都是不一样的，所以
         * 用chunkhash区分开每一个文件有变化时才更新，让浏览器起到缓存的作用
         */
         filename: 'index.bundle.js',
        },
    module: {
        rules: [
            {
                enforce: 'post', 
                test: /\.js$/,
                use: [
                    {
                        loader: require.resolve('./src/loaders/loader1.js'),
                    },
                ]
            },
            {
                test: /\.js$/,
                use: [
                    {
                        loader: require.resolve('./src/loaders/loader2.js'),
                    }
                ]
            },
            {
                enforce: 'pre', 
                test: /\.js$/,
                use: [
                    {
                        loader: require.resolve('./src/loaders/loader3.js'),
                    }
                ]
            },
        ]
    },
};

module.exports = config;