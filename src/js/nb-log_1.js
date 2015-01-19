/**
 * AngularJS service for simple logging
 *
 * @author Hein Bekker <hein@netbek.co.za>
 * @copyright (c) 2015 Hein Bekker
 * @license http://www.gnu.org/licenses/agpl-3.0.txt AGPLv3
 */

(function (window, angular, undefined) {
	'use strict';

	angular
		.module('nb.log', [
//			'nb.i18n',
//			'nb.lodash',
//			'nb.moment'
		])
//		.provider('nbLog', nbLog)
		.factory('nbLog', nbLog)
		.provider('nbLogConfig', nbLogConfig)
		.factory('nbLogHttpInterceptor', nbLogHttpInterceptor)
		.run(runBlock);

	function runBlock () {
	}

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
					url: undefined, // Endpoint
					maxSize: 10 // Maximum number of messages in log
				}
			}
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

	function nbLog () {
		return function ($delegate) {
			return {
				log: function () {
				},
				info: function () {
				},
				error: function () {
				},
				warn: function () {
					$delegate.warn(arguments);
					console.log("SHADOW: ", arguments);
				}
			};
		};
	}

//	nbLog.$inject = ['$delegate', 'nbLogConfig'];
//	function nbLog ($delegate, nbLogConfig) {
//		return {
//			log: function () {
//			},
//			info: function () {
//			},
//			error: function () {
//			},
//			warn: function () {
//				$delegate.warn(arguments);
//				console.log("SHADOW: ", arguments);
//			}
//		}
//	}

//	function nbLog () {
//		return function ($delegate) {
//			return {
//				log: function () {
//				},
//				info: function () {
//				},
//				error: function () {
//				},
//				warn: function () {
//					$delegate.warn(arguments);
//					console.log("SHADOW: ", arguments);
//				}
//			};
//		};
//	}

