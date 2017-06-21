'use strict';

import { expect } from 'chai';
import server from 'mockyeah';
import GitlabCi from './../lib/index';
import request from 'request';

const options = {
    projectUrl: 'http://localhost',
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
            expect(block.success.text).to.equal('');
            expect(block.failure.text).to.equal('');

            //expect color to be false
            expect(block.colorize).to.be.false;

            //report defaults
            expect(block.report.dots).to.be.true;
            expect(block.report.showSuccess).to.be.false;
            expect(block.report.sortByName).to.be.false;
        });

        it('should use custom status', () => {
            //use a config with custom status texts
            var config = Object.assign({}, options, {
                success: {
                    text: 'OK'
                },
                failure: {
                    text: 'DOOMED'
                }
            });

            //construct block
            var block = new GitlabCi(config);

            //expect the custom status texts to be set
            expect(block.success.text).to.equal('OK');
            expect(block.failure.text).to.equal('DOOMED');
        });

        it('should use default colors if enabled', () => {
            //enable colors in config
            var config = Object.assign({}, options, {
                colorize: true
            });

            //construct block
            var block = new GitlabCi(config);

            //check colors
            expect(block.success.color).to.equal('#00FF00');
            expect(block.failure.color).to.equal('#FF0000');
        });

        it('should use custom colors', () => {
            //enable colors in config
            var config = Object.assign({}, options, {
                success: {
                    color: '#88FF88'
                },
                failure: {
                    color: '#FF8888'
                }

            });

            //construct block
            var block = new GitlabCi(config);

            //check colors
            expect(block.success.color).to.equal('#88FF88');
            expect(block.failure.color).to.equal('#FF8888');
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
                simple: 'true',
                page: '1',
                per_page: '999999',
                member: 'true'
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
                simple: 'true',
                page: '1',
                per_page: '999999',
                member: 'true'
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

        it('should handle all projects', (done) => {

            //construct block
            var config = Object.assign({}, options, {
                membersOnly: false
            });
            var block = new GitlabCi(config, {});

            //prepare mock responses
            const expectations = new Array(4);

            expectations.push(mock('/projects/', {
                simple: 'true',
                page: '1',
                per_page: '999999',
                member: 'true'
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


    describe('generateHtmlStatus', function() {
        const prepResults = [
            {
                id: 1,
                build: true,
                ok: false,
                url: 'http://example.org/1',
                project: 'Success Build Example 1'
            },
            {
                id: 2,
                build: true,
                ok: true,
                url: 'http://example.org/2',
                project: 'Example 2'
            }];

        const baseConfig = {
            projectUrl: 'http://example.org',
            success: {
                color: 'green'
            },
            failure: {
                color: 'red'
            }
        };

        it('should print with dots', (done) => {
            //construct block
            var config = Object.assign({}, options, baseConfig);

            var block = new GitlabCi(config);

            var html = block.generateHtmlStatus(prepResults);
            html.then(output => {
                expect(output.header).to.equal('Failed builds on http://example.org');
                expect(output.userStyle).to.equal('.project-green a {color: green} .project-red a {color: red}.circle{width: 1em;height: 1em;float: left;border-radius: 50%;margin-right: .5em;}.circle-green {background: green} .circle-red  {background: red}');
                expect(output.content).to.equal('<ul><li><div class="circle circle-red"></div><a href="http://example.org/1">Success Build Example 1</a></li><li><div class="circle circle-green"></div><a href="http://example.org/2">Example 2</a></li></ul>');

                done();
            });
        });

        it('should not print dots if configured', (done) => {
            //construct block
            var config = Object.assign({}, options, baseConfig, {
                report: {
                    dots: false
                }
            });

            var block = new GitlabCi(config);

            var html = block.generateHtmlStatus(prepResults);
            html.then(output => {
                expect(output.header).to.equal('Failed builds on http://example.org');
                expect(output.userStyle).to.equal('.project-green a {color: green} .project-red a {color: red}.circle{width: 1em;height: 1em;float: left;border-radius: 50%;margin-right: .5em;}.circle-green {background: green} .circle-red  {background: red}');
                expect(output.content).to.equal('<ul><li class="project-red"><a href="http://example.org/1">Success Build Example 1</a></li><li class="project-green"><a href="http://example.org/2">Example 2</a></li></ul>');


                done();
            });

        });

    });


    describe('filterAndSort', function() {
        const prepResults = [
            {
                id: 1,
                build: true,
                ok: false,
                project: 'Non Good Project'
            },
            {
                id: 2,
                build: true,
                ok: true,
                project: 'Build Sucessfull'
            },
            {
                id: 2,
                build: false,
                ok: true
            }];


        it('filter out all successfull projects and projects without build', (done) => {
            //construct block
            var config = Object.assign({}, options);

            var block = new GitlabCi(config);

            block.filterAndSort(prepResults)
                .then(result => {
                    expect(result).to.have.lengthOf(1);
                    expect(result[0].id).to.equal(1);
                    done();
                })
        });

        it('filter out projects without build', (done) => {
            //construct block
            var config = Object.assign({}, options, {
                report: {
                    showSuccess: true
                }
            });

            var block = new GitlabCi(config);

            block.filterAndSort(prepResults)
                .then(result => {
                    expect(result).to.have.lengthOf(2);
                    expect(result[0].id).to.equal(1);
                    expect(result[1].id).to.equal(2);
                    done();
                })
        });

        it('filter out projects without build and sort by project name', (done) => {
            //construct block
            var config = Object.assign({}, options, {
                report: {
                    showSuccess: true,
                    sortByName: true
                }
            });

            var block = new GitlabCi(config);

            block.filterAndSort(prepResults)
                .then(result => {
                    expect(result).to.have.lengthOf(2);
                    expect(result[0].id).to.equal(2);
                    expect(result[1].id).to.equal(1);
                    done();
                })
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