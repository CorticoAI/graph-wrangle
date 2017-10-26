const fs = require('fs');
const debug = require('debug')('graph-wrangle:io');
const util = require('util');

function loadGraphFromStdIn() {
  debug(`Reading graph from stdin...`);
  return new Promise(resolve => {
    const chunks = [];
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', chunk => {
      chunks.push(chunk);
    });

    process.stdin.on('end', () => {
      const jsonStr = chunks.join();
      const graph = JSON.parse(jsonStr);
      debug(
        `Loaded graph: ${graph.nodes.length} nodes, ${graph.links
          .length} links.`
      );
      resolve(graph);
    });
  });
}

async function loadGraph(filePath) {
  debug(`Reading graph from ${filePath}...`);
  const readFile = util.promisify(fs.readFile);
  const jsonStr = await readFile(filePath, 'utf8');
  const graph = JSON.parse(jsonStr);
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
  loadGraphFromStdIn,
  writeGraph,
};
