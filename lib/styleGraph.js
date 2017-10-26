const debug = require('debug')('graph-wrangle:style');
const d3 = require('d3');

/**
 * Style a graph - set radius and colors of nodes
 */
function styleGraph(graph, options) {
  const { colorField, colorScheme, colorInterpolator } = options;

  const colorKey = colorField.name;
  debug(`Styling graph: color by ${colorKey}`);

  const colorScale = getColorScale(
    graph,
    colorField,
    colorScheme,
    colorInterpolator
  );

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

function createRangeFromValueMap(colorScheme, domain) {
  // map the domain to a color
  return domain.map(
    value => colorScheme.valueMap[value] || colorScheme.defaultColor
  );
}

function getColorScale(graph, colorField, colorScheme, colorInterpolator) {
  // handle categorical color schemes
  if (colorField['data-type'] === 'categorical') {
    const sortedKeys = d3
      .nest()
      .key(d => d[colorField.name])
      .entries(graph.nodes)
      .map(d => d.key)
      .sort((a, b) => {
        let result;
        if (colorField.type === 'number' || colorField.type === 'integer') {
          result = a - b;
        } else {
          result = a.localeCompare(b);
        }
        if (result !== 0) {
          // move N/A to the end
          if (a === 'N/A') {
            return 1;
          }
          if (b === 'N/A') {
            return -1;
          }
        }

        return result;
      });

    if (colorScheme == null) {
      if (sortedKeys.length > 10) {
        colorScheme = d3.schemeCategory20;
      } else {
        colorScheme = d3.schemeCategory10;
      }
    } else if (colorScheme.type === 'valueMap') {
      // map a subset of values to colors and the rest get defaults.
      colorScheme = createRangeFromValueMap(colorScheme, sortedKeys);
    }

    return d3
      .scaleOrdinal()
      .domain(sortedKeys)
      .range(colorScheme);
  } else if (colorField['data-type'] === 'numeric') {
    if (colorInterpolator == null) {
      colorInterpolator = 'viridis';
    }
    return d3
      .scaleSequential()
      .domain(colorField.extent)
      .interpolator(getD3ColorInterpolator(colorInterpolator));
  }

  return d3.scaleOrdinal().range(d3.schemeCategory10);
}

function getD3ColorInterpolator(colorInterpolator) {
  const name = `interpolate${colorInterpolator[0].toUpperCase()}${colorInterpolator.substring(
    1
  )}`;
  return d3[name];
}

module.exports = styleGraph;
