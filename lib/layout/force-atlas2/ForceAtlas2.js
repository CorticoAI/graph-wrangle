const Region = require('./Region');
const forceFactory = require('./ForceFactory');

/*
 Originally from: https://github.com/gephi/gephi/blob/master/modules/LayoutPlugin/src/main/java/org/gephi/layout/plugin/forceAtlas2/ForceAtlas2.java#L2

 Copyright 2008-2011 Gephi
 Authors : Mathieu Jacomy <mathieu.jacomy@gmail.com>
 Website : http://www.gephi.org

 This file is part of Gephi.

 DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER.

 Copyright 2011 Gephi Consortium. All rights reserved.

 The contents of this file are subject to the terms of either the GNU
 General Public License Version 3 only ("GPL") or the Common
 Development and Distribution License("CDDL") (collectively, the
 "License"). You may not use this file except in compliance with the
 License. You can obtain a copy of the License at
 http://gephi.org/about/legal/license-notice/
 or /cddl-1.0.txt and /gpl-3.0.txt. See the License for the
 specific language governing permissions and limitations under the
 License.  When distributing the software, include this License Header
 Notice in each file and include the License files at
 /cddl-1.0.txt and /gpl-3.0.txt. If applicable, add the following below the
 License Header, with the fields enclosed by brackets [] replaced by
 your own identifying information:
 "Portions Copyrighted [year] [name of copyright owner]"

 If you wish your version of this file to be governed by only the CDDL
 or only the GPL Version 3, indicate your decision by adding
 "[Contributor] elects to include this software in this distribution
 under the [CDDL or GPL Version 3] license." If you do not indicate a
 single choice of license, a recipient has the option to distribute
 your version of this file under either the CDDL, the GPL Version 3 or
 to extend the choice of license to its licensees as provided above.
 However, if you add GPL Version 3 code and therefore, elected the GPL
 Version 3 license, then the option applies only if the new code is
 made subject to such option by the copyright holder.

 Contributor(s):

 Portions Copyrighted 2011 Gephi Consortium.
 */
// import org.gephi.graph.api.Edge;
// import org.gephi.graph.api.Graph;
// import org.gephi.graph.api.GraphModel;
// import org.gephi.graph.api.Node;
// import org.gephi.layout.plugin.forceAtlas2.ForceFactory.AttractionForce;
// import org.gephi.layout.plugin.forceAtlas2.ForceFactory.RepulsionForce;
// import org.gephi.layout.spi.Layout;
// import org.gephi.layout.spi.LayoutBuilder;
// import org.gephi.layout.spi.LayoutProperty;
// import org.openide.util.NbBundle;

// import java.util.ArrayList;
// import java.util.List;
// import java.util.concurrent.ExecutorService;
// import java.util.concurrent.Executors;
// import java.util.concurrent.Future;
// import org.gephi.graph.api.Interval;
// import org.gephi.layout.plugin.AbstractLayout;
// import org.openide.util.Exceptions;

/**
 * ForceAtlas 2 Layout, manages each step of the computations.
 *
 * Removed support for intervals, dynamic weighted edges
 */
class ForceAtlas2 {
  constructor() {
    this.resetPropertiesValues();

    /** List of member properties */
    /*
    this.graph;
    this.edgeWeightInfluence;
    this.jitterTolerance;
    this.scalingRatio;
    this.gravity;
    this.speed;
    this.speedEfficiency;
    this.outboundAttractionDistribution;
    this.adjustSizes;
    this.barnesHutOptimize;
    this.barnesHutTheta;
    this.linLogMode;
    this.strongGravityMode;
    this.threadCount;
    this.currentThreadCount;
    this.rootRegion;
    this.outboundAttCompensation = 1;
    this.nodeDegrees;
    */

    // TODO: these need to be added
    this.getNodeDegree = node => {
      // assumes node ID is available on attr `id` on nodes
      // this map is populated in resetPropertiesValues
      return this.nodeDegrees[node.id] || 0;
    };

    this.getEdgeWeight = edge => 1;
    this.getNodes = graph => graph.nodes;
    this.getEdges = graph => graph.links;
  }

  initAlgo(options = {}) {
    // TODO: AbstractLayout.ensureSafeLayoutNodePositions(graphModel);

    this.speed = 1;
    this.speedEfficiency = 1;

    // this.graph = graphModel.getGraphVisible();

    const nodes = this.getNodes(this.graph);

    // TODO: need to know the degree of each node in the graph.

    // Initialise layout data
    for (const node of nodes) {
      // for now we just store the layout directly on the node object.
      const nodeLayout = node;

      nodeLayout.mass = 1 + this.getNodeDegree(node);
      nodeLayout.old_dx = 0;
      nodeLayout.old_dy = 0;
      nodeLayout.dx = 0;
      nodeLayout.dy = 0;

      if (options.resetNodePosition) {
        node.x = (0.01 + Math.random()) * 1000 - 500;
        node.y = (0.01 + Math.random()) * 1000 - 500;
      }
    }
  }

