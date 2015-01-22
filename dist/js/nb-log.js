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
				config = extend(true, {}, config, values);
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
			 * @param {string} level
			 * @param {string} msg
			 * @param {object} err
			 * @returns {Promise}
			 */
			function emit (level, msg, err) {
				if (level === 'error' && err) {
					$delegate[level](err);
				}
				else {
					$delegate[level](msg);
				}

				var promise = init();
				var entry = new Entry(msg, err);
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
							.catch(function (err) {
								d.reject(err);
								$delegate.warn(err);
							});
					})
					.catch(function (err) {
						d.reject(err);
						$delegate.warn(err);
					});

				return d.promise;
			}

			/**
			 *
			 * @param {mixed} err
			 * @returns {object|undefined}
			 */
			function buildError (err) {
				if (!err) {
					return undefined;
				}

				var name, message, stack, url;

				if (err instanceof Error) {
					name = err.name;
					message = err.toString();
					stack = err.stack || '';
					url = err.url || $window.location.href;
				}
				else {
					message = err + '';
				}

				return {
					name: name,
					message: message,
					stack: stack,
					url: url
				};
			}

			/**
			 *
			 * @param {string} msg
			 * @param {object} err
			 * @returns {Entry}
			 */
			function Entry (msg, err) {
				this.time = Moment().format();
				this.msg = msg;
				this.err = buildError(err);
			}

			/**
			 *
			 * @param {string} id
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
			 * @param {string} level
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
					.catch(function (err) {
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
			 * @param {string} level
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
					.catch(function (err) {
						d.reject(err);
					});

				return d.promise;
			};

			return {
				/**
				 * Write a log message
				 *
				 * @param {string} msg
				 * @returns {Promise}
				 */
				log: function (msg) {
					return emit('log', msg);
				},
				/**
				 * Write a debug message
				 *
				 * @param {string} msg
				 * @returns {Promise}
				 */
				debug: function (msg) {
					return emit('debug', msg);
				},
				/**
				 * Write an information message
				 *
				 * @param {string} msg
				 * @returns {Promise}
				 */
				info: function (msg) {
					return emit('info', msg);
				},
				/**
				 * Write a warning message (non-fatal)
				 *
				 * @param {string} msg
				 * @returns {Promise}
				 */
				warn: function (msg) {
					return emit('warn', msg);
				},
				/**
				 * Write an error message (fatal)
				 *
				 * @param {string} msg
				 * @param {object} err
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

	/**
	 * Checks if value is an object created by the Object constructor.
	 *
	 * @param {mixed} value
	 * @returns {Boolean}
	 */
	function isPlainObject (value) {
		return (!!value && typeof value === 'object' && value.constructor === Object
			// Not DOM node
			&& !value.nodeType
			// Not window
			&& value !== value.window);
	}

	/**
	 * Merge the contents of two or more objects together into the first object.
	 *
	 * Shallow copy: extend({}, old)
	 * Deep copy: extend(true, {}, old)
	 *
	 * Based on jQuery (MIT License, (c) 2014 jQuery Foundation, Inc. and other contributors)
	 */
	function extend () {
		var options, key, src, copy, copyIsArray, clone,
			target = arguments[0] || {},
			i = 1,
			length = arguments.length,
			deep = false;

		// Handle a deep copy situation
		if (typeof target === 'boolean') {
			deep = target;

			// Skip the boolean and the target
			target = arguments[i] || {};
			i++;
		}

		// Handle case when target is a string or something (possible in deep copy)
		if (!isPlainObject(target) && !angular.isFunction(target)) {
			target = {};
		}

		// If only one argument is passed
		if (i === length) {
			i--;
		}

		for (; i < length; i++) {
			// Only deal with non-null/undefined values
			if ((options = arguments[i]) != null) {
				// Extend the base object
				for (key in options) {
					src = target[key];
					copy = options[key];

					// Prevent never-ending loop
					if (target === copy) {
						continue;
					}

					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = angular.isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && angular.isArray(src) ? src : [];
						}
						else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[key] = extend(deep, clone, copy);
					}
					// Don't bring in undefined values
					else if (copy !== undefined) {
						target[key] = copy;
					}
				}
			}
		}

		// Return the modified object
		return target;
	}
})(window, window.angular);
