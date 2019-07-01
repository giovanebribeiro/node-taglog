'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const ce = require('command-exists').sync;
const debug = require('debug')('taglog:index.js');
const path = require('path');
const readPkg = require('read-pkg');
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

async function generateChangelog(lineFormat){
  let lastTag = await execCommand('git describe --tags --abbrev=0');
  lastTag = lastTag.trim();
  debug('lastTag: ', lastTag);
  
  const changelog = await execCommand('git log --pretty=format:\"' + lineFormat + '\" ' + lastTag + '..HEAD');
  debug(`changelog: ${changelog}`);

  return changelog;
}

async function mountTagMessage(tagTitle, changelog, convChangelogPreset){
  let nLine = '\n';
  if(process.platform === 'win32') nLine = '\r' + nLine;
  
  let tagMessage = tagTitle + nLine + nLine;
  tagMessage += changelog;
  tagMessage += nLine;
  debug('tagMessage = \n', tagMessage);

  const tempFile = './.' + uuid();

  let stderr = await writeFile(tempFile, tagMessage);
  if(stderr){
    throw new Error('Some error happened during git tag message process: ${stderr}');
  }
  
  return tempFile;
}

async function main(argv){

  if(!ce('git')){
    throw new Error('Git is not installed. Please install git to use this package properly');
  }

  const actualTag = argv[0];
  const scriptPath = __dirname;
  console.log(`Processing ${actualTag} tag...`);
 
  if(!actualTag) throw new Error('The actual tag is required.');
  debug('actualTag = ', actualTag);

  const pkgPath = path.resolve(scriptPath.split('node_modules')[0]);
  debug('pkgPath = ', pkgPath);
  var pkg = {};
  try{
    pkg = readPkg.sync(pkgPath, { normalize: false }); // test if package.json exists
  } catch(err){
    if(err.code !== 'ENOENT'){
      throw err;
    }
  }
  
  const options = pkg.taglog || {}; 
  debug('options object = ', options);

  const lineFormat = options.lineFormat || '* %h %s';
  const tagPrefix = options.tagPrefix || 'v';
  let tagTitle = options.tagTitle || 'Release version ' + actualTag;

  const changelog = await generateChangelog(lineFormat);

  debug(`tagTitle before: ${tagTitle}`);
  tagTitle = tagTitle.replace(/%s/g, actualTag); // replace all occurences
  debug(`tagTitle after: ${tagTitle}`);

  const tempFile = await mountTagMessage(tagTitle, changelog, options.commitPreset);
  /*await execCommand('git tag -a ' + tagPrefix + actualTag + ' --file=' + tempFile);

  // remove the file
  let stderr = await deleteFile(tempFile);
  if(stderr){
    throw new Error('Some error happened during git tag message process: ${stderr}');
  }*/

  console.log(`Tag ${actualTag} successfully created...`);
}

module.exports = main;
