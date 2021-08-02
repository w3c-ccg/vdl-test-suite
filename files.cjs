/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {join} = require('path');
const {createReadStream, writeFile, readdir, readFile} = require('fs');
const {finished} = require('stream');
const {promisify} = require('util');
const csv = require('csv-parse');

const asyncFinished = promisify(finished);
const asyncReadDir = promisify(readdir);
const asyncWriteFile = promisify(writeFile);
const asyncReadFile = promisify(readFile);

/**
 * Gets the Data dir used to produce certificates.
 *
 * @param {string} path - A path to the who data dir.
 *
 * @throws {Error} - Throws if the dir is not found or is empty.
 *
 * @returns {Promise<Array<string>>} Dir and file names.
*/
async function getDir(path) {
  const directory = await asyncReadDir(path);
  if(directory.length <= 0) {
    throw new Error(`Dir ${path} is empty`);
  }
  return directory;
}

/**
 * Gets all files from a directory.
 *
 * @param {string} path - A path to a directory.
 *
 * @returns {Promise<Array<string>>} Gets files as strings.
 */
async function getDirFiles(path) {
  const dir = await getDir(path);
  const files = await Promise.all(dir.map(
    fileName => asyncReadFile(join(path, fileName), 'utf8')));
  return files;
}

async function getJSONFiles(path) {
  const strings = await getDirFiles(path);
  return strings.map(JSON.parse);
}

/**
 * Gets a CSV file as a stream and then converts the stream to an Array.
 *
 * @param {object} options - Options to use.
 * @param {string} options.path - The path to the csv.
 * @param {object} [options.parser = new csv.Parser()] - A stream CSV parser.
 *
 * @returns {Promise<Array<Array<string>>>} Each row is an array of strings.
 */
async function getCSV({path, parser = new csv.Parser()}) {
  const records = [];
  const fileStream = createReadStream(path).pipe(parser);
  fileStream.on('readable', function() {
    let record = fileStream.read();
    while(record != null) {
      records.push(record);
      record = fileStream.read();
    }
  });
  await asyncFinished(fileStream);
  return records;
}

/**
 * Writes a json file to disc.
 *
 * @param {object} options - Options to use.
 * @param {string} options.path - A path to write to.
 * @param {object} options.data - A JSON Object.
 *
 * @returns {Promise} Resolves on write.
 */
async function writeJSON({path, data}) {
  return asyncWriteFile(path, JSON.stringify(data, null, 2));
}

module.exports = {
  getCSV,
  getDir,
  getDirFiles,
  getJSONFiles,
  writeJSON
};

