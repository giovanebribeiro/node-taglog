'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const ce = require('command-exists').sync;
const debug = require('debug')('taglog:index.js');

async function execCommand(cmd){
  debug('run command: ', cmd)
  const { stdout, stderr } = await exec(cmd);

  if(stderr){
    throw new Error('Error to execute command: ${stderr}');
  }

  return stdout;
}

async function main(options){

  if(!options) options = {};
  const lineFormat = options.format || '%h %s';
  
  if(!ce('git')){
    throw new Error('Git is not installed. Please install git to use this package properly');
  }

  const lastTag = await execCommand('git describe --tags --abbrev=0');
  lastTag = lastTag.trim();
  debug('lastTag: ', lastTag);
  
  const changelog = await execCommand('git log --pretty=format:\'' + lineFormat + '\' ' + lastTag + '..HEAD');
  debug('changelog: ', changelog);
}

main();