//	function nbLog () {
//		return {
//			$get: ['$q', '$log', 'nbLogConfig', '$timeout',
//				function ($q, $log, nbLogConfig, $timeout) {
//					var logs = [];
//					var isInitialized = false; // Whether init() has been executed
//					var isReady = false; // Whether all logs have been initialized and are ready
//
//					function Log (id) {
//						this.isInitialized = false; // Whether init() has been executed
//						this.isReady = false; // Whether this log has been initialized and is ready
//						this.id = id;
//						this.entries = [];
//					}
//
//					/**
//					 *
//					 * @returns {defer.promise}
//					 */
//					Log.prototype.init = function () {
//						var d = $q.defer();
//
//						if (this.isInitialized) {
//							if (this.isReady) {
//								d.resolve('Initialized log "' + this.id + '".');
//							}
//							else {
//								d.reject('Failed to initialize log "' + this.id + '".');
//							}
//
//							return d.promise;
//						}
//
//						this.isInitialized = true;
//						this.isReady = true;
//						d.resolve('Initialized log "' + this.id + '".');
//
//						return d.promise;
//					};
//
//					/**
//					 * Gets the last entry in the log.
//					 *
//					 * @returns {object}
//					 */
//					Log.prototype.lastEntry = function () {
//						var length = this.entries.length;
//						if (length) {
//							return this.entries[length - 1];
//						}
//						return undefined;
//					};
//
//					/**
//					 *
//					 * @param {string} level
//					 * @param {object} entry
//					 * @returns {defer.promise}
//					 */
//					Log.prototype.add = function (level, entry) {
//						var self = this;
//						var d = $q.defer();
//						var config = nbLogConfig.logs[this.id];
//
//						this.init()
//							.then(function () {
//								if (config.enabled && levels[level] >= levels[config.level]) {
//									if (self.entries.length >= config.maxSize) {
//										self.entries.shift();
//									}
//
//									self.entries.push(entry);
//
//									d.resolve('Entry added to ' + self.id + ' log.');
//								}
//								else {
//									d.resolve();
//								}
//							})
//							.catch(function (err) {
//								d.reject(err);
//							});
//
//						return d.promise;
//					};
//
//					function AppLog () {
//						Log.call(this);
//
//						this.id = 'app';
//					}
//
//					AppLog.prototype = create(Log.prototype);
//					AppLog.prototype.constructor = AppLog;
//
//					function ConsoleLog () {
//						Log.call(this);
//
//						this.id = 'console';
//					}
//
//					ConsoleLog.prototype = create(Log.prototype);
//					ConsoleLog.prototype.constructor = ConsoleLog;
//
//					/**
//					 *
//					 * @param {string} level
//					 * @param {object} entry
//					 * @returns {defer.promise}
//					 */
//					ConsoleLog.prototype.add = function (level, entry) {
//						var self = this;
//						var d = $q.defer();
//						var config = nbLogConfig.logs[this.id];
//
//						this.init()
//							.then(function () {
//								if (config.enabled && levels[level] >= levels[config.level]) {
//									if (self.entries.length >= config.maxSize) {
//										self.entries.shift();
//									}
//
//									self.entries.push(entry);
//
//									// Exceptions are logged to console in $exceptionHandler, thus should be ignored here.
//									if (levels[level] < levels.error) {
//										$log[level].call($log, entry);
//									}
//
//									d.resolve('Entry added to ' + self.id + ' log.');
//								}
//								else {
//									d.resolve();
//								}
//							})
//							.catch(function (err) {
//								d.reject(err);
//							});
//
//						return d.promise;
//					};
//
//					function HttpLog () {
//						Log.call(this);
//
//						this.id = 'http';
//					}
//
//					HttpLog.prototype = create(Log.prototype);
//					HttpLog.prototype.constructor = HttpLog;
//
//					return {
//						/**
//						 *
//						 * @returns {defer.promise}
//						 */
//						init: function () {
//							var d = $q.defer();
//
//							if (isInitialized) {
//								if (isReady) {
//									d.resolve('Logs initialized.');
//								}
//								else {
//									d.reject('Failed to initialize logs.');
//								}
//
//								return d.promise;
//							}
//
//							var log, promises = [];
//
//							angular.forEach(nbLogConfig.logs, function (logConfig, logId) {
//								if (logId == 'app') {
//									log = new AppLog;
//								}
//								else if (logId == 'console') {
//									log = new ConsoleLog;
//								}
//								else if (logId == 'http') {
//									log = new HttpLog;
//								}
//								else {
//									return;
//								}
//
//								logs[logId] = log;
//								promises.push(log.init());
//							});
//
//							$q.all(promises)
//								.then(function () {
//									isReady = true;
//									d.resolve('Logs initialized.');
//								})
//								.catch(function (err) {
//									isReady = false;
//									d.reject(err);
//								});
//
//							isInitialized = true;
//
//							return d.promise;
//						},
//						/**
//						 *
//						 * @param {string} level
//						 * @param {object} error
//						 * @returns {defer.promise}
//						 */
//						_log: function (level, error) {
//							var d = $q.defer();
//
//							this.init()
//								.then(function () {
//									var promises = [];
//
//									angular.forEach(nbLogConfig.logs, function (logConfig, logId) {
//										promises.push(logs[logId].add(level, error));
//									});
//
//									$q.all(promises)
//										.then(function (data) {
//											d.resolve(data);
//										})
//										.catch(function (err) {
//											d.reject(err);
//										});
//								})
//								.catch(function (err) {
//									d.reject(err);
//								});
//
//							return d.promise;
//						},
//						/**
//						 * Write a log message
//						 *
//						 * @param {object} error
//						 * @returns {defer.promise}
//						 */
//						log: function (error) {
//							return this._log('log', error);
//						},
//						/**
//						 * Write a debug message
//						 *
//						 * @param {object} error
//						 * @returns {defer.promise}
//						 */
//						debug: function (error) {
//							return this._log('debug', error);
//						},
//						/**
//						 * Write an information message
//						 *
//						 * @param {object} error
//						 * @returns {defer.promise}
//						 */
//						info: function (error) {
//							return this._log('info', error);
//						},
//						/**
//						 * Write a warning message (non-fatal)
//						 *
//						 * @param {object} error
//						 * @returns {defer.promise}
//						 */
//						warn: function (error) {
//							return this._log('warn', error);
//						},
//						/**
//						 * Write an error message (fatal)
//						 *
//						 * @param {object} error
//						 * @returns {defer.promise}
//						 */
//						error: function (error) {
//							return this._log('error', error);
//						}
//					};
//				}
//			]
//		};
//	}

	nbLogHttpInterceptor.$inject = ['$rootScope', '$q', 'nbLog', 'nbLogConfig'];
	function nbLogHttpInterceptor ($rootScope, $q, nbLog, nbLogConfig) {
		return {
			responseError: function (response) {
				var message = response.headers('status-text') || nbLogConfig.http_default_error;
				if (response.status == 0) {
					message = nbLogConfig.http_network_error;
				}
				$rootScope.$broadcast('error', message);
				return $q.reject(response);

//				var status = Number(response.status);
//				var message;
//
//				if (status === 0 || isNaN(status)) {
//					message = nbI18N.t(nbLogConfig.http_network_error);
//				}
//				else {
//					message = response.statusText || nbI18N.t('An error has occured. Please contact customer support for assistance.');
//				}
//
//				nbLog.warn(message);
//
//				var d = $q.defer();
//				d.reject(response);
//				return d.promise;
			}
		};
	}

//	runBlock.$inject = ['nbLog'];
//	function runBlock (nbLog) {
//		nbLog.init();
//	}

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
