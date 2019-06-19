'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const ce = require('command-exists').sync;

async function main(){
  
  if(!ce('git')){
    throw new Error('Git is not installed. Please install git to use this package properly');
  }

  const { stdout, stderr } = await exec('git describe --tags --abbrev=0');

  if(stderr){
    throw new Error('Error to execute git command: ${stderr}');
  }

  console.log('command stdout: ' + stdout);
}

main();
