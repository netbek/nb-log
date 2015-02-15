/**
 * AngularJS logging and error handling
 *
 * @author Hein Bekker <hein@netbek.co.za>
 * @copyright (c) 2015 Hein Bekker
 * @license http://www.gnu.org/licenses/agpl-3.0.txt AGPLv3
 */

(function (window, angular, undefined) {
	'use strict';

	angular
		.module('nb.log', [
			'nb.i18n',
			'nb.moment'
		])
		.factory('nbLog', nbLog)
		.provider('nbLogConfig', nbLogConfig)
		.factory('nbLogHttpInterceptor', nbLogHttpInterceptor);

	var levels = {
		log: 10,
		debug: 20,
		info: 30,
		warn: 40,
		error: 50
	};

	function nbLogConfig () {
		var config = {
			delegate: true, // Whether to call original $log function when logging a message
			http_default_error: 'An error has occured. Please contact customer support for assistance.',
			http_network_error: 'Unable to communicate with the server. Make sure you are connected to the internet and try again.',
			levels: levels,
			logs: {
				app: {
					enabled: false,
					level: 'log',
					maxSize: 10 // Maximum number of messages in log
				},
				console: {
					enabled: false,
					level: 'log',
					maxSize: 10 // Maximum number of messages in log
				},
				http: {
					enabled: false,
					level: 'log',
					url: undefined, // Endpoint URL
					maxSize: 10 // Maximum number of messages in log
				}
			},
			on: {
				log: [],
				debug: [],
				info: [],
				warn: [],
				error: []
			} // Array of event callbacks
		};

		return {
			set: function (values) {
				config = window.merge.recursive(true, config, values);
			},
			$get: function () {
				return config;
			}
		};
	}

	nbLog.$inject = ['$injector', '$window', 'nbLogConfig'];
	function nbLog ($injector, $window, nbLogConfig) {
		return function ($delegate) {
			var $httpBackend, $q, $timeout, Moment, nbI18N;
			var logs = {};
			var isInitialized = false; // Whether init() has been executed
			var deferredInit;

			/**
			 *
			 * @returns {Promise}
			 */
			function init () {
				if (!isInitialized) {
					isInitialized = true;

					$httpBackend = $injector.get('$httpBackend');
					$q = $injector.get('$q');
					$timeout = $injector.get('$timeout');
					Moment = $injector.get('Moment');
					nbI18N = $injector.get('nbI18N');

					deferredInit = $q.defer();

					angular.forEach(nbLogConfig.logs, function (logConfig, logId) {
						var log;

						if (logId == 'app') {
							log = new AppLog;
						}
						else if (logId == 'console') {
							log = new ConsoleLog;
						}
						else if (logId == 'http') {
							log = new HttpLog;
						}
						else {
							return;
						}

						logs[logId] = log;
					});

					deferredInit.resolve(nbI18N.t('!variable initialized', {'!variable': '$log'}));
				}

				return deferredInit.promise;
			}

			/**
			 *
			 * @param {String} level
			 * @param {String} msg
			 * @param {Object} err
			 * @returns {Promise}
			 */
			function emit (level, msg, err) {
				if (nbLogConfig.delegate) {
					if (level === 'error' && err) {
						$delegate[level](err);
					}
					else {
						$delegate[level](msg);
					}
				}

				var promise = init();
				var entry = new Entry(level, msg, err);
				var d = $q.defer();

				promise
					.then(function () {
						var promises = [];

						angular.forEach(nbLogConfig.on[level], function (fn) {
							fn(entry);
						});

						angular.forEach(nbLogConfig.logs, function (logConfig, logId) {
							promises.push(logs[logId].emit(level, entry));
						});

						$q.all(promises)
							.then(function (data) {
								d.resolve(data);
							})
							['catch'](function (err) {
								d.reject(err);
								$delegate.warn(err);
							});
					})
					['catch'](function (err) {
						d.reject(err);
						$delegate.warn(err);
					});

				return d.promise;
			}

			/**
			 *
			 * @param {mixed} err
			 * @returns {Object|undefined}
			 */
			function buildError (err) {
				if (!err) {
					return undefined;
				}

				var obj = {};

				if (err instanceof Error) {
					angular.forEach(err, function (value, key) {
						obj[key] = value;
					});

					obj.name = err.name;
					obj.message = err.toString();
					obj.stack = err.stack || '';
					obj.code = err.code;
					obj.url = err.url || $window.location.href;
				}
				else {
					obj.message = err + '';
				}

				return obj;
			}

			/**
			 *
			 * @param {String} level
			 * @param {String} msg
			 * @param {Object} err
			 * @returns {Entry}
			 */
			function Entry (level, msg, err) {
				this.time = Moment().format();
				this.level = level;
				this.msg = msg;
				this.err = buildError(err);
			}

			/**
			 *
			 * @param {String} id
			 * @returns {Log}
			 */
			function Log (id) {
				this.isInitialized = false; // Whether init() has been executed
				this.isReady = false; // Whether this log has been initialized and is ready
				this.deferredInit = $q.defer();
				this.id = id;
				this.entries = [];
			}

			/**
			 *
			 * @returns {Promise}
			 */
			Log.prototype.init = function () {
				if (!this.isInitialized) {
					this.isInitialized = true;
					this.isReady = true;
					this.deferredInit.resolve(nbI18N.t('Log `!logId` is ready', {'!logId': this.id}));
				}

				return this.deferredInit.promise;
			};

			/**
			 *
			 * @param {String} level
			 * @param {Entry} entry
			 * @returns {Promise}
			 */
			Log.prototype.emit = function (level, entry) {
				var self = this;
				var config = nbLogConfig.logs[this.id];
				var d = $q.defer();

				this.init()
					.then(function () {
						if (config.enabled && levels[level] >= levels[config.level]) {
							if (self.entries.length >= config.maxSize) {
								self.entries.shift();
							}

							self.entries.push(entry);

							d.resolve(nbI18N.t('Added entry to log `!logId`', {'!logId': self.id}));
						}
						else {
							d.resolve();
						}
					})
					['catch'](function (err) {
						d.reject(err);
					});

				return d.promise;
			};

			/**
			 *
			 * @returns {AppLog}
			 */
			function AppLog () {
				Log.call(this);

				this.id = 'app';
			}

			AppLog.prototype = create(Log.prototype);
			AppLog.prototype.constructor = AppLog;

			/**
			 *
			 * @returns {ConsoleLog}
			 */
			function ConsoleLog () {
				Log.call(this);

				this.id = 'console';
			}

			ConsoleLog.prototype = create(Log.prototype);
			ConsoleLog.prototype.constructor = ConsoleLog;

			/**
			 *
			 * @param {String} level
			 * @param {Entry} entry
			 * @returns {Promise}
			 */
			ConsoleLog.prototype.emit = function (level, entry) {
				var self = this;
				var config = nbLogConfig.logs[this.id];
				var d = $q.defer();

				this.init()
					.then(function () {
						if (config.enabled && config.level && levels[level] >= levels[config.level]) {
							if (self.entries.length >= config.maxSize) {
								self.entries.shift();
							}

							self.entries.push(entry);

							if (!nbLogConfig.delegate && console && level in console) {
								if (level === 'error' && entry.err) {
									console[level](entry.err);
								}
								else {
									console[level](entry.msg);
								}
							}

							d.resolve(nbI18N.t('Added entry to log `!logId`', {'!logId': self.id}));
						}
						else {
							d.resolve();
						}
					})
					['catch'](function (err) {
						d.reject(err);
					});

				return d.promise;
			};

			/**
			 *
			 * @returns {HttpLog}
			 */
			function HttpLog () {
				Log.call(this);

				this.id = 'http';
			}

			HttpLog.prototype = create(Log.prototype);
			HttpLog.prototype.constructor = HttpLog;

			/**
			 *
			 * @returns {Promise}
			 */
			HttpLog.prototype.init = function () {
				if (!this.isInitialized) {
					this.isInitialized = true;

					var config = nbLogConfig.logs[this.id];

					if (config.enabled && !config.url) {
						this.isReady = false;
						this.deferredInit.reject(nbI18N.t('Log `!logId` endpoint URL is required', {'!logId': this.id}));
					}
					else {
						this.isReady = true;
						this.deferredInit.resolve(nbI18N.t('Log `!logId` is ready', {'!logId': this.id}));
					}
				}

				return this.deferredInit.promise;
			};

			/**
			 *
			 * @param {String} level
			 * @param {Entry} entry
			 * @returns {Promise}
			 */
			HttpLog.prototype.emit = function (level, entry) {
				var self = this;
				var config = nbLogConfig.logs[this.id];
				var d = $q.defer();

				this.init()
					.then(function () {
						if (config.enabled && levels[level] >= levels[config.level]) {
							if (self.entries.length >= config.maxSize) {
								self.entries.shift();
							}

							self.entries.push(entry);

							$httpBackend('POST', config.url, angular.toJson(entry), angular.noop, {'content-type': 'application/json'});

							d.resolve(nbI18N.t('Added entry to log `!logId`', {'!logId': self.id}));
						}
						else {
							d.resolve();
						}
					})
					['catch'](function (err) {
						d.reject(err);
					});

				return d.promise;
			};

			return {
				/**
				 * Returns entries for the specified log.
				 *
				 * @param {String} logId
				 * @returns {Array}
				 */
				getEntries: function (logId) {
					if (logId in logs) {
						return logs[logId].entries;
					}
					return [];
				},
				/**
				 * Register an event callback
				 *
				 * @param {String} level
				 * @param {Function} fn
				 */
				$on: function (level, fn) {
					nbLogConfig.on[level].push(fn);
				},
				/**
				 * Write a log message
				 *
				 * @param {String} msg
				 * @returns {Promise}
				 */
				log: function (msg) {
					return emit('log', msg);
				},
				/**
				 * Write a debug message
				 *
				 * @param {String} msg
				 * @returns {Promise}
				 */
				debug: function (msg) {
					return emit('debug', msg);
				},
				/**
				 * Write an information message
				 *
				 * @param {String} msg
				 * @returns {Promise}
				 */
				info: function (msg) {
					return emit('info', msg);
				},
				/**
				 * Write a warning message (non-fatal)
				 *
				 * @param {String} msg
				 * @returns {Promise}
				 */
				warn: function (msg) {
					return emit('warn', msg);
				},
				/**
				 * Write an error message (fatal)
				 *
				 * @param {String} msg
				 * @param {Object} err
				 * @returns {Promise}
				 */
				error: function (msg, err) {
					if (msg instanceof Error) {
						return emit('error', msg.message, msg);
					}
					return emit('error', msg, err);
				}
			};
		};
	}

	nbLogHttpInterceptor.$inject = ['$q', '$log', 'nbLogConfig'];
	function nbLogHttpInterceptor ($q, $log, nbLogConfig) {
		return {
			responseError: function (response) {
				var status = Number(response.status);
				var message = response.statusText || nbLogConfig.http_default_error;

				if (status === 0) {
					message = nbLogConfig.http_network_error;
				}

				$log.warn({
					message: message,
					url: response.config.url
				});

				return $q.reject(response);
			}
		};
	}

	/**
	 * Object.create polyfill
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
	 */
	var _create = (function () {
		var Temp = function () {
		};
		return function (prototype) {
			if (arguments.length > 1) {
				throw Error('Second argument not supported');
			}
			if (typeof prototype != 'object') {
				throw TypeError('Argument must be an object');
			}
			Temp.prototype = prototype;
			var result = new Temp();
			Temp.prototype = null;
			return result;
		};
	})();

	function create (proto) {
		return Object.create == 'function' ? Object.create(proto) : _create(proto);
	}
})(window, window.angular);
