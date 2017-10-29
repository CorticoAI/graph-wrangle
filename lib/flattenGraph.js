const debug = require('debug')('graph-wrangle:flatten');
const d3 = require('d3');

/**
 * Omits fields from an object
 */
function omit(obj, ...omitKeys) {
  if (!obj) {
    return obj;
  }

  return Object.keys(obj)
    .filter(key => !omitKeys.includes(key))
    .reduce((newObj, key) => {
      newObj[key] = obj[key];
      return newObj;
    }, {});
}

/**
 * Merges layout data into nodes destructively
 */
function mergeLayout(graph) {
  const layout = graph.meta.layout;
  if (!layout || !layout.nodes) {
    return;
  }

  const layoutNodes = layout.nodes;
  const nodes = graph.nodes;
  nodes.forEach(node => {
    Object.assign(node, layoutNodes[node.id]);
  });
}

/**
 * Merges style data into nodes destructively
 */
function mergeStyle(graph) {
  const style = graph.meta.style;
  if (!style || !style.nodes) {
    return;
  }

  const styleNodes = style.nodes;
  const nodes = graph.nodes;
  nodes.forEach(node => {
    Object.assign(node, styleNodes[node.id]);
  });
}

/**
 * Merges layout and style meta into the graph nodes
 */
function flattenGraph(graph) {
  debug(`Flattening graph layout and style into nodes.`);

  mergeLayout(graph);
  mergeStyle(graph);

  const flattened = {
    ...graph,
    meta: {
      ...graph.meta,
      layout: omit(graph.meta.layout, 'nodes'),
      style: omit(graph.meta.style, 'nodes'),
    },
  };

  return flattened;
}

module.exports = flattenGraph;
