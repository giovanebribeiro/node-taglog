'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const ce = require('command-exists').sync;
const debug = require('debug')('taglog:index.js');
const path = require('path');
const readPkg = require('read-pkg');
const explorer = require('cosmiconfig')('taglog');
const spawn = require('child_process').spawn;

async function execCommand(cmd){
  debug('run command: ', cmd)
  const { stdout, stderr } = await exec(cmd);

  if(stderr){
    throw new Error('Error to execute command: ${stderr}');
  }

  return stdout;
}

async function main(argv){

  const actualTag = argv[0];
  const scriptPath = __dirname;

  const pkgPath = path.resolve(scriptPath.split('node_modules')[0]);
  debug('pkgPath = ', pkgPath);
  try{
    readPkg.sync(pkgPath, { normalize: false }); // test if packa.json exists
  } catch(err){
    if(err.code !== 'ENOENT'){
      throw err;
    }
  }

  const options = explorer.searchSync(pkgPath) || {}; 
  debug('options object = ', options);

  const lineFormat = options.format || '* %h %s';
  const output = options.output || 'tag'
  const tagPrefix = options.tagPrefix || 'v';

  if(!actualTag) throw new Error('The actual tag is required.');
  debug('actualTag = ', actualTag);

  let nLine = '\n';
  if(process.platform === 'win32') nLine = '\r' + nLine;
  
  if(!ce('git')){
    throw new Error('Git is not installed. Please install git to use this package properly');
  }

  let lastTag = await execCommand('git describe --tags --abbrev=0');
  lastTag = lastTag.trim();
  debug('lastTag: ', lastTag);
  
  const changelog = await execCommand('git log --pretty=format:\'' + lineFormat + '\' ' + lastTag + '..HEAD');
  debug('changelog: ', changelog);

  let tagMessage = '# Release Version ' + actualTag + nLine + nLine;
  tagMessage += changelog;
  debug('tagMessage = \n', tagMessage);

  if(output === 'tag'){
    const echoMessage = spawn('shx', ['echo', tagMessage]);
    const gitTag = spawn('git', ['tag', tagPrefix + actualTag, '-a', '-F', ' - ']);

    echoMessage.stdout.pipe(gitTag.stdin);
  }
}

module.exports = main;
//main(null, '0.0.1');
