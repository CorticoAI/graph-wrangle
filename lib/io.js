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

function writeGraph(filePath, graph, format) {
  debug(`Writing graph to ${filePath}...`);
  let jsonStr;
  if (format) {
    jsonStr = JSON.stringify(graph, null, 2);
  } else {
    jsonStr = JSON.stringify(graph);
  }
  fs.writeFileSync(filePath, jsonStr);
  debug('Successfully wrote graph to file.');
}

module.exports = {
  loadGraph,
  writeGraph,
};
