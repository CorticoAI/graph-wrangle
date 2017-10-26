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
  .command('layout')
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
  .option('-i, --input <file>', 'Specify input graph JSON file')
  .option('-o, --output <file>', 'Specify output graph JSON file')
  .option('-f, --format', 'Format JSON output')
  .action(options => {
    ioCommand(layoutCommand, options);
  });

/**
 * Wrapper for commands that reads a graph, runs a command, then writes
 * the modified graph.
 */
async function ioCommand(command, options) {
  const { output, input, format } = options;

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
}

module.exports = function cli(args) {
  program.parse(args);
};

/**
 * Read in a graph from a file and run a layout on it. Then
 * output it to stdout or to a file.
 */
async function layoutCommand(graph, normalizedGraph, options) {
  const { algorithm, layoutKey, numTicks } = options;

  // run the layout and get the layout data
  const layout = await GraphWrangle.layoutGraph(
    normalizedGraph,
    algorithm,
    numTicks
  );

  // create a new graph object with layout in it
  if (!graph.meta) {
    graph.meta = {};
  }
  graph.meta[layoutKey] = layout;

  // merge into normalized graph too
  normalizedGraph.meta[layoutKey] = layout;
}

/*
  // TODO: remove this from layout command...
  const style = GraphWrangle.styleGraph(normalizedGraph, 'community_id_week');
  normalizedGraph.meta.style = style;
  graph.meta.style = style;

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
  */
