const fs = require('fs');
const { createCanvas } = require('canvas');
const debug = require('debug')('graph-wrangle:draw');
const d3 = require('d3');

function saveAsPng(canvas, outputPath) {
  debug(`Saving graph image as PNG to ${outputPath}`);
  return new Promise((resolve, reject) => {
    try {
      const out = fs.createWriteStream(outputPath);
      const pngStream = canvas.pngStream();

      pngStream.on('data', chunk => out.write(chunk));
      pngStream.on('end', () => resolve(canvas));
    } catch (e) {
      reject(e);
    }
  }).then(canvas => {
    debug('Finished writing graph image.');
    return canvas;
  });
}

function getNodePosition(graph, node) {
  // maps from node ID to layout
  const layoutByNode = graph.meta.layout && graph.meta.layout.nodes;

  if (!layoutByNode || !layoutByNode[node.id]) {
    return { x: 0, y: 0 };
  }

  return layoutByNode[node.id];
}

function getNodeStyle(graph, node) {
  // maps from node ID to layout
  const styleByNode = graph.meta.style && graph.meta.style.nodes;

  if (!styleByNode || !styleByNode[node.id]) {
    return { fill: '#000', radius: 3 };
  }

  return styleByNode[node.id];
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Computes a quadratic bezier coordinates for drawing a curved path between
 * points A and B (computes the control point)
 * From https://stackoverflow.com/questions/25595387/d3-js-how-to-convert-edges-from-lines-to-curved-paths-in-a-network-visualizatio
 */
function curvedPath(Ax, Ay, Bx, By, M) {
  // Find midpoint J
  const Jx = Ax + (Bx - Ax) / 2;
  const Jy = Ay + (By - Ay) / 2;

  // We need a and b to find theta, and we need to know the sign of each to make sure that the orientation is correct.
  const a = Bx - Ax;
  const asign = a < 0 ? -1 : 1;
  const b = By - Ay;
  const theta = Math.atan(b / a);

  // Find the point that's perpendicular to J on side
  const costheta = asign * Math.cos(theta);
  const sintheta = asign * Math.sin(theta);

  // scale by amount relative to line length
  const curveMultiplier = M * distance(Ax, Ay, Bx, By);

  // Find c and d
  const c = curveMultiplier * sintheta;
  const d = curveMultiplier * costheta;

  // Use c and d to find Kx and Ky
  const Kx = Jx - c;
  const Ky = Jy + d;

  // path `d` string would be `M${Ax},${Ay} Q${Kx},${Ky} ${Bx},${By}`;
  return [Ax, Ay, Kx, Ky, Bx, By];
}

function drawNodes(canvas, graph, xScale, yScale) {
  const { nodes } = graph;

  const context = canvas.getContext('2d');
  context.save();
  context.globalAlpha = 1;

  // draw in the nodes
  nodes.forEach(d => {
    const { fill, radius } = getNodeStyle(graph, d);
    const position = getNodePosition(graph, d);
    const x = xScale(position.x);
    const y = yScale(position.y);

    if (fill != null && fill !== 'null') {
      context.beginPath();
      context.fillStyle = fill;
      context.moveTo(x + radius, y);
      context.arc(x, y, radius, 0, 2 * Math.PI);
      context.fill();
    }
  });

  context.restore();
}

function drawLinks(canvas, graph, xScale, yScale) {
  const { links } = graph;
  const curvedLinks = true;
  const linkAlpha = 0.2;
  const linkStrokeWidth = 1;
  const gradientLinks = true;

  const context = canvas.getContext('2d');
  context.save();
  // draw in the links
  context.globalAlpha = linkAlpha || 0.2;
  context.lineWidth = linkStrokeWidth;

  links.forEach(d => {
    const sourcePosition = getNodePosition(graph, d.source);
    const targetPosition = getNodePosition(graph, d.target);

    const sx = xScale(sourcePosition.x);
    const sy = yScale(sourcePosition.y);
    const tx = xScale(targetPosition.x);
    const ty = yScale(targetPosition.y);

    if (curvedLinks) {
      const quadratic = curvedPath(sx, sy, tx, ty, 0.2);

      context.beginPath();
      context.moveTo(quadratic[0], quadratic[1]);
      context.quadraticCurveTo(
        quadratic[2],
        quadratic[3],
        quadratic[4],
        quadratic[5]
      );
    } else {
      context.beginPath();
      context.moveTo(sx, sy);
      context.lineTo(tx, ty);
    }

    // color the link by the nodes
    const sourceColor = getNodeStyle(graph, d.source).fill;
    const targetColor = getNodeStyle(graph, d.target).fill;

    if (
      sourceColor != null &&
      targetColor != null &&
      sourceColor !== 'null' &&
      targetColor !== 'null'
    ) {
      if (gradientLinks) {
        const gradient = context.createLinearGradient(sx, sy, tx, ty);
        gradient.addColorStop(0, sourceColor);
        gradient.addColorStop(1, targetColor);
        context.strokeStyle = gradient;
      } else {
        context.strokeStyle = sourceColor;
      }
      context.stroke();
    }
  });

  context.restore();
}

function drawGraph(graph, options) {
  const {
    width = 800,
    height = 800,
    backgroundColor = '#ffffff',
    outputPath,
  } = options;

  const padding = { top: 20, right: 20, bottom: 20, left: 20 };
  const plotAreaWidth = width - padding.left - padding.right;
  const plotAreaHeight = height - padding.top - padding.bottom;
  debug(`Drawing graph into a ${width}x${height} canvas`);

  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  // add in a background:
  if (backgroundColor != null) {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);
  } else {
    context.clearRect(0, 0, width, height);
  }

  // add some padding to prevent nodes from getting clipped
  context.translate(padding.left, padding.top);

  const xExtent = graph.meta.layout.xExtent;
  const yExtent = graph.meta.layout.yExtent;

  const xScale = d3
    .scaleLinear()
    .domain(xExtent)
    .range([0, plotAreaWidth]);
  const yScale = d3
    .scaleLinear()
    .domain(yExtent)
    .range([0, plotAreaHeight]);

  drawLinks(canvas, graph, xScale, yScale);
  drawNodes(canvas, graph, xScale, yScale);

  // if an output path is provided, save it
  if (outputPath) {
    return saveAsPng(canvas, outputPath);
  }

  return Promise.resolve(canvas);
}

module.exports = drawGraph;
