'use strict';

import { expect } from 'chai';
import server from 'mockyeah';
import GitlabCi from './../lib/index';
import request from 'request';
import logger from 'winston';


logger.level = 'OFF';

const options = {
    url: 'http://localhost:4001',
    token: 'mySecretToken'
}

describe('Gitlab Module', function() {
    // remove service mocks after each test
    afterEach(() => server.reset());

    describe('#constructor', function() {
        it('should construct and store custom options', () => {
            //construct block
            var block = new GitlabCi(options);

            //expect url and token to be set
            expect(block.url).to.equal('http://localhost:4001');
            expect(block.token).to.equal('mySecretToken');

            //expect the status text to be the default values
            expect(block.status.success).to.equal('');
            expect(block.status.failure).to.equal('');

            //expect color to be false
            expect(block.color).to.be.false;
        });

        it('should use custom status', () => {
            //use a config with custom status texts
            var config = Object.assign({}, options, {
                status: {
                    success: 'OK',
                    failure: 'DOOMED'
                }
            });

            //construct block
            var block = new GitlabCi(config);

            //expect the custom status texts to be set
            expect(block.status.success).to.equal('OK');
            expect(block.status.failure).to.equal('DOOMED');
        });

        it('should use default colors if enabled', () => {
            //enable colors in config
            var config = Object.assign({}, options, {
                color: true
            });

            //construct block
            var block = new GitlabCi(config);

            //check colors
            expect(block.color.success).to.equal('#00FF00');
            expect(block.color.failure).to.equal('#FF0000');
        });

        it('should use custom colors', () => {
            //enable colors in config
            var config = Object.assign({}, options, {
                color: {
                    success: '#88FF88',
                    failure: '#FF8888'
                }
            });

            //construct block
            var block = new GitlabCi(config);

            //check colors
            expect(block.color.success).to.equal('#88FF88');
            expect(block.color.failure).to.equal('#FF8888');
        });

        it('should use simple project', () => {
            //enable colors in config
            var config = Object.assign({}, options, {
                project: 85
            });

            //construct block
            var block = new GitlabCi(config);

            //check project
            expect(block.project).to.equal(85);
        });

        it('should fail without url', () => {

            expect(function() {
                var client = new GitlabCi({});
            }).to.throw('config value url is missing');
        });

        it('should fail without token', () => {

            expect(function() {
                var client = new GitlabCi({
                    url: 'some'
                });
            }).to.throw('config value token is missing');
        });

    });


    describe('update for single project', function() {
        it('should handle success', (done) => {

            //construct block, show only a single project
            var config = Object.assign({}, options, {
                project: 85
            });
            var block = new GitlabCi(config, {});

            //prepare mock response
            const expectation = mock('/projects/85/builds', {
                per_page: '1'
            }, [{
                "id": 334,
                "status": "success"
            }]);


            execute(block, (output) => {
                //verify server interaction
                expectation.verify();

                //check output line
                expect(output.short_text).to.equal('');
                expect(output.full_text).to.equal('');

                done();
            });
        });

        it('should handle failures', (done) => {

            //construct block, show only a single project
            var config = Object.assign({}, options, {
                project: 85
            });
            var block = new GitlabCi(config, {});

            //prepare mock response
            const expectation = mock('/projects/85/builds', {
                per_page: '1'
            }, [{
                "id": 334,
                "status": "failure"
            }]);

            execute(block, (output) => {
                //verify server interaction
                expectation.verify();

                //check output line
                expect(output.short_text).to.equal('');
                expect(output.full_text).to.equal('');

                done();
            });
        });

        it('should handle errors', (done) => {

            //construct block, show only a single project
            var config = Object.assign({}, options, {
                project: 85
            });
            var block = new GitlabCi(config, {});

            //prepare mock response, responds error
            const expectation = mock('/projects/85/builds', {
                per_page: '1'
            });

            execute(block, (output) => {
                //verify server interaction
                expectation.verify();

                //check output line
                expect(output.short_text).to.equal('Error: Got response code 404');
                expect(output.full_text).to.equal('Error: Got response code 404');

                done();
            });
        });
    });

    describe('update for multiple project', function() {
        it('should handle success', (done) => {

            //construct block
            var config = Object.assign({}, options, {
                project: [21, 22, 23]
            });
            var block = new GitlabCi(config, {});

            //prepare mock responses
            const expectations = new Array(3);

            expectations.push(mock('/projects/21/builds', {
                per_page: '1'
            }, [{
                "id": 334,
                "status": "success"
            }]));
            expectations.push(mock('/projects/22/builds', {
                per_page: '1'
            }, [{
                "id": 4711,
                "status": "running"
            }]));
            expectations.push(mock('/projects/23/builds', {
                per_page: '1'
            }, [{
                "id": 66,
                "status": "pending"
            }]));

            execute(block, (output) => {
                //verify server interaction
                expectations.forEach((expectation) => {
                    expectation.verify()
                });

                //check output line
                expect(output.short_text).to.equal('');
                expect(output.full_text).to.equal('');

                done();
            });
        });

        it('should handle multiple failures', (done) => {

            //construct block
            var config = Object.assign({}, options, {
                project: [21, 22, 23]
            });
            var block = new GitlabCi(config, {});

            //prepare mock responses
            const expectations = new Array(3);
            expectations.push(mock('/projects/21/builds', {
                per_page: '1'
            }, [{
                "id": 334,
                "status": "failure"
            }]));
            expectations.push(mock('/projects/22/builds', {
                per_page: '1'
            }, [{
                "id": 4711,
                "status": "success"
            }]));
            expectations.push(mock('/projects/23/builds', {
                per_page: '1'
            }, [{
                "id": 66,
                "status": "failure"
            }]));

            execute(block, (output) => {
                //verify server interaction
                expectations.forEach((expectation) => {
                    expectation.verify()
                });

                //check output line
                expect(output.short_text).to.equal(' (2)');
                expect(output.full_text).to.equal(' (2)');

                done();
            });
        });

        it('should ignore projects without builds', (done) => {

            //construct block
            var config = Object.assign({}, options, {
                project: [21, 22, 23]
            });
            var block = new GitlabCi(config, {});

            //prepare mock responses
            const expectations = new Array(3);
            expectations.push(mock('/projects/21/builds', {
                per_page: '1'
            }, []));
            expectations.push(mock('/projects/22/builds', {
                per_page: '1'
            }, []));
            expectations.push(mock('/projects/23/builds', {
                per_page: '1'
            }, [{
                "id": 66,
                "status": "failure"
            }]));

            execute(block, (output) => {
                //verify server interaction
                expectations.forEach((expectation) => {
                    expectation.verify()
                });

                //check output line
                expect(output.short_text).to.equal('');
                expect(output.full_text).to.equal('');

                done();
            });
        });


        it('should handle errors', (done) => {

            //construct block, show only a single project
            var config = Object.assign({}, options, {
                project: [21, 22, 23, 42, 85]
            });
            var block = new GitlabCi(config, {});


            execute(block, (output) => {

                //check output line
                expect(output.short_text).to.equal('Error: Got response code 404');
                expect(output.full_text).to.equal('Error: Got response code 404');

                done();
            });
        });

    });


    describe('update for all found projects', function() {
        it('should handle success', (done) => {

            //construct block
            var block = new GitlabCi(options, {});

            //prepare mock responses
            const expectations = new Array(4);

            expectations.push(mock('/projects/', {
                simple: 'true'
            }, [{
                "id": 21

            }, {
                "id": 22

            }, {
                "id": 23
            }]));

            expectations.push(mock('/projects/21/builds', {
                per_page: '1'
            }, [{
                "id": 334,
                "status": "success"
            }]));
            expectations.push(mock('/projects/22/builds', {
                per_page: '1'
            }, [{
                "id": 4711,
                "status": "success"
            }]));
            expectations.push(mock('/projects/23/builds', {
                per_page: '1'
            }, [{
                "id": 66,
                "status": "success"
            }]));

            execute(block, (output) => {
                //verify server interaction
                expectations.forEach((expectation) => {
                    expectation.verify()
                });

                //check output line
                expect(output.short_text).to.equal('');
                expect(output.full_text).to.equal('');

                done();
            });
        });

        it('should handle multiple failures', (done) => {

            //construct block
            var block = new GitlabCi(options, {});

            //prepare mock responses
            const expectations = new Array(4);


            expectations.push(mock('/projects/', {
                simple: 'true'
            }, [{
                "id": 21
            }, {
                "id": 22
            }, {
                "id": 23
            }]));

            expectations.push(mock('/projects/21/builds', {
                per_page: '1'
            }, [{
                "id": 334,
                "status": "failure"
            }]));
            expectations.push(mock('/projects/22/builds', {
                per_page: '1'
            }, [{
                "id": 4711,
                "status": "success"
            }]));
            expectations.push(mock('/projects/23/builds', {
                per_page: '1'
            }, [{
                "id": 66,
                "status": "failure"
            }]));

            execute(block, (output) => {
                //verify server interaction
                expectations.forEach((expectation) => {
                    expectation.verify()
                });

                //check output line
                expect(output.short_text).to.equal(' (2)');
                expect(output.full_text).to.equal(' (2)');

                done();
            });
        });

        it('should handle errors', (done) => {

            //construct block, show only a single project
            var block = new GitlabCi(options, {});

            execute(block, (output) => {
                //check output line
                expect(output.short_text).to.equal('Error: Got response code 404');
                expect(output.full_text).to.equal('Error: Got response code 404');

                done();
            });
        });

    });



})


//copied from i3-status
function execute(block, verify) {
    block.name = block.constructor.name;

    block.on('updated', function(target, output) {
        clearInterval(block.interval);

        expect(target.name).to.equal(block.name);
        verify(output);
    });

    //simulate set interval, will never fire
    block._interval = 10000;
    block.interval = setInterval(() => {
        block.update();
    }, block._interval);

    block.update();
}

function mock(url, params, response) {
    var result;

    if (response) {
        result = server.get(url, {
            json: response
        });
    } else {
        result = server.get(url, {
            status: 404
        });
    }

    return result
        .expect()
        .params(params)
        .header('PRIVATE-TOKEN', 'mySecretToken')
        .once();
}