#!/usr/bin/env node
'use strict';

const index = require('./index.js');
const meow = require('meow');

const cli = meow(`
  Usage:
    $ taglog <new_git_tag>

  Example:
    $ taglog 1.0.0
    Processing 1.0.0 tag...
    Tag 1.0.0 successfully created
  `, {});

index(cli.input)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Unexpected error: ' + err);
    process.exit(1);
  });
