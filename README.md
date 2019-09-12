# taglog

![npm](https://img.shields.io/npm/v/@giovanebribeiro/taglog.svg)

A tool to generate git tags with messages based on git commits since last tag

## Installation

`$ npm install --save-dev @giovanebribeiro/taglog`

## Configuration and usage

The recommended usage for this package is with [npm-version](https://docs.npmjs.com/cli/version) with `--no-git-tag-version` flag,
because our goal is replace the git tag creation of npm-version and use ours. To do so, we add some configurations in package.json 
file:

```json

{
 ...
 "taglog": {
    "lineFormat": "* %h %s                       // the line format for 'git-log --pretty'. This is the default option",
    "tagPrefix": "v                              // the tag prefix. This is the default option.",
    "tagTitle": "Custom release version title %s // some custom title for the tag message. '%s' is replaced by the new tag name. The default option is: 'Release version <new_tag_name>'"
  },
  "scripts": {
    "build": "npm version --no-git-tag-version ",
    "version": "git commit -am \"build: release version\" && taglog $npm_package_version",
    "postversion": "git push --follow-tags"
  },
}
  
```

And, to bump the version, create the tag and push, use: `npm run build -- patch|minor|major`

As final result, the git log message will have all the commits between previous tag and actual tag:

```
$ git for-each-ref --sort=-taggerdate --count=1 --format '%(refname) (%(taggerdate))\n===\n\n%(subject)\n\n%(body)' refs/tags
refs/tags/v0.1.0 (Thu Sep 12 14:22:10 2019 -0300)
===

Release version 0.1.0

build: release version
refactor: improvements to better readability
feat: add commit parser support
package.json update without pattern
build: package.json adjustments and package-cleaning
build: adjustments on commit preset
feat: add conventionalChangelog support
build: release version

$ 
```

To other infos: `taglog --help`
