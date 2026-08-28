var path = require('path');

module.exports = {
    entry: './engine/engine.js',
    mode: 'production',
	target: 'es3',
	optimization: {
		minimize: true
	},
	module: {
		rules: [{ use: 'ts-loader', include: path.resolve(__dirname, '.') }]
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js']
	},
    output: {
        filename: 'coppercode.js',
        path: path.resolve(__dirname, '../'),
		chunkFormat: 'commonjs'
    }
};