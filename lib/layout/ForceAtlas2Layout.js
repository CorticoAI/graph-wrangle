const ForceAtlas2 = require('./force-atlas2/ForceAtlas2');

class ForceAtlas2Layout {
  constructor(graph, { numDimensions = 2 }) {
    this.graph = graph;
    this.numDimensions = numDimensions;

    this.complete = false;
  }

  setup() {
    const { graph } = this;

    if (!this.graph) {
      return;
    }

    const simulation = new ForceAtlas2();
    simulation.graph = graph;
    this.simulation = simulation;

    if (simulation.canAlgo()) {
      simulation.initAlgo({ resetNodePosition: true });
      if (this.numDimensions === 3) {
        this.graph.nodes.forEach(node => {
          node.z = 0;
        });
      }
      simulation.goAlgo();
    }
  }

  tick() {
    if (this.simulation) {
      // note that this mutates the nodes in the graph
      this.simulation.goAlgo();
    }
  }

  extractLayout() {
    return {
      nodes: this.graph.nodes.reduce((map, d) => {
        const layoutNode = {
          id: d.id,
          x: d.x,
          y: d.y,
        };

        map[d.id] = layoutNode;
        return map;
      }, {}),
    };
  }
}

module.exports = ForceAtlas2Layout;
