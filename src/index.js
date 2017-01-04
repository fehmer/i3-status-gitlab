'use strict';

import { EventEmitter } from 'events';
import request from 'request';

export default class Gitlab extends EventEmitter {
    constructor(givenOptions, output) {
        super();
        var options = Object.assign({}, givenOptions || {});
        options.success = options.success || {};
        options.failure = options.failure || {};

        this.output = output || {};


        //check if mandatory options are present
        if (!options.url)
            throw new Error('config value url is missing');
        if (!options.token)
            throw new Error('config value token is missing');

        //store custom config
        this.project = options.project;
        this.url = options.url;
        this.token = options.token;

        //use given status text or use defaults
        this.status = {
            success: options.success.text || '',
            failure: options.failure.text || ''
        }

        //if colorize=true or colors defined use them
        if (options.colorize || options.success.color || options.failure.color) {
            this.color = {
                success: options.success.color || '#00FF00',
                failure: options.failure.color || '#FF0000'
            }
        } else {
            //don't use any colors if color is false or not defined
            this.color = false;
        }
    }

    update() {
        if (typeof this.project === 'number') {
            //read only one project
            this.readProjectBuild(this.project)
                .then((result) => {
                    this.setOutput(result.ok);
                })
                .catch(error => {
                    this.handleError(error);
                });
        } else if (Array.isArray(this.project)) {
            //read build for each project
            this.readMultipleProjects(this.project);
        } else {
            //retrieve all available projects
            this.readAvailableProjects()
                .then((projects) => {
                    this.readMultipleProjects(projects)
                })
                .catch(error => {
                    this.handleError(error);
                });
        }
    }

    setOutput(ok, brokenProjects) {
        var text = ok ? this.status.success : this.status.failure;

        if (!ok && brokenProjects && brokenProjects.length > 1) {
            text = text + ' (' + brokenProjects.length + ')';
        }

        //update output
        this.output.full_text = text;
        this.output.short_text = text;

        //set color
        if (this.color) {
            this.output.color = ok ? this.color.success : this.color.failure;
        }

        //emit updated event to i3Status
        this.emit('updated', this, this.output);
    }

    handleError(error) {
        //update output
        this.output.full_text = error;
        this.output.short_text = error;

        //emit updated event to i3Status
        this.emit('updated', this, this.output);
    }

    readProjectBuild(project) {
        return new Promise((resolve, reject) => {

            request({
                url: this.url + '/projects/' + project + '/builds?per_page=1',
                headers: {
                    'PRIVATE-TOKEN': this.token
                }
            }, (error, response, body) => {
                if (error || response.statusCode != 200) {
                    reject(error || 'Error: Got response code ' + response.statusCode);
                } else {
                    var result = JSON.parse(body);
                    if (result.length == 0)
                        return resolve({
                            id: project,
                            ok: true
                        });
                    return resolve({
                        id: project,
                        build: result[0].id,
                        ok: result.length > 0 && (result[0].status == 'success' || result[0].status == 'pending' || result[0].status == 'running')
                    });
                }
            });
        });
    }

    readMultipleProjects(projects) {
        var calls = new Array();
        projects.forEach((id) => {
            calls.push(this.readProjectBuild(id));
        });

        //wait for all promises
        Promise
            .all(calls)
            .then((results) => {
                var brokenProjects = new Array(0);

                results.forEach((project) => {
                    if (!project.ok) {
                        brokenProjects.push(project);
                    }
                });

                this.setOutput(brokenProjects.length == 0, brokenProjects);

            })
            .catch(error => {
                this.handleError(error);
            });
    }

    readAvailableProjects() {
        return new Promise((resolve, reject) => {

            request({
                url: this.url + '/projects/?simple=true',
                headers: {
                    'PRIVATE-TOKEN': this.token
                }
            }, (error, response, body) => {
                if (error || response.statusCode != 200) {
                    reject(error || 'Error: Got response code ' + response.statusCode);
                } else {
                    var result = JSON.parse(body);
                    //reduce to array of project ids.
                    resolve(result.map((project) => {
                        return project.id;
                    }));
                }
            });
        });
    }

}
