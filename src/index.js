'use strict';

import { EventEmitter } from 'events';
import request from 'request';
import defaults from 'lodash.defaultsdeep'


const defaultParameter = {
    colorize: false,
    memberOnly: true,
    success: {
        text: '',
        color: '#00FF00'
    },
    failure: {
        text: '',
        color: '#FF0000'
    },
    report: {
        dots: true,
        showSuccess: false,
        sortByName: false
    }
}

export default class Gitlab extends EventEmitter {
    constructor(givenOptions, output) {
        super();
        const options = defaults(Object.assign({}, givenOptions), defaultParameter);
        this.output = Object.assign({}, output);
        this._cache = {};

        //check if mandatory options are present
        if (!options.url)
            throw new Error('config value url is missing');
        if (!options.token)
            throw new Error('config value token is missing');
        if (!options.projectUrl)
            throw new Error('config value projectUrl is missing');

        //store custom config
        this.project = options.project;
        this.url = options.url;
        this.token = options.token;
        this.projectUrl = options.projectUrl;
        this.success = options.success;
        this.failure = options.failure;
        this.colorize = options.colorize;
        this.memberOnly = options.memberOnly;

        if ((givenOptions.failure && givenOptions.failure.color) || (givenOptions.success && givenOptions.success.color)) {
            this.colorize = true;
        }

        this.report = options.report;
        this.report.userStyle = `.project-green a {color: ${this.success.color}} .project-red a {color: ${this.failure.color}}`;
        this.report.userStyle += '.circle{width: 1em;height: 1em;float: left;border-radius: 50%;margin-right: .5em;}';
        this.report.userStyle += `.circle-green {background: ${this.success.color}} .circle-red  {background: ${this.failure.color}}`;
    }

    update() {
        this.getProjectsToRead(this.project)
            .then(projects => this.readMultipleProjects(projects))
            .then((results) => {
                this.lastResult = results.filter(p => p.build);
                var brokenProjects = results.filter(p => !p.ok);
                this.setOutput(brokenProjects);
            })
            .catch(error => this.handleError(error));
    }

    action(action) {
        if (this.__reporter && this.__reporter.supports('html')) {
            Promise.all(this.lastResult.map(project => this.readProjectDetails(project)))
                .then(projects => this.filterAndSort(projects))
                .then(projects => this.generateHtmlStatus(projects))
                .then(output => this.__reporter.display(output, action));
        }
    }

    setOutput(brokenProjects) {
        const ok = brokenProjects.length == 0;
        var text = ok ? this.success.text : this.failure.text;

        if (!ok && brokenProjects && brokenProjects.length > 1) {
            text += ` (${brokenProjects.length})`;
        }

        //update output
        this.output.full_text = text;
        this.output.short_text = text;

        //set color
        if (this.colorize) {
            this.output.color = ok ? this.success.color : this.failure.color;
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

    getProjectsToRead(config) {
        if (typeof config === 'number') {
            //convert into an array
            return Promise.resolve([config]);
        } else if (Array.isArray(config)) {
            //simply return the config as a promise
            return Promise.resolve(config);
        } else {
            //fetch all available projects
            return this.readAvailableProjects();
        }
    }

    readMultipleProjects(projects) {
        return Promise.all(projects.map(id => this.readProjectBuild(id)));
    }

    readProjectBuild(project) {
        return new Promise((resolve, reject) => {

            request({
                url: `${this.url}/projects/${project}/builds?per_page=1`,
                headers: {
                    'PRIVATE-TOKEN': this.token
                }
            }, (error, response, body) => {
                if (error || response.statusCode != 200) {
                    return reject(error || 'Error: Got response code ' + response.statusCode);
                } else {
                    var result = JSON.parse(body);
                    if (result.length == 0)
                        return resolve({
                            id: project,
                            ok: true,
                            build: false
                        });
                    return resolve({
                        id: project,
                        build: result[0].id,
                        ok: result.length > 0 && (result[0].status == 'success' || result[0].status == 'pending' || result[0].status == 'running'),
                        build: true
                    });
                }
            });
        });
    }

    readAvailableProjects() {
        return new Promise((resolve, reject) => {
            request({
                url: `${this.url}/projects/?simple=true&page=1&per_page=999999&member=${this.memberOnly}`,
                headers: {
                    'PRIVATE-TOKEN': this.token
                }
            }, (error, response, body) => {
                if (error || response.statusCode != 200) {
                    return reject(error || 'Error: Got response code ' + response.statusCode);
                } else {
                    var result = JSON.parse(body);
                    //reduce to array of project ids.
                    return resolve(result.map(project => project.id));
                }
            });
        });
    }



    /**
     * read full project name and url from api for a given project.id
     */
    readProjectDetails(project) {
        return this.readProjectDetailsFromApi(project.id)
            .then(result => Promise.resolve(
                Object.assign(project, {
                    project: result.name_with_namespace,
                    url: result.web_url
                })
            ));
    }

    readProjectDetailsFromApi(project) {
        const cache = this._cache;

        return new Promise((resolve, reject) => {
            var result = cache[project];
            if (result) return resolve(result);

            request({
                url: `${this.url}/projects/${project}`,
                headers: {
                    'PRIVATE-TOKEN': this.token
                }
            }, (error, response, body) => {
                if (error || response.statusCode != 200) {
                    return reject(error || 'Error: Got response code ' + response.statusCode);
                } else {
                    var result = JSON.parse(body);
                    cache[project] = result;
                    return resolve(result);
                }
            });
        });
    }

    filterAndSort(projects) {
        // filter out projects without any build informations
        var result =  projects.filter(p => p.build);

        // filter out successful builds unless showSuccess is configured
        if (!this.report.showSuccess)
            result = result.filter(p => !p.ok);

        if (this.report.sortByName)
            result = result.sort((p1, p2) => p1.project.localeCompare(p2.project));

        return Promise.resolve(result);

    }

    generateHtmlStatus(results) {
        return new Promise((resolve, reject) => {

            var header = this.report.showSuccess ? `Builds on ${this.projectUrl}` : `Failed builds on ${this.projectUrl}`;
            var projects = results;


            //build html content
            var content = '<ul>';
            content += projects
                .map(project => this.getHtml(project))
                .join('');
            content += '</ul>'

            return resolve({
                header: header,
                content: content,
                userStyle: this.report.userStyle
            });

        });
    }

    getHtml(project) {
        var state = project.ok ? 'green' : 'red';

        if (this.report.dots)
            return `<li><div class="circle circle-${state}"></div><a href="${project.url}">${project.project}</a></li>`;
        else
            return `<li class="project-${state}"><a href="${project.url}">${project.project}</a></li>`;

    }

}
