class RandomLayout {
  constructor(graph, { numDimensions = 2 }) {
    this.graph = graph;
    this.numDimensions = numDimensions;
    this.complete = false;
  }

  setup() {
    const { graph, numDimensions } = this;

    if (!this.graph) {
      return;
    }

    const { nodes } = graph;

    nodes.forEach(d => {
      d.x = (Math.random() - 0.5) * 600;
      d.y = (Math.random() - 0.5) * 600;
      if (numDimensions === 3) {
        d.z = (Math.random() - 0.5) * 600;
      } else {
        delete d.z;
      }
    });

    this.complete = true;
  }

  tick() {}

  extractLayout() {
    return {
      nodes: this.graph.nodes.reduce((map, d) => {
        const layoutNode = {
          id: d.id,
          x: d.x,
          y: d.y,
        };

        if (this.numDimensions === 3) {
          layoutNode.z = d.z;
        }

        map[d.id] = layoutNode;
        return map;
      }, {}),
    };
  }
}

module.exports = RandomLayout;
