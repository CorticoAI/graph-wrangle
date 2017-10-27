const path = require('path');
const debug = require('debug')('graph-wrangle:cli');

const GraphWrangle = require('../index');
const io = require('../io');
const layoutCommand = require('./layoutCommand');
const styleCommand = require('./styleCommand');
const drawCommand = require('./drawCommand');

/**
 * Add the command to the CLI
 */
function addCommand(program) {
  program
    .command('pipeline')
    .option('--config <file>', 'Specify configuration JSON file')
    .action(options => {
      debug(`Running pipeline command`);
      pipelineCommand(options.config);
    });
}

/**
 * Load a config file. Uses the passed in filename otherwise
 * tries default options.
 */
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

/**
 * Load a graph from a file or stdin and normalize it
 */
async function loadGraph(inputFile) {
  // read in the inputFile graph
  let graph;
  try {
    // read from a file if specified, otherwise stdin
    if (inputFile) {
      const inputPath = path.resolve(inputFile);
      graph = await io.loadGraph(inputPath);
    } else {
      graph = await io.loadGraphFromStdIn();
    }
  } catch (e) {
    console.error('Error reading input graph:', e.message);
    return;
  }

  // since graph layouts tend to be destructive to the nodes, let's use a copy of them.
  // also ensure links are expanded and meta data has all expected fields
  const normalizedGraph = GraphWrangle.normalizeGraph(graph);

  return [graph, normalizedGraph];
}

/**
 * Write a graph to a file or to stdout
 */
function writeGraph(outputFile, graph, format) {
  if (outputFile) {
    const outputPath = path.resolve(outputFile);
    try {
      io.writeGraph(outputPath, graph, format);
    } catch (e) {
      console.error('Error writing output file:', e.message);
      return;
    }
  } else {
    // write to STD OUT
    console.log(JSON.stringify(graph));
  }
}

/**
 * Run a pipeline of commands based on a configuration
 */
async function pipelineCommand(configFile) {
  const config = loadConfig(configFile);

  if (!config) {
    console.error('No config file found. Exiting');
    return;
  }

  // Persist graph and normalized graph between commands. These will
  // only be overridden if inputFile is passed to the command.
  let graph;
  let normalizedGraph;

  for (const commandConfig of config.commands) {
    const {
      command,
      options,
      inputFile,
      outputFile,
      formatOutput,
    } = commandConfig;

    // read from inputfile or stdin if not already set
    if (inputFile || graph == null) {
      debug('Reading in graph from ' + (inputFile || 'stdin') + '...');
      [graph, normalizedGraph] = await loadGraph(inputFile);
    }

    switch (command) {
      case 'style':
        await styleCommand.run(graph, normalizedGraph, options);
        break;
      case 'draw':
        await drawCommand.run(graph, normalizedGraph, options);
        break;
      case 'layout':
        await layoutCommand.run(graph, normalizedGraph, options);

        break;
      default:
        console.error('Unsupported command: ' + command);
    }

    if (outputFile) {
      debug(`Writing graph to file ${outputFile}...`);
      writeGraph(outputFile, graph, formatOutput);
    }
  }
}

module.exports = {
  run: pipelineCommand,
  add: addCommand,
};
