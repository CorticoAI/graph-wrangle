const debug = require('debug')('graph-wrangle:cli');
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const d3 = require('d3');
const GraphWrangle = require('../index');
const io = require('../io');

function addCommand(program) {
  program
    .command('sequence <file...>')
    .description('Sequence multiple graphs')
    .option('-o, --output <file>', 'Specify output sequence JSON file')
    .option('-f, --format', 'Format JSON output')
    .action((inputFiles, options) => {
      debug(`Running sequence command: ${inputFiles}`);
      sequenceCommand(inputFiles, options);
    });
}

// convert globs to filenames
function resolveFiles(filesOrGlobs) {
  const results = filesOrGlobs
    .map(fileStr => glob.sync(fileStr))
    .reduce((a, b) => a.concat(b), []);
  return results;
}

async function loadGraphs(inputFiles) {
  const graphs = [];

  for (const input of inputFiles) {
    // read in the input graph
    let graph;
    try {
      // read from a file if specified
      const inputPath = path.resolve(input);
      graph = await io.loadGraph(inputPath);
    } catch (e) {
      throw new Error('Error reading input graph:', e.message);
    }

    graphs.push(graph);
  }

  return graphs;
}

/**
 * Outputs the sequence to JSON file or stdout, optionally formatting it
 */
function outputSequence(sequence, options) {
  const { output, format } = options;

  // write the sequence ot the output file
  if (output) {
    const outputPath = path.resolve(output);
    debug(`Writing sequence to file ${outputPath}`);
    try {
      let jsonStr;
      if (format) {
        jsonStr = JSON.stringify(sequence, null, 2);
      } else {
        jsonStr = JSON.stringify(sequence);
      }
      fs.writeFileSync(outputPath, jsonStr);
    } catch (e) {
      console.error('Error writing output file:', e.message);
      return;
    }
  } else {
    debug(`Writing sequence to stdout`);
    // write to STD OUT
    console.log(JSON.stringify(sequence));
  }
}

/**
 * Filter nodes from a graph
 */
async function sequenceCommand(inputFiles, options) {
  inputFiles = resolveFiles(inputFiles);
  debug(`Starting to sequence ${inputFiles.length} graphs.`);
  // load graphs
  const graphs = await loadGraphs(inputFiles);

  // since graph layouts tend to be destructive to the nodes, let's use a copy of them.
  // also ensure links are expanded and meta data has all expected fields
  const normalizedGraphs = graphs.map(graph =>
    GraphWrangle.normalizeGraph(graph)
  );

  const sequence = GraphWrangle.sequenceGraphs(normalizedGraphs);

  // overwrite normalized graphs in sequence with non
  sequence.graphs = graphs;

  outputSequence(sequence, options);
  debug('Finished sequencing graphs.');
}

module.exports = {
  run: sequenceCommand,
  add: addCommand,
};
