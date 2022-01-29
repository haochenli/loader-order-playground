module.exports = function(source, options) {
    const str = '\n  console.log(loader1);'
    console.log('executed in loader1')
    return source + str

};

module.exports.pitch = function (remainingRequest, precedingRequest, data) {
    console.log('pitch in loader1')

   };