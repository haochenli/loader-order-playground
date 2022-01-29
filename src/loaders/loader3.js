module.exports = function(source, options) {
    const str = ' \n  console.log(loader3);'
    console.log('executed in loader3')

    return source + str

};

module.exports.pitch = function (remainingRequest, precedingRequest, data) {
    console.log('pitch in loader3')
    // return `require('-!./src/loaders/loader4.js!./index.js')`

   };