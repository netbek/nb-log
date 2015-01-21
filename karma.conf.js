// Karma configuration

module.exports = function (config) {
	config.set({
		basePath: '',
		frameworks: ['jasmine'],
		files: [
			'bower_components/angular/angular.js',
			'bower_components/angular-mocks/angular-mocks.js',
			'vendor/nb-i18n/dist/js/nb-i18n.js',
			'vendor/nb-moment/dist/js/nb-moment.js',
			'vendor/nb-moment/vendor/moment/moment.js',
			'src/js/**/*.js',
			'test/**/*.js'
		],
		exclude: [
		],
		preprocessors: {
		},
		reporters: ['progress'],
		port: 9876,
		colors: true,
		logLevel: config.LOG_INFO,
		autoWatch: true,
		browsers: ['Chrome'],
		singleRun: true
	});
};
