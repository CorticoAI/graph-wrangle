const debug = require('debug')('graph-wrangle:cli');
const GraphWrangle = require('../index');
const { ioCommand } = require('./util');

function addCommand(program) {
  program
    .command('clean')
    .description('Clean a graph (remove duplicate links, missing nodes)')
    .option(
      '-n, --numberify-ids',
      'Add an id field with unique integers for each node'
    )
    .option('-i, --input <file>', 'Specify input graph JSON file')
    .option('-o, --output <file>', 'Specify output graph JSON file')
    .option('-f, --format', 'Format JSON output')
    .action(options => {
      debug(`Running clean command: ${options.input}`);
      ioCommand(cleanCommand, options);
    });
}

/**
 * Flatten nodes from a graph
 */
async function cleanCommand(graph, normalizedGraph, options) {
  // assume the normalized graph is cleaned and write it back out
  debug('Cleaning up link data');
  GraphWrangle.cleanGraph(normalizedGraph, {
    numberifyIds: options.numberifyIds,
  });

  // right now we only care about links
  graph.links = normalizedGraph.links.map(link => {
    if (link.weight != null) {
      return [link.source.id, link.target.id, link.weight];
    } else {
      return [link.source.id, link.target.id];
    }
  });

  // copy over cleaned up nodes and meta
  graph.nodes = normalizedGraph.nodes.map(d => ({ ...d }));

  graph.meta.layout = normalizedGraph.meta.layout;
  graph.meta.style = normalizedGraph.meta.style;
}

module.exports = {
  run: cleanCommand,
  add: addCommand,
};