  // represents a single iteration of the algorithm
  goAlgo() {
    // Initialize graph data
    if (!this.canAlgo()) {
      return;
    }

    // for now, we will just set this.graph directly
    // this.graph = graphModel.getGraphVisible();
    const nodes = this.getNodes(this.graph);
    const edges = this.getEdges(this.graph);

    // Initialise layout data
    for (const node of nodes) {
      // for now we just store the layout directly on the node object.
      const nodeLayout = node;

      nodeLayout.mass = 1 + this.getNodeDegree(node);
      nodeLayout.old_dx = nodeLayout.dx;
      nodeLayout.old_dy = nodeLayout.dy;
      nodeLayout.dx = 0;
      nodeLayout.dy = 0;
    }

    // If Barnes Hut active, initialize root region
    if (this.barnesHutOptimize) {
      this.rootRegion = new Region(nodes);
      this.rootRegion.buildSubRegions();
    }

    // If outboundAttractionDistribution active, compensate.
    if (this.outboundAttractionDistribution) {
      this.outboundAttCompensation = 0;
      for (const node of nodes) {
        // for now we just store the layout directly on the node object.
        const nodeLayout = node;
        this.outboundAttCompensation += nodeLayout.mass;
      }
      this.outboundAttCompensation /= nodes.length;
    }

    // Repulsion (and gravity)
    // NB: used to be Muti-threaded
    const Repulsion = forceFactory.buildRepulsion(
      this.adjustSizes,
      this.scalingRatio
    );

    // apply node forces for repulsion and gravity (originally done in NodesThread)
    if (this.barnesHutOptimize) {
      for (const node of nodes) {
        this.rootRegion.applyForce(node, Repulsion, this.barnesHutTheta);
      }
    } else {
      for (let n1Index = 0; n1Index < nodes.length; n1Index++) {
        const n1 = nodes[n1Index];
        for (let n2Index = 0; n2Index < n1Index; n2Index++) {
          const n2 = nodes[n2Index];
          Repulsion.applyNodeNode(n1, n2);
        }
      }
    }

    const GravityForce = this.strongGravityMode
      ? forceFactory.getStrongGravity(this.scalingRatio)
      : Repulsion;

    // Gravity
    for (const node of nodes) {
      GravityForce.applyNodeGravity(node, this.gravity / this.scalingRatio);
    }

    // Attraction force
    const Attraction = forceFactory.buildAttraction(
      this.linLogMode,
      this.outboundAttractionDistribution,
      this.adjustSizes,
      1 *
        (this.outboundAttractionDistribution ? this.outboundAttCompensation : 1)
    );

    if (this.edgeWeightInfluence === 0) {
      for (const edge of edges) {
        Attraction.apply(edge.source, edge.target, 1);
      }
    } else if (this.edgeWeightInfluence === 1) {
      for (const edge of edges) {
        Attraction.apply(edge.source, edge.target, this.getEdgeWeight(edge));
      }
    } else {
      for (const edge of edges) {
        Attraction.apply(
          edge.source,
          edge.target,
          Math.pow(this.getEdgeWeight(edge), this.edgeWeightInfluence)
        );
      }
    }

    // Auto adjust speed
    let totalSwinging = 0; // How much irregular movement
    let totalEffectiveTraction = 0; // Hom much useful movement
    for (const node of nodes) {
      // for now we just store the layout directly on the node object.
      const nodeLayout = node;

      // if (!node.isFixed()) {

      const swinging = Math.sqrt(
        Math.pow(nodeLayout.old_dx - nodeLayout.dx, 2) +
          Math.pow(nodeLayout.old_dy - nodeLayout.dy, 2)
      );
      totalSwinging += nodeLayout.mass * swinging; // If the node has a burst change of direction, then it's not converging.
      totalEffectiveTraction +=
        nodeLayout.mass *
        0.5 *
        Math.sqrt(
          Math.pow(nodeLayout.old_dx + nodeLayout.dx, 2) +
            Math.pow(nodeLayout.old_dy + nodeLayout.dy, 2)
        );
      // }
    }
    // We want that swingingMovement < tolerance * convergenceMovement

    // Optimize jitter tolerance
    // The 'right' jitter tolerance for this network. Bigger networks need more tolerance. Denser networks need less tolerance. Totally empiric.
    const estimatedOptimalJitterTolerance = 0.05 * Math.sqrt(nodes.length);
    const minJT = Math.sqrt(estimatedOptimalJitterTolerance);
    const maxJT = 10;
    let jt =
      this.jitterTolerance *
      Math.max(
        minJT,
        Math.min(
          maxJT,
          estimatedOptimalJitterTolerance *
            totalEffectiveTraction /
            Math.pow(nodes.length, 2)
        )
      );

    const minSpeedEfficiency = 0.05;

    // Protection against erratic behavior
    if (totalSwinging / totalEffectiveTraction > 2.0) {
      if (this.speedEfficiency > minSpeedEfficiency) {
        this.speedEfficiency *= 0.5;
      }
      jt = Math.max(jt, this.jitterTolerance);
    }

    const targetSpeed =
      jt * this.speedEfficiency * totalEffectiveTraction / totalSwinging;

    // Speed efficiency is how the speed really corresponds to the swinging vs. convergence tradeoff
    // We adjust it slowly and carefully
    if (totalSwinging > jt * totalEffectiveTraction) {
      if (this.speedEfficiency > minSpeedEfficiency) {
        this.speedEfficiency *= 0.7;
      }
    } else if (this.speed < 1000) {
      this.speedEfficiency *= 1.3;
    }

    // But the speed shoudn't rise too much too quickly, since it would make the convergence drop dramatically.
    const maxRise = 0.5; // Max rise: 50%
    this.speed =
      this.speed + Math.min(targetSpeed - this.speed, maxRise * this.speed);

    // Apply forces
    if (this.adjustSizes) {
      // If nodes overlap prevention is active, it's not possible to trust the swinging mesure.
      for (const node of nodes) {
        // for now we just store the layout directly on the node object.
        const nodeLayout = node;

        // if (!n.isFixed()) {

        // Adaptive auto-speed: the speed of each node is lowered
        // when the node swings.
        const swinging =
          nodeLayout.mass *
          Math.sqrt(
            (nodeLayout.old_dx - nodeLayout.dx) *
              (nodeLayout.old_dx - nodeLayout.dx) +
              (nodeLayout.old_dy - nodeLayout.dy) *
                (nodeLayout.old_dy - nodeLayout.dy)
          );
        let factor = 0.1 * this.speed / (1 + Math.sqrt(this.speed * swinging));

        const df = Math.sqrt(
          Math.pow(nodeLayout.dx, 2) + Math.pow(nodeLayout.dy, 2)
        );
        factor = Math.min(factor * df, 10) / df;

        const x = node.x + nodeLayout.dx * factor;
        const y = node.y + nodeLayout.dy * factor;

        node.x = x;
        node.y = y;

        // }
      }
    } else {
      for (const node of nodes) {
        // for now we just store the layout directly on the node object.
        const nodeLayout = node;
        // if (!n.isFixed()) {

        // Adaptive auto-speed: the speed of each node is lowered
        // when the node swings.
        const swinging =
          nodeLayout.mass *
          Math.sqrt(
            (nodeLayout.old_dx - nodeLayout.dx) *
              (nodeLayout.old_dx - nodeLayout.dx) +
              (nodeLayout.old_dy - nodeLayout.dy) *
                (nodeLayout.old_dy - nodeLayout.dy)
          );
        //const factor = speed / (1f + Math.sqrt(speed * swinging));
        const factor = this.speed / (1 + Math.sqrt(this.speed * swinging));

        const x = node.x + nodeLayout.dx * factor;
        const y = node.y + nodeLayout.dy * factor;

        node.x = x;
        node.y = y;
        // }
      }
    }
  }

