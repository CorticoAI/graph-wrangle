/*
 Originally from: https://github.com/gephi/gephi/blob/master/modules/LayoutPlugin/src/main/java/org/gephi/layout/plugin/forceAtlas2/Region.java
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
// import java.util.ArrayList;
// import java.util.Arrays;
// import java.util.List;
// import org.gephi.graph.api.Node;
// import org.gephi.layout.plugin.forceAtlas2.ForceFactory.RepulsionForce;

/**
 * Barnes Hut optimization
 *
 */
class Region {
  constructor(nodes) {
    /** Class members */
    // this.mass;
    // this.massCenterX;
    // this.massCenterY;
    // this.size;
    this.subregions = [];
    this.nodes = nodes;
    this.updateMassAndGeometry();
  }

  updateMassAndGeometry() {
    if (this.nodes.length > 1) {
      // Compute Mass
      this.mass = 0;
      let massSumX = 0;
      let massSumY = 0;
      for (const node of this.nodes) {
        // for now we just store the layout directly on the node object.
        const nodeLayout = node;

        this.mass += nodeLayout.mass;
        massSumX += node.x * nodeLayout.mass;
        massSumY += node.y * nodeLayout.mass;
      }
      this.massCenterX = massSumX / this.mass;
      this.massCenterY = massSumY / this.mass;

      // Compute size
      this.size = Number.MIN_VALUE;
      for (const node of this.nodes) {
        const distance = Math.sqrt(
          (node.x - this.massCenterX) * (node.x - this.massCenterX) +
            (node.y - this.massCenterY) * (node.y - this.massCenterY)
        );
        this.size = Math.max(this.size, 2 * distance);
      }
    }
  }

  buildSubRegions() {
    if (this.nodes.length > 1) {
      const leftNodes = [];
      const rightNodes = [];

      for (const node of this.nodes) {
        const nodesColumn = node.x < this.massCenterX ? leftNodes : rightNodes;
        nodesColumn.push(node);
      }

      const topleftNodes = [];
      const bottomleftNodes = [];
      for (const node of leftNodes) {
        const nodesLine =
          node.y < this.massCenterY ? topleftNodes : bottomleftNodes;
        nodesLine.push(node);
      }

      const bottomrightNodes = [];
      const toprightNodes = [];
      for (const node of rightNodes) {
        const nodesLine =
          node.y < this.massCenterY ? toprightNodes : bottomrightNodes;
        nodesLine.push(node);
      }

      if (topleftNodes.length > 0) {
        if (topleftNodes.length < this.nodes.length) {
          const subregion = new Region(topleftNodes);
          this.subregions.push(subregion);
        } else {
          for (const node of topleftNodes) {
            const oneNodeList = [];
            oneNodeList.push(node);
            const subregion = new Region(oneNodeList);
            this.subregions.push(subregion);
          }
        }
      }
      if (bottomleftNodes.length > 0) {
        if (bottomleftNodes.length < this.nodes.length) {
          const subregion = new Region(bottomleftNodes);
          this.subregions.push(subregion);
        } else {
          for (const node of bottomleftNodes) {
            const oneNodeList = [];
            oneNodeList.push(node);
            const subregion = new Region(oneNodeList);
            this.subregions.push(subregion);
          }
        }
      }
      if (bottomrightNodes.length > 0) {
        if (bottomrightNodes.length < this.nodes.length) {
          const subregion = new Region(bottomrightNodes);
          this.subregions.push(subregion);
        } else {
          for (const node of bottomrightNodes) {
            const oneNodeList = [];
            oneNodeList.push(node);
            const subregion = new Region(oneNodeList);
            this.subregions.push(subregion);
          }
        }
      }
      if (toprightNodes.length > 0) {
        if (toprightNodes.length < this.nodes.length) {
          const subregion = new Region(toprightNodes);
          this.subregions.push(subregion);
        } else {
          for (const node of toprightNodes) {
            const oneNodeList = [];
            oneNodeList.push(node);
            const subregion = new Region(oneNodeList);
            this.subregions.push(subregion);
          }
        }
      }

      for (const subregion of this.subregions) {
        subregion.buildSubRegions();
      }
    }
  }

  // Force is a RepulsionForce
  applyForce(node, Force, theta) {
    if (this.nodes.length < 2) {
      const regionNode = this.nodes[0];
      Force.applyNodeRegion(node, regionNode);
    } else {
      const distance = Math.sqrt(
        (node.x - this.massCenterX) * (node.x - this.massCenterX) +
          (node.y - this.massCenterY) * (node.y - this.massCenterY)
      );
      if (distance * theta > this.size) {
        Force.applyNodeRegion(node, this);
      } else {
        for (const subregion of this.subregions) {
          subregion.applyForce(node, Force, theta);
        }
      }
    }
  }
}

module.exports = Region;
