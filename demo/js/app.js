/**
 * AngularJS log demo
 *
 * @author Hein Bekker <hein@netbek.co.za>
 * @copyright (c) 2015 Hein Bekker
 * @license http://www.gnu.org/licenses/agpl-3.0.txt AGPLv3
 */

(function (window, angular, undefined) {
	'use strict';

	angular
		.module('nb.log.demo', [
			'nb.log'
		])
		.config(['nbLogConfigProvider',
			function (nbLogConfigProvider) {
				nbLogConfigProvider.set({
					delegate: false,
					logs: {
						console: {
							enabled: true
						}
					}
				});
			}])
		.config(['$httpProvider',
			function ($httpProvider) {
				$httpProvider.interceptors.push('nbLogHttpInterceptor');
			}
		])
		.config(['$provide',
			function ($provide) {
				$provide.decorator('$log', ['$delegate', 'nbLog',
					function ($delegate, nbLog) {
						return nbLog($delegate);
					}
				]);
			}
		])
		.controller('MainController', MainController)
		.run(runBlock);

	MainController.$inject = ['$log'];
	function MainController ($log) {
		$log.info('hello world');
	}

	function runBlock () {
	}
})(window, window.angular);