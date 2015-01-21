describe('nb.log', function () {
	var httpBackend, log, nbLogConfig;

	beforeEach(module('nb.log'));

	beforeEach(inject(function ($httpBackend, $log, _nbLogConfig_) {
		httpBackend = $httpBackend;
		log = $log;
		nbLogConfig = _nbLogConfig_;
	}));

	it('should have httpBackend service defined', function () {
		expect(httpBackend).toBeDefined();
	});

	it('should have log service defined', function () {
		expect(log).toBeDefined();
	});

	it('should have nbLogConfig service defined', function () {
		expect(nbLogConfig).toBeDefined();
	});
});