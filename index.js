'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const ce = require('command-exists').sync;
const debug = require('debug')('taglog:index.js');
const path = require('path');
const readPkg = require('read-pkg');
const explorer = require('cosmiconfig')('taglog');
const uuid = require('uuid/v1');
const fs = require('fs');
const writeFile = util.promisify(fs.writeFile);
const deleteFile = util.promisify(fs.unlink);

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
  
  if(!actualTag) throw new Error('The actual tag is required.');
  debug('actualTag = ', actualTag);

  const options = explorer.searchSync(pkgPath).config || {}; 
  debug('options object = ', options);

  const lineFormat = options.lineFormat || '* %h %s';
  const output = options.outputType || 'tag'
  const tagPrefix = options.tagPrefix || 'v';
  let tagTitle = options.tagTitle || 'Release version ' + actualTag;

  debug(`tagTitle before: ${tagTitle}`);
  tagTitle = tagTitle.replace(/%s/g, actualTag); // replace all occurences
  debug(`tagTitle after: ${tagTitle}`);

  console.log(`Processing ${actualTag} tag...`);

  let nLine = '\n';
  if(process.platform === 'win32') nLine = '\r' + nLine;
  
  if(!ce('git')){
    throw new Error('Git is not installed. Please install git to use this package properly');
  }

  let lastTag = await execCommand('git describe --tags --abbrev=0');
  lastTag = lastTag.trim();
  debug('lastTag: ', lastTag);
  
  const changelog = await execCommand('git log --pretty=format:\'' + lineFormat + '\' ' + lastTag + '..HEAD');
  debug(`changelog: ${changelog}`);

  let tagMessage = 'Release Version ' + actualTag + nLine + nLine;
  tagMessage += changelog;
  tagMessage += nLine;
  debug('tagMessage = \n', tagMessage);

  if(output === 'tag'){
    const tempFile = './.' + uuid();
    
    let stderr = await writeFile(tempFile, tagMessage);
    if(stderr){
      throw new Error('Some error happened during git tag message process: ${stderr}');
    }

    await execCommand('git tag -a ' + tagPrefix + actualTag + ' --file=' + tempFile);

    // remove the file
    stderr = await deleteFile(tempFile);
    if(stderr){
      throw new Error('Some error happened during git tag message process: ${stderr}');
    }
  
    console.log(`Tag ${actualTag} successfully created...`);
  }
  
}

module.exports = main;
