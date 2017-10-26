const debug = require('debug')('graph-wrangle:style');
const d3 = require('d3');

/**
 * Style a graph - set radius and colors of nodes
 */
function styleGraph(graph, colorKey) {
  debug(`Styling graph: color by ${colorKey}.`);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  const styleNodes = graph.nodes.reduce((map, node) => {
    // const color = d3
    //   .rgb(Math.random() * 255, Math.random() * 255, Math.random() * 255)
    //   .toString();
    const color = colorScale(node[colorKey]);

    const styleNode = {
      fill: color,
      radius: 3,
    };

    map[node.id] = styleNode;

    return map;
  }, {});

  const style = {
    nodes: styleNodes,
  };

  return style;
}

module.exports = styleGraph;
