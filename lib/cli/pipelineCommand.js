const debug = require('debug')('graph-wrangle:cli');
const GraphWrangle = require('../index');
const { ioCommand } = require('./util');
const path = require('path');

const layoutCommand = require('./layoutCommand');
const styleCommand = require('./styleCommand');
const drawCommand = require('./drawCommand');

function addCommand(program) {
  program
    .command('pipeline')
    .option('--config <file>', 'Specify configuration JSON file')
    .action(options => {
      debug(`Running pipeline command`);
      pipelineCommand(options.config);
    });
}

function loadConfig(configFile) {
  const configFileNames = [
    'graph-wrangle.config.json',
    'graph-wrangle.config.js',
  ];

  let config;

  // if provided a filename explicitly, use it
  if (configFile) {
    debug('Load config ' + configFile);
    config = require(path.resolve(configFile));
  } else {
    // otherwise, try to load a default filename
    for (const filename of configFileNames) {
      try {
        debug('Attempt to load config ' + filename);
        config = require(path.resolve(filename));
        debug('Successfully loaded config from ' + filename);
        if (config) {
          break;
        }
      } catch (e) {
        /* ignore failing to load files */
      }
    }
  }

  return config;
}

function pipelineCommand(configFile) {
  const config = loadConfig(configFile);

  if (!config) {
    console.error('No config file found. Exiting');
    return;
  }

  config.commands.forEach(({ command, config }) => {
    switch (command) {
      case 'style':
        console.log('do style', config);
        break;
      case 'draw':
        console.log('do - draw', config);
        break;
      case 'layout':
        console.log('do -- layout', config);
        break;
    }
  });
}

module.exports = {
  run: pipelineCommand,
  add: addCommand,
};
