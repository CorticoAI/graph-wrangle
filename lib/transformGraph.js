const debug = require('debug')('graph-wrangle:transform');
const d3 = require('d3');

/**
 * Uses the same as PMatrix3D.mult in Processing:
 * https://github.com/processing/processing/blob/master/core/src/processing/core/PMatrix3D.java
 */
function transformNode(node, matrix) {
  const [m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23] = matrix;

  return {
    ...node,
    x: m00 * node.x + m01 * node.y + m02 * node.z + m03,
    y: m10 * node.x + m11 * node.y + m12 * node.z + m13,
    z: m20 * node.x + m21 * node.y + m22 * node.z + m23,
  };
}

/**
 * Filter the nodes and links in a graph.
 */
function transformGraph(graph, options) {
  const { matrix } = options;

  const { layout } = graph.meta;
  if (!matrix) {
    return layout;
  }

  debug('Applying matrix to graph layout', matrix);
  const transformedLayout = {};

  transformedLayout.nodes = Object.keys(
    layout.nodes
  ).reduce((accum, nodeId) => {
    const node = layout.nodes[nodeId];
    accum[nodeId] = transformNode(node, matrix);
    return accum;
  }, {});

  // recompute extents
  transformedLayout.xExtent = d3.extent(
    d3.values(transformedLayout.nodes),
    d => d.x
  );
  transformedLayout.yExtent = d3.extent(
    d3.values(transformedLayout.nodes),
    d => d.y
  );
  transformedLayout.zExtent = d3.extent(
    d3.values(transformedLayout.nodes),
    d => d.z
  );
  debug('xExtent =', transformedLayout.xExtent, 'old = ', layout.xExtent);
  debug('yExtent =', transformedLayout.yExtent, 'old = ', layout.yExtent);
  debug('zExtent =', transformedLayout.zExtent, 'old = ', layout.zExtent);

  // update this graph
  graph.meta.layout = transformedLayout;

  return transformedLayout;
}

module.exports = transformGraph;
