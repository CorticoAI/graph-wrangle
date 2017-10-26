const d3Force = require('d3-force-3d');

class D3ForceLayout {
  constructor(
    graph,
    {
      linkId,
      linkStrength,
      makeLinkStrength,
      linkDistance = 15,
      manyBodyStrength = -30,
      collisionRadius = 3,
      collisionStrength = 0.7,
      numDimensions = 2,
    }
  ) {
    this.graph = graph;

    this.linkDistance = linkDistance;
    this.manyBodyStrength = manyBodyStrength;
    this.collisionRadius = collisionRadius;
    this.collisionStrength = collisionStrength;
    this.numDimensions = numDimensions;

    // override default functions if provided
    if (linkId != null) {
      this.linkId = linkId;
    }
    if (linkStrength != null) {
      this.linkStrength = linkStrength;
    }
    if (makeLinkStrength != null) {
      this.makeLinkStrength = makeLinkStrength;
    }

    // incomplete status (this layout never 'completes')
    this.complete = false;
  }

  // default function that can be overridden
  linkId(d) {
    return d.id;
  }

  // default function that can be overridden
  makeLinkStrength(defaultLinkStrength) {
    return function(link) {
      const strength = defaultLinkStrength(link);
      if (link.weight != null) {
        return link.weight * strength;
      }

      return strength;
    };
  }

  setup() {
    const {
      graph,
      linkId,
      linkStrength,
      makeLinkStrength,
      linkDistance,
      manyBodyStrength,
      collisionRadius,
      collisionStrength,
      numDimensions,
    } = this;

    if (!this.graph) {
      return;
    }

    const { nodes, links } = graph;

    const forceLinks = d3Force.forceLink(links);
    if (linkId) {
      forceLinks.id(linkId);
    }
    if (linkStrength) {
      forceLinks.strength(linkStrength);
    } else if (makeLinkStrength) {
      forceLinks.strength(makeLinkStrength(forceLinks.strength()));
    }
    if (linkDistance) {
      forceLinks.distance(linkDistance);
    }

    const forceCollision = d3Force
      .forceCollide(collisionRadius)
      .strength(collisionStrength);

    const forceManyBody = d3Force.forceManyBody().strength(manyBodyStrength);

    // remove prior positions for consistency
    this.resetNodes();

    const simulation = d3Force
      .forceSimulation()
      .numDimensions(numDimensions)
      .nodes(nodes)
      .force('charge', forceManyBody)
      .force('link', forceLinks)
      .force('collision', forceCollision);

    this.simulation = simulation;

    // note that this mutates the nodes in the graph
    simulation.tick(); // important to initialize the nodes immediately so they have a Z value
    simulation.stop();
  }

  tick() {
    if (this.simulation) {
      // note that this mutates the nodes in the graph
      this.simulation.tick();
    }
  }

  findPoint(x, y) {
    return this.simulation.find(x, y);
  }

  resetNodes() {
    const { nodes } = this.graph;

    nodes.forEach(d => {
      delete d.x;
      delete d.vx;
      delete d.y;
      delete d.vy;
      delete d.z;
      delete d.vz;
    });
  }

  /**
   * Helper to pull out layout attributes from nodes into their own separate objects
   */
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

module.exports = D3ForceLayout;