  canAlgo() {
    return this.graph != null;
  }

  endAlgo() {
    const nodes = this.getNodes(this.graph);

    for (const node of nodes) {
      // for now we just store the layout directly on the node object.
      const nodeLayout = node;

      delete nodeLayout.mass;
      delete nodeLayout.old_dx;
      delete nodeLayout.old_dy;
      delete nodeLayout.dx;
      delete nodeLayout.dy;
    }
  }

  resetPropertiesValues() {
    let nodesCount = 0;

    this.nodeDegrees = {};
    if (this.graph && this.getNodes(this.graph)) {
      const nodes = this.getNodes(this.graph);
      // nodesCount = graphModel.getGraphVisible().getNodeCount();
      nodesCount = nodes.length;

      // compute degree for nodes
      const edges = this.getEdges(this.graph);

      edges.forEach(edge => {
        const { source, target } = edge;
        // TODO: this assumes node ID is available on nodes as the `id` attr
        if (!this.nodeDegrees[source.id]) {
          this.nodeDegrees[source.id] = 1;
        } else {
          this.nodeDegrees[source.id] += 1;
        }
        if (!this.nodeDegrees[target.id]) {
          this.nodeDegrees[target.id] = 1;
        } else {
          this.nodeDegrees[target.id] += 1;
        }
      });
    }

    // Tuning
    if (nodesCount >= 100) {
      this.scalingRatio = 2.0;
    } else {
      this.scalingRatio = 10.0;
    }

    this.strongGravityMode = false;
    this.gravity = 1;

    // Behavior
    this.outboundAttractionDistribution = false;
    this.linLogMode = false;
    this.adjustSizes = false;
    this.edgeWeightInfluence = 1;

    // Performance
    this.jitterTolerance = 1;

    if (nodesCount >= 1000) {
      this.barnesHutOptimize = true;
    } else {
      this.barnesHutOptimize = false;
    }

    this.barnesHutTheta = 1.2;
  }

  // use indirection so our setter can also call resetPropertiesValues
  get graph() {
    return this._graph;
  }

  set graph(graph) {
    this._graph = graph;
    // Trick: reset here to take the profile of the graph in account for default values
    this.resetPropertiesValues();
  }
}

module.exports = ForceAtlas2;
