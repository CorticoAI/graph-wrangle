const path = require('path');
const debug = require('debug')('graph-wrangle:cli');
const util = require('util');
const mkdirp = util.promisify(require('mkdirp'));
const moment = require('moment');
const glob = require('glob');

const GraphWrangle = require('../index');
const io = require('../io');
const layoutCommand = require('./layoutCommand');
const styleCommand = require('./styleCommand');
const drawCommand = require('./drawCommand');
const filterCommand = require('./filterCommand');
const flattenCommand = require('./flattenCommand');
const cleanCommand = require('./cleanCommand');
const transformCommand = require('./transformCommand');

function collect(value, memo) {
  memo.push(value);
  return memo;
}

/**
 * Add the command to the CLI
 */
function addCommand(program) {
  program
    .command('pipeline')
    .option('--config <file>', 'Specify configuration JSON file')
    .option('-i, --input <file>', 'Specify input graph JSON file', collect, [])
    .action(options => {
      debug(`Running pipeline command`);
      pipelineCommand(options);
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
 * Expands tokens in filename
 * [name] -> inputFile basename without extension
 * [timestamp] -> YYYY-MM-DD-HHmmss
 */
function createFilenameExpander(inputFile) {
  let name;
  if (inputFile) {
    name = path.basename(inputFile, '.json');
  } else {
    name = 'graph-wrangle-out';
  }

  const timestamp = moment().format('YYYY-MM-DD-HHmmss');

  return string =>
    string.replace(/\[name\]/gi, name).replace(/\[timestamp\]/gi, timestamp);
}

// convert globs to filenames
function resolveFiles(filesOrGlobs) {
  const results = filesOrGlobs
    .map(fileStr => glob.sync(fileStr))
    .reduce((a, b) => a.concat(b), []);
  return results;
}

/**
 * Run a pipeline of commands based on a configuration
 */
async function pipelineCommand(options) {
  const inputFiles = resolveFiles(options.input);
  const config = loadConfig(options.config);

  if (!config) {
    console.error('No config file found. Exiting');
    return;
  }

  // if there is an output directory, ensure it is created
  let outputDirectory;
  if (config.outputDirectory) {
    outputDirectory = path.resolve(
      createFilenameExpander()(config.outputDirectory)
    );
    debug(`Using output directory ${outputDirectory}`);
    await mkdirp(outputDirectory);
  }

  for (let fileIndex = 0; fileIndex < inputFiles.length; ++fileIndex) {
    const inputFile = inputFiles[fileIndex];
    const expandFilename = createFilenameExpander(inputFile);
    const outerInputFile = inputFile;

    // Persist graph and normalized graph between commands. These will
    // only be overridden if inputFile is passed to the command.
    let graph;
    let normalizedGraph;

    if (inputFile) {
      debug('Reading in graph from specified file ' + inputFile);
      [graph, normalizedGraph] = await loadGraph(inputFile);
    }

    for (let i = 0; i < config.commands.length; ++i) {
      const commandConfig = config.commands[i];
      let {
        command,
        options = {},
        inputFile,
        outputFile,
        formatOutput,
      } = commandConfig;

      if (inputFile) {
        inputFile = expandFilename(inputFile);
      }
      if (outputFile) {
        outputFile = expandFilename(outputFile);
        if (outputDirectory) {
          outputFile = `${outputDirectory}/${outputFile}`;
        }
      }

      // resolve options as a function if provided that way
      if (typeof options === 'function') {
        options = options(fileIndex, inputFile || outerInputFile);
      }

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
          let imageOutput = options.imageOutput;
          if (options.imageOutput) {
            imageOutput = expandFilename(imageOutput);
          } else {
            imageOutput = expandFilename(`[name]_${i}.png`);
          }
          if (outputDirectory) {
            imageOutput = `${outputDirectory}/${imageOutput}`;
          }

          // note we do not update the options object directly since we need it to be in its
          // unmodified state for the next file.
          await drawCommand.run(graph, normalizedGraph, {
            ...options,
            imageOutput,
          });
          break;
        case 'layout':
          await layoutCommand.run(graph, normalizedGraph, options);
          break;
        case 'filter':
          await filterCommand.run(graph, normalizedGraph, options);
          break;
        case 'flatten':
          await flattenCommand.run(graph, normalizedGraph, options);
          break;
        case 'clean':
          await cleanCommand.run(graph, normalizedGraph, options);
          break;
        case 'transform':
          await transformCommand.run(graph, normalizedGraph, options);
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
}

module.exports = {
  run: pipelineCommand,
  add: addCommand,
};
