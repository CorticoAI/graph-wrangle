const path = require('path');

const GraphWrangle = require('../index');
const io = require('../io');
const debug = require('debug')('graph-wrangle:cli');

/**
 * Wrapper for commands that reads a graph, runs a command, then writes
 * the modified graph.
 */
async function ioCommand(command, options) {
  let { config } = options;

  if (config) {
    config = require(path.resolve(config));
    options.config = config;

    // overwrite options with what is in config
    Object.assign(options, config);
  }

  const { output, input, format } = options;
  debug('Starting command...');

  // read in the input graph
  let graph;
  try {
    // read from a file if specified, otherwise stdin
    if (input) {
      const inputPath = path.resolve(input);
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

  await command(graph, normalizedGraph, options);

  // output the final results
  if (output) {
    const outputPath = path.resolve(output);
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
  debug('Finished command.');
}

async function inputCommand(command, options) {
  let { config } = options;

  if (config) {
    config = require(path.resolve(config));
    options.config = config;

    // overwrite options with what is in config
    Object.assign(options, config);
  }

  const { input } = options;
  debug('Starting command...');

  // read in the input graph
  let graph;
  try {
    // read from a file if specified, otherwise stdin
    if (input) {
      const inputPath = path.resolve(input);
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

  await command(graph, normalizedGraph, options);

  debug('Finished command.');
}

module.exports = {
  ioCommand,
  inputCommand,
};
