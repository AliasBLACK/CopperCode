var path = require('path');

module.exports = {
	entry: './index.js',
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
		// CopperCube loads the script named after the project, so this has to
		// match the .ccb and the .exe beside it.
		filename: 'coppercode.js',
		path: path.resolve(__dirname, '../'),
		chunkFormat: 'commonjs'
	}
};
