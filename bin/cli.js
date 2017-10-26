#!/usr/bin/env node

/**
 * Module dependencies.
 */

// enable DEBUG messages when running as CLI
if (process.env['DEBUG'] == null) {
  process.env['DEBUG'] = 'graph-wrangle:*';
}

const program = require('commander');
const debug = require('debug')('graph-wrangle:cli');
const path = require('path');

const GraphWrangle = require('../lib/index');
const io = require('../lib/io');

program
  .command('layout <file>')
  .description('Compute the layout for a given graph')
  .option(
    '-a, --algorithm <name>',
    'Specify graph layout algorithm',
    'd3-force'
  )
  .option(
    '-k, --layout-key <name>',
    'Specify key to save the graph layout as in the meta object',
    'layout'
  )
  .option(
    '-t, --num-ticks <number>',
    'Specify number of ticks to run the algorithm',
    parseInt
  )
  .option('-o, --output <file>', 'Specify output graph JSON file')
  .option('-f, --format', 'Format JSON output')
  .action(layoutCommand);

/**
 * Read in a graph from a file and run a layout on it. Then
 * output it to stdout or to a file.
 */
async function layoutCommand(inputFile, options) {
  const { algorithm, output, format, layoutKey, numTicks } = options;
  const inputPath = path.resolve(inputFile);
  let outputPath;
  debug(`Running ${algorithm} layout on ${inputPath}`);
  if (output) {
    outputPath = path.resolve(output);
    debug(`Will write output to ${outputPath}`);
  }

  // read in the input graph
  let graph;
  try {
    graph = io.loadGraph(inputPath);
  } catch (e) {
    console.error('Error reading input file:', e.message);
    return;
  }

  // since graph layouts tend to be destructive to the nodes, let's use a copy of them.
  // also ensure links are expanded and meta data has all expected fields
  const normalizedGraph = GraphWrangle.normalizeGraph(graph);

  // run the layout and get the layout data
  const layout = await GraphWrangle.layoutGraph(
    normalizedGraph,
    algorithm,
    numTicks
  );

  // create a new graph object with layout in it
  graph = { meta: {}, ...graph };
  graph.meta[layoutKey] = layout;

  // merge into normalized graph too
  normalizedGraph.meta[layoutKey] = layout;

  // output the final results
  if (output) {
    try {
      io.writeGraph(outputPath, graph, format);
      const imageOutputPath = outputPath.replace(/\.json$/, '.png');
      await GraphWrangle.drawGraph(normalizedGraph, imageOutputPath);
    } catch (e) {
      console.error('Error writing output file:', e.message);
      return;
    }
  } else {
    // write to STD OUT
    console.log(JSON.stringify(graph));
  }
}
program.parse(process.argv);
