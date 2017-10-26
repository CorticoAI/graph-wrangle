const fs = require('fs');
const debug = require('debug')('graph-wrangle:io');

function loadGraph(filePath) {
  debug(`Reading graph from ${filePath}...`);
  const graph = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  debug(
    `Loaded graph: ${graph.nodes.length} nodes, ${graph.links.length} links.`
  );
  return graph;
}

function writeGraph(filePath, graph) {
  debug(`Writing graph to ${filePath}...`);
  fs.writeFileSync(filePath, JSON.stringify(graph));
  debug('Successfully wrote graph to file.');
}

module.exports = {
  loadGraph,
  writeGraph,
};
