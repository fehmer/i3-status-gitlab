# i3-status-gitlab

Build status monitor for gitlab-ci and i3-status.

[![npm version](https://img.shields.io/npm/v/i3-status-gitlab.svg?style=flat-square)](https://www.npmjs.com/package/i3-status-gitlab)
[![Dependency Status](https://img.shields.io/gemnasium/fehmer/i3-status-gitlab.svg?style=flat-square)](https://gemnasium.com/github.com/fehmer/i3-status-gitlab)
[![Build Status](https://img.shields.io/travis/fehmer/i3-status-gitlab.svg?style=flat-square)](https://travis-ci.org/fehmer/i3-status-gitlab)
[![Codacy Badge](https://img.shields.io/codacy/grade/697ad1955c8d4ebb86650c5ac5e6603c.svg?style=flat-square)](https://www.codacy.com/app/fehmer/i3-status-gitlab?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=fehmer/i3-status-gitlab&amp;utm_campaign=Badge_Grade)
[![Codacy Badge](https://img.shields.io/codacy/coverage/697ad1955c8d4ebb86650c5ac5e6603c.svg?style=flat-square)](https://www.codacy.com/app/fehmer/i3-status-gitlab?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=fehmer/i3-status-gitlab&amp;utm_campaign=Badge_Coverage)


This module for [i3-status](https://www.npmjs.com/package/i3-status) displays the build status from your [Gitlab Ci Server](https://www.gitlab.com/) projects. Projects without builds or pending or running builds will be ignored.


## Table of content
<!-- MarkdownTOC -->

- [Installation](#installation)
- [Example configurations](#example-configurations)
  - [Show build status for all accessible projects](#show-build-status-for-all-accessible-projects)
  - [Show build status for a single project](#show-build-status-for-a-single-project)
  - [Show build status for a set of projects](#show-build-status-for-a-set-of-projects)
  - [How to determine the projects id](#how-to-determine-the-projects-id)
- [Configuration values](#configuration-values)
  - [projectUrl](#projecturl)
  - [url](#url)
  - [token](#token)
  - [project](#project)
  - [memberOnly](#memberonly)
- [Modify the output](#modify-the-output)
- [Modify the reporter](#modify-the-reporter)

<!-- /MarkdownTOC -->


## Installation

``` sh
cd ~/my-i3-status   # go to the directory you installed i3-status in
npm install --save i3-status-gitlab
```


## Example configurations

You need to provide the url to your gitlab server and a private token. See [token config](#token) how to retrieve your private token.

### Show build status for all accessible projects

This config will show the status of all projects you can access and are a member of with the gitlab token you provided.

``` yaml
  - name: gitlab
    module: i3-status-gitlab
    interval: 300 # refresh each 5 minutes
    label: ci
    projectUrl: https://git.yourserver.tld
    url: https://git.yourserver.tld/api/v3
    token: 'secretToken'   #see below how to get one
```

If you want to show all projects you have read access to define:

``` yaml
  - name: gitlab
    module: i3-status-gitlab
    [...]
    memberOnly: false
```


### Show build status for a single project

This config will show the status of a single project only.

``` yaml
  - name: gitlab
    module: i3-status-gitlab
    interval: 300 # refresh each 5 minutes
    label: 'Project A'
    projectUrl: https://git.yourserver.tld
    url: https://git.yourserver.tld/api/v3
    token: 'secretToken'   #see below how to get one
    project: 23          #change to your project id
```



### Show build status for a set of projects

This config will show the status of multiple projects. 

``` yaml
  - name: gitlab
    module: i3-status-gitlab
    interval: 300 # refresh each 5 minutes
    label: 'ci'
    projectUrl: https://git.yourserver.tld
    url: https://git.yourserver.tld/api/v3
    token: 'secretToken'   #see below how to get one
    project:
      - 23               #change to your project ids
      - 24
      - 25
```


### How to determine the projects id

Login to your gitlab server and open ```https://git.yourserver.tld/api/v3/projects/?simple=true&page=1&per_page=999999``` in a browser. Then search for your project name and find the "id": text in front of the search result.


## Configuration values

Common configuration values like label and interval are described in the [i3-status documentation](https://github.com/fehmer/i3-status/blob/master/docs/configuration.md)



### projectUrl

*mandatory*. Provide the URL of your gitlab server start page.


### url

*mandatory*. Provide the URL of your gitlab server api, e.g. ```https://git.yourserver.tld/api/v3```. The url should not end with a slash.


### token

*mandatory*. You need to register a private token for this module. Login to your gitlab server and open the *profile settings*. Under access tokens create a new personal access token with a name like *i3-status*.

The token allows access to your projects on gitlab. You should encrypt the value to make more secure. The [i3-status documentation](https://github.com/fehmer/i3-status#a-note-on-security) tells you how to do this.


### project

Project can be

- empty. In this case all projects you have access to are monitored. You can use the [memberOnly flag](#memberOnly) to only show projects you are a member 
 of.
- single [id](#how-to-determine-the-projects-id). Only one specific project is monitored
- list of [ids](#how-to-determine-the-projects-id). All specified projects are monitored.


### memberOnly

This flag is only used if you don't specify any value for ```project```. Instead of reading all accessible projects only the projects you are a member of are read. Default is ```false```. 


## Modify the output 

When you activate the colorize option a successful build state is shown in green and a failed build state in red. 

``` yaml
    colorize: true
```


You can define the texts and colors for successful and failed builds.
The default text is **** for successful and **** for failed builds.

``` yaml
    success:
      color: '#AAFFAA'
      text: all systems are go
    failure:
      color: '#FFAAAA'
      text: hudson, we have a problem
```


## Modify the reporter

If you click on the status a popup will appear (if you added the i3-status-reporter-html, see i3-status documentation). You can modify the output of the reporter. The following example will show all build projects ordered by the projects name.

``` yaml
    report:
      dots: true        # display circles in front of the projects name, default = true
      showSuccess: true # show failed and successfull builds, default = false
      sortByName: true  # sort the projects by name, default = false
```


