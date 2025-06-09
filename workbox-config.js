module.exports = {
	globDirectory: 'docs/',
	globPatterns: [
		'**/*.{html,json,js}'
	],
	swDest: 'docs/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};