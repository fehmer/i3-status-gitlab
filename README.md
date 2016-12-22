# i3-status-gitlab

Build status monitor for gitlab-ci and i3-status.

[![npm version](https://badge.fury.io/js/i3-status-gitlab.svg)](https://badge.fury.io/js/i3-status-gitlab)
[![Dependency Status](https://gemnasium.com/badges/github.com/fehmer/i3-status-gitlab.svg)](https://gemnasium.com/github.com/fehmer/i3-status-gitlab)
[![Build Status](https://travis-ci.org/fehmer/i3-status-gitlab.svg?branch=master)](https://travis-ci.org/fehmer/i3-status-gitlab)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/697ad1955c8d4ebb86650c5ac5e6603c)](https://www.codacy.com/app/fehmer/i3-status-gitlab?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=fehmer/i3-status-gitlab&amp;utm_campaign=Badge_Coverage)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/a52f41f904b24aac8807bb8ecb3dbec0)](https://www.codacy.com/app/fehmer/i3-status-gitlab?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=fehmer/i3-status-gitlab&amp;utm_campaign=Badge_Grade)


This module for [i3-status](https://www.npmjs.com/package/i3-status) displays the build status from your [Gitlab Ci Server](https://www.gitlab.com/) projects. Projects without builds or pending or running builds will be ignored.


## Table of content
<!-- MarkdownTOC -->

- [Installation](#installation)
- [Example configurations](#example-configurations)
  - [Show build status for all accessible projects](#show-build-status-for-all-accessible-projects)
  - [Show build status for a single project](#show-build-status-for-a-single-project)
  - [Show build status for a set of projects](#show-build-status-for-a-set-of-projects)
- [Configuration values](#configuration-values)
  - [url](#url)
  - [token](#token)
  - [color](#color)
  - [status](#status)

<!-- /MarkdownTOC -->


## Installation

``` sh
cd ~/my-i3-status   # go to the directory you installed i3-status in
npm install --save i3-status-gitlab
```


## Example configurations

You need to provide the url to your gitlab server and a private token. See [token config](#token) how to retrieve your private token.

### Show build status for all accessible projects

This config will show the status of all projects you can access with the gitlab token you provided.

``` yaml
  - name: gitlab
    module: i3-status-gitlab
    label: ci
    url: https://git.yourserver.tld/api/v3
    token: 'secretToken'   #see below how to get one
```


### Show build status for a single project

This config will show the status of a single project only. If you want to determine the project id for your project login to your gitlab server and open ```https://git.yourserver.tld/api/v3/projects/?simple=true``` in a browser and search for your project name.

``` yaml
  - name: gitlab
    module: i3-status-gitlab
    label: 'Project A'
    url: https://git.yourserver.tld/api/v3
    token: 'secretToken'   #see below how to get one
    project: 23          #change to your project id
```



### Show build status for a set of projects

This config will show the status of multiple projects. If you want to determine the project id for your project login to your gitlab server and open ```https://git.yourserver.tld/api/v3/projects/?simple=true``` in a browser and search for your project name.

``` yaml
  - name: gitlab
    module: i3-status-gitlab
    label: 'ci'
    url: https://git.yourserver.tld/api/v3
    token: 'secretToken'   #see below how to get one
    project:
      - 23               #change to your project ids
      - 24
      - 25
```


## Configuration values


### url

*mandatory*. Provide the URL of your gitlab server api, e.g. ```https://git.yourserver.tld/api/v3```. The url should not end with a slash.


### token

*mandatory*. You need to register a private token for this module. Login to your gitlab server and open the *profile settings*. Under access tokens create a new personal access token with a name like *i3-status*.


### color

When you activate the color option with ```color: true``` a successful build state is shown in green and a failed build state in red. 

You can define the colors for successful and failed builds:

``` yaml
    color:
      success: '#AAFFAA'
      failure: '#FFAAAA'
```


### status

You can define the texts for successful and failed builds. The default is **** for successful and **** for failed builds.

``` yaml
    status:
      success: all systems are go
      failure: hudson, we have a problem
```

