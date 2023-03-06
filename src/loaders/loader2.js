module.exports = function(source, options) {
    const str = ' \n  console.log(loader2);'
    console.log('executed in loader2')

    return source + str
};

module.exports.pitch = function (remainingRequest, precedingRequest, data) {
    console.log('pitch in loader2')
    // return `require('!./src/loaders/loader4.js!./index.js')`

    // console.log('precedingRequest', precedingRequest)
    // console.log('data', data)
    // const temp = 'module.exports = require(' +
    // JSON.stringify('!' + remainingRequest) +
    // ');'
   };