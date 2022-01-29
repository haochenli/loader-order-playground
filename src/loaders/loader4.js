module.exports = function(source, options) {
    const str = ' \n  console.log("I am in the inline loader");'
    console.log('executed in loader4')
    return source + str

};

module.exports.pitch = function (remainingRequest, precedingRequest, data) {
    console.log('pitch in loader4')
   };