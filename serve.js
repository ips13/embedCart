var compressor = require('node-minify');
// Using gcc 
compressor.minify({
	compressor	: 'gcc',
    input		: 'lib.js',
	output		: 'lib.min.js',
	options: {
		formatting: 'pretty_print',
		language: 'ECMASCRIPT6'
	},
	callback	: function (err, min) {
		// console.log(err);
		// console.log(min);
	}
});