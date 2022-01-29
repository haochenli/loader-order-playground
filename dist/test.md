## 为什么要关注loader的执行顺序？
最近在工作中需要写几个webpack的loader，但是发现好像自己并不清楚每次在webpack中配置的loader执行的顺序是如何的。在网上搜索半天好像也没找到类似的文章，可能只有我不太清楚吧。。😓
所以想写一个小demo把玩把玩～

```js
 {
        test: /\.scss$/,
        use: [
            'style-loader',

            // MiniCssExtractPlugin.loader,
            'css-loader',
            {
                loader: 'postcss-loader',
                options: {
                    sourceMap: true
                }
            },
            'sass-loader'
        ]
    }
```
> 如果你已经知道上面这几个loader都是做什么的话，那你应该已经“大概”知道loader的执行顺序了，如果不知道的话，还请客官继续往下看看～

## loader在同一个rule中的执行顺序
这里因为我想要知道在webpack中配置loader的执行顺序，所以我写了一个简单的demo用webpack进行打包，加入了几个简单的js loader：
- 我们把重点放到webpack配置中module的rule中：
``` js
     module: {
       rules: [
            {
                test: /\.js$/,
                use: [
                    {
                        loader: require.resolve('./src/loaders/loader1.js'),
                    },
                    {
                        loader: require.resolve('./src/loaders/loader2.js'),
                    },
                    {
                        loader: require.resolve('./src/loaders/loader3.js'),
                    }
                ]
            },
        ]
    }
```
webpack进行打包的入口文件只是简单定义了几个变量，并且log出index的文件名
```js
// webpack打包入口文件： index.js
const index = 'index.js';
const loader1 = 'loader1.js';
const loader2 = 'loader2.js';
const loader3 = 'loader3.js';

console.log(index)
```
- 其中的loader1，loader2，loader3是我自己写的一个简单loader，他们三个的内容非常简单，只是简单的加入`console.log('文件名字对应的变量名')`，这样方便测试最终打出来的bundle.js中所包含的内容
```js
// loader1.js中输出的是loader1， loader2.js中输出的是loader2，loader3.js输出loader3
module.exports = function(source, options) {
    const str = '\n  console.log(loader1);'
    console.log('executed in loader1')
    return source + str
};
```
- 那么最终打包出来的结果是什么样子的呢？
从下图能够看出来，入口文件index.js分别经过了四个loader处理，**从后向前执行**.

1. 即先经过loader3加入了`console.log(loader3)`.
2. 再loader2处理就加入了`console.log(loader2)`
3. 最后经过loader1处理加入了`console.log(loader1)`
![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8ff2ad17d21f421eb63b173cfd03e12e~tplv-k3u1fbpfcp-watermark.image?)

## loader在多个rule中的执行顺序

### 多个rule每个rule都不同
接下来再做个实验，如果我配置两个相同的rules，里面的loader的执行顺序又是啥样的呢？
```js
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    {
                        loader: require.resolve('./src/loaders/loader1.js'),
                    }
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
                test: /\.js$/,
                use: [
                    {
                        loader: require.resolve('./src/loaders/loader3.js'),
                    }
                ]
            },
          
        ]
    }
```
结果如下：
![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/76ff9415b2394d2dabd80496b2219b79~tplv-k3u1fbpfcp-watermark.image?)
emm结果和上面的`oader在同一个rule中的执行顺序`一致，和我想的一样。

### 多个rule中有相同的rule
```js
      module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    {
                        loader: require.resolve('./src/loaders/loader1.js'),
                    },
                    {
                        loader: require.resolve('./src/loaders/loader2.js'),
                    }
                ]
            },
            {
                test: /\.js$/,
                use: [
                    {
                        loader: require.resolve('./src/loaders/loader1.js'),
                    },
                    {
                        loader: require.resolve('./src/loaders/loader2.js'),
                    },
                    {
                        loader: require.resolve('./src/loaders/loader3.js'),
                    }
                ]
            },
          
        ]
    },
```

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7f9b6cd3d1714c11977695db7d829c8e~tplv-k3u1fbpfcp-watermark.image?)

果然就是倒着执行嘛，从右向左倒叙执行，3 -> 2 -> 1 -> 2 -> 1，好像连去重都不会，也就是说你的loader配置了几次就会被执行几次，此时我的问题就来了，那么有没有可能我在执行3 -> 2 -> 1的时候在某种情况下并不想继续执行了，也就是说给loader的执行顺序中加入逻辑？带着疑问我点开了
`node_modules/webpack/lib/NormalModule.js`中找到了`node_modules/loader-runner.js`文件，里面有一个runLoaders的方法。。。至此开启了一趟奇妙的旅程。。

## 谢特！ BRO

原来以为loader的执行顺序无非就是pop，push之类的，但当我看到了这里的代码的时候发现远比我想象中的复杂。从下面的代码片段中，前面的过程看似还比较可控，都是向locaderContext上面注入一些变量，比如remainingRequest: 剩余的loaders。previousRequest: 之前执行过的loaders等等，那么后面的这个iteratePitchingLoaders是什么鬼？pitching又是什么？
```js
exports.runLoaders = function runLoaders(options, callback) {
        ...
        var loaders = options.loaders || [];
	var loaderContext = options.context || {};
        Object.defineProperty(loaderContext, "resource", {
           ...
	});
        Object.defineProperty(loaderContext, "request", {
           ...
	});
	Object.defineProperty(loaderContext, "remainingRequest", {
           ...
	});
	Object.defineProperty(loaderContext, "currentRequest", {
	   ...
	});
	Object.defineProperty(loaderContext, "previousRequest", {
	   ...
	});
	Object.defineProperty(loaderContext, "query", {
           ...
	});
	Object.defineProperty(loaderContext, "data", {
          ...
	});

	iteratePitchingLoaders(processOptions, loaderContext, function(err, result) {
		...
	});
};
```
此处查询了一下文档的内容，原来每个loader其实又两部分组成：
1. Pitching 过程，loaders的pitching过程从前到后（loader1 -> 2 -> 3）
2. Normal 过程, loaders的normal过程从后到前（loader3 -> 2 -> 1）
   
此时我们稍微修改一下loader中的内容：
```js
module.exports = function(source, options) {
    const str = '\n  console.log(loader1);'
    console.log('executed in loader1')
    return source + str
};

module.exports.pitch = function (remainingRequest, precedingRequest, data) {
    console.log('pitch in loader1')
   };
```
输出瞅一眼：

可以先看一下iteratePitchingLoaders的内容是什么（已经简化）
```js
function iteratePitchingLoaders(options, loaderContext, callback) {
	if(loaderContext.loaderIndex >= loaderContext.loaders.length) { 
      //  递归loaders，当currentIndex > loaders的长度的时候
        processResource()
    }
    // 如果当前loader的pitch执行过了
	if(currentLoaderObject.pitchExecuted) {
		loaderContext.loaderIndex++; // 下一个loader
		return iteratePitchingLoaders(options, loaderContext, callback); // 递归调用当前函数
	}

	loadLoader(currentLoaderObject, function(err) {
		var fn = currentLoaderObject.pitch;
		currentLoaderObject.pitchExecuted = true;
		if(!fn) return iteratePitchingLoaders(options, loaderContext, callback);

        fn() // 执行pitch函数
	});
}
```


reference: https://zhuanlan.zhihu.com/p/360421184