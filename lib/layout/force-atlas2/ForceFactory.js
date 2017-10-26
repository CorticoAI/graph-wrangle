/*
 Originally from: https://github.com/gephi/gephi/blob/master/modules/LayoutPlugin/src/main/java/org/gephi/layout/plugin/forceAtlas2/ForceFactory.java
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
// import org.gephi.graph.api.Node;

/**
 * Generates the forces on demand, here are all the formulas for attraction and
 * repulsion.
 *
 */
class ForceFactory {
  buildRepulsion(adjustBySize, coefficient) {
    if (adjustBySize) {
      return new linRepulsion_antiCollision(coefficient);
    } else {
      return new linRepulsion(coefficient);
    }
  }

  getStrongGravity(coefficient) {
    return new strongGravity(coefficient);
  }

  buildAttraction(
    logAttraction,
    distributedAttraction,
    adjustBySize,
    coefficient
  ) {
    if (adjustBySize) {
      if (logAttraction) {
        if (distributedAttraction) {
          return new logAttraction_degreeDistributed_antiCollision(coefficient);
        } else {
          return new logAttraction_antiCollision(coefficient);
        }
      } else {
        if (distributedAttraction) {
          return new linAttraction_degreeDistributed_antiCollision(coefficient);
        } else {
          return new linAttraction_antiCollision(coefficient);
        }
      }
    } else {
      if (logAttraction) {
        if (distributedAttraction) {
          return new logAttraction_degreeDistributed(coefficient);
        } else {
          return new logAttraction(coefficient);
        }
      } else {
        if (distributedAttraction) {
          return new linAttraction_massDistributed(coefficient);
        } else {
          return new linAttraction(coefficient);
        }
      }
    }
  }
}

/*
 * Repulsion force: Linear
 */
class linRepulsion {
  constructor(c) {
    this.coefficient = c;
  }

  applyNodeNode(node1, node2) {
    // for now we just store the layout directly on the node object.
    const node1Layout = node1;
    const node2Layout = node2;

    // Get the distance
    const xDist = node1.x - node2.x;
    const yDist = node1.y - node2.y;
    const distance = Math.sqrt(xDist * xDist + yDist * yDist);

    if (distance > 0) {
      // NB: factor = force / distance
      const factor =
        this.coefficient *
        node1Layout.mass *
        node2Layout.mass /
        distance /
        distance;

      node1Layout.dx += xDist * factor;
      node1Layout.dy += yDist * factor;

      node2Layout.dx -= xDist * factor;
      node2Layout.dy -= yDist * factor;
    }
  }

  applyNodeRegion(node, region) {
    // for now we just store the layout directly on the node object.
    const nodeLayout = node;

    // Get the distance
    const xDist = node.x - region.massCenterX;
    const yDist = node.y - region.massCenterY;
    const distance = Math.sqrt(xDist * xDist + yDist * yDist);

    if (distance > 0) {
      // NB: factor = force / distance
      const factor =
        this.coefficient * nodeLayout.mass * region.mass / distance / distance;

      nodeLayout.dx += xDist * factor;
      nodeLayout.dy += yDist * factor;
    }
  }

  applyNodeGravity(node, gravity) {
    // for now we just store the layout directly on the node object.
    const nodeLayout = node;

    // Get the distance
    const xDist = node.x;
    const yDist = node.y;
    const distance = Math.sqrt(xDist * xDist + yDist * yDist);

    if (distance > 0) {
      // NB: factor = force / distance
      const factor = this.coefficient * nodeLayout.mass * gravity / distance;

      nodeLayout.dx -= xDist * factor;
      nodeLayout.dy -= yDist * factor;
    }
  }
}

/*
 * Repulsion force: Strong Gravity (as a Repulsion Force because it is easier)
 */
class linRepulsion_antiCollision {
  constructor(c) {
    this.coefficient = c;
  }

  applyNodeNode(node1, node2) {
    // for now we just store the layout directly on the node object.
    const node1Layout = node1;
    const node2Layout = node2;

    // Get the distance
    const xDist = node1.x - node2.x;
    const yDist = node1.y - node2.y;
    const node1Size = node1.size == null ? 1 : node1.size;
    const node2Size = node2.size == null ? 1 : node2.size;
    const distance =
      Math.sqrt(xDist * xDist + yDist * yDist) - node1Size - node2Size;

    if (distance > 0) {
      // NB: factor = force / distance
      const factor =
        this.coefficient *
        node1Layout.mass *
        node2Layout.mass /
        distance /
        distance;

      node1Layout.dx += xDist * factor;
      node1Layout.dy += yDist * factor;

      node2Layout.dx -= xDist * factor;
      node2Layout.dy -= yDist * factor;
    } else if (distance < 0) {
      const factor =
        100 * this.coefficient * node1Layout.mass * node2Layout.mass;

      node1Layout.dx += xDist * factor;
      node1Layout.dy += yDist * factor;

      node2Layout.dx -= xDist * factor;
      node2Layout.dy -= yDist * factor;
    }
  }

  applyNodeRegion(node, region) {
    // for now we just store the layout directly on the node object.
    const nodeLayout = node;

    // Get the distance
    const xDist = node.x - region.massCenterX;
    const yDist = node.y - region.massCenterY;
    const distance = Math.sqrt(xDist * xDist + yDist * yDist);

    if (distance > 0) {
      // NB: factor = force / distance
      const factor =
        this.coefficient * nodeLayout.mass * region.mass / distance / distance;

      nodeLayout.dx += xDist * factor;
      nodeLayout.dy += yDist * factor;
    } else if (distance < 0) {
      const factor =
        -this.coefficient * nodeLayout.mass * region.mass / distance;

      nodeLayout.dx += xDist * factor;
      nodeLayout.dy += yDist * factor;
    }
  }

  applyNodeGravity(node, gravity) {
    // for now we just store the layout directly on the node object.
    const nodeLayout = node;

    // Get the distance
    const xDist = node.x;
    const yDist = node.y;
    const distance = Math.sqrt(xDist * xDist + yDist * yDist);

    if (distance > 0) {
      // NB: factor = force / distance
      const factor = this.coefficient * nodeLayout.mass * gravity / distance;

      nodeLayout.dx -= xDist * factor;
      nodeLayout.dy -= yDist * factor;
    }
  }
}

class strongGravity {
  constructor(c) {
    this.coefficient = c;
  }

  applyNodeNode(node1, node2) {
    // Not Relevant
  }

  applyNodeRegion(node, region) {
    // Not Relevant
  }

  applyNodeGravity(node, gravity) {
    // for now we just store the layout directly on the node object.
    const nodeLayout = node;

    // Get the distance
    const xDist = node.x;
    const yDist = node.y;
    const distance = Math.sqrt(xDist * xDist + yDist * yDist);

    if (distance > 0) {
      // NB: factor = force / distance
      const factor = this.coefficient * nodeLayout.mass * gravity;

      nodeLayout.dx -= xDist * factor;
      nodeLayout.dy -= yDist * factor;
    }
  }
}

/*
 * Attraction force: Linear
 */
class linAttraction {
  constructor(c) {
    this.coefficient = c;
  }

  apply(node1, node2, edgeWeight) {
    // for now we just store the layout directly on the node object.
    const node1Layout = node1;
    const node2Layout = node2;

    // Get the distance
    const xDist = node1.x - node2.x;
    const yDist = node1.y - node2.y;

    // NB: factor = force / distance
    const factor = -this.coefficient * edgeWeight;

    node1Layout.dx += xDist * factor;
    node1Layout.dy += yDist * factor;

    node2Layout.dx -= xDist * factor;
    node2Layout.dy -= yDist * factor;
  }
}

/*
 * Attraction force: Linear, distributed by mass (typically, degree)
 */
class linAttraction_massDistributed {
  constructor(c) {
    this.coefficient = c;
  }

  apply(node1, node2, edgeWeight) {
    // for now we just store the layout directly on the node object.
    const node1Layout = node1;
    const node2Layout = node2;

    // Get the distance
    const xDist = node1.x - node2.x;
    const yDist = node1.y - node2.y;

    // NB: factor = force / distance
    const factor = -this.coefficient * edgeWeight / node1Layout.mass;

    node1Layout.dx += xDist * factor;
    node1Layout.dy += yDist * factor;

    node2Layout.dx -= xDist * factor;
    node2Layout.dy -= yDist * factor;
  }
}

/*
 * Attraction force: Logarithmic
 */
/* eslint-disable no-unused-vars */
class logAttraction {
  /* eslint-enable no-unused-vars */

  constructor(c) {
    this.coefficient = c;
  }

  apply(node1, node2, edgeWeight) {
    // for now we just store the layout directly on the node object.
    const node1Layout = node1;
    const node2Layout = node2;

    // Get the distance
    const xDist = node1.x - node2.x;
    const yDist = node1.y - node2.y;
    const distance = Math.sqrt(xDist * xDist + yDist * yDist);

    if (distance > 0) {
      // NB: factor = force / distance
      const factor =
        -this.coefficient * edgeWeight * Math.log(1 + distance) / distance;

      node1Layout.dx += xDist * factor;
      node1Layout.dy += yDist * factor;

      node2Layout.dx -= xDist * factor;
      node2Layout.dy -= yDist * factor;
    }
  }
}

/*
 * Attraction force: Linear, distributed by Degree
 */
class logAttraction_degreeDistributed {
  constructor(c) {
    this.coefficient = c;
  }

  apply(node1, node2, edgeWeight) {
    // for now we just store the layout directly on the node object.
    const node1Layout = node1;
    const node2Layout = node2;

    // Get the distance
    const xDist = node1.x - node2.x;
    const yDist = node1.y - node2.y;
    const distance = Math.sqrt(xDist * xDist + yDist * yDist);

    if (distance > 0) {
      // NB: factor = force / distance
      const factor =
        -this.coefficient *
        edgeWeight *
        Math.log(1 + distance) /
        distance /
        node1Layout.mass;

      node1Layout.dx += xDist * factor;
      node1Layout.dy += yDist * factor;

      node2Layout.dx -= xDist * factor;
      node2Layout.dy -= yDist * factor;
    }
  }
}

/*
 * Attraction force: Linear, with Anti-Collision
 */
class linAttraction_antiCollision {
  constructor(c) {
    this.coefficient = c;
  }

  apply(node1, node2, edgeWeight) {
    // for now we just store the layout directly on the node object.
    const node1Layout = node1;
    const node2Layout = node2;

    // Get the distance
    const xDist = node1.x - node2.x;
    const yDist = node1.y - node2.y;
    const node1Size = node1.size == null ? 1 : node1.size;
    const node2Size = node2.size == null ? 1 : node2.size;
    const distance =
      Math.sqrt(xDist * xDist + yDist * yDist) - node1Size - node2Size;

    if (distance > 0) {
      // NB: factor = force / distance
      const factor = -this.coefficient * edgeWeight;

      node1Layout.dx += xDist * factor;
      node1Layout.dy += yDist * factor;

      node2Layout.dx -= xDist * factor;
      node2Layout.dy -= yDist * factor;
    }
  }
}

/*
 * Attraction force: Linear, distributed by Degree, with Anti-Collision
 */
class linAttraction_degreeDistributed_antiCollision {
  constructor(c) {
    this.coefficient = c;
  }

  apply(node1, node2, edgeWeight) {
    // for now we just store the layout directly on the node object.
    const node1Layout = node1;
    const node2Layout = node2;

    // Get the distance
    const xDist = node1.x - node2.x;
    const yDist = node1.y - node2.y;
    const node1Size = node1.size == null ? 1 : node1.size;
    const node2Size = node2.size == null ? 1 : node2.size;
    const distance =
      Math.sqrt(xDist * xDist + yDist * yDist) - node1Size - node2Size;

    if (distance > 0) {
      // NB: factor = force / distance
      const factor = -this.coefficient * edgeWeight / node1Layout.mass;

      node1Layout.dx += xDist * factor;
      node1Layout.dy += yDist * factor;

      node2Layout.dx -= xDist * factor;
      node2Layout.dy -= yDist * factor;
    }
  }
}

/*
 * Attraction force: Logarithmic, with Anti-Collision
 */
class logAttraction_antiCollision {
  constructor(c) {
    this.coefficient = c;
  }

  apply(node1, node2, edgeWeight) {
    // for now we just store the layout directly on the node object.
    const node1Layout = node1;
    const node2Layout = node2;

    // Get the distance
    const xDist = node1.x - node2.x;
    const yDist = node1.y - node2.y;
    const node1Size = node1.size == null ? 1 : node1.size;
    const node2Size = node2.size == null ? 1 : node2.size;
    const distance =
      Math.sqrt(xDist * xDist + yDist * yDist) - node1Size - node2Size;

    if (distance > 0) {
      // NB: factor = force / distance
      const factor =
        -this.coefficient * edgeWeight * Math.log(1 + distance) / distance;

      node1Layout.dx += xDist * factor;
      node1Layout.dy += yDist * factor;

      node2Layout.dx -= xDist * factor;
      node2Layout.dy -= yDist * factor;
    }
  }
}

/*
 * Attraction force: Linear, distributed by Degree, with Anti-Collision
 */
class logAttraction_degreeDistributed_antiCollision {
  constructor(c) {
    this.coefficient = c;
  }

  apply(node1, node2, edgeWeight) {
    // for now we just store the layout directly on the node object.
    const node1Layout = node1;
    const node2Layout = node2;

    // Get the distance
    const xDist = node1.x - node2.x;
    const yDist = node1.y - node2.y;
    const node1Size = node1.size == null ? 1 : node1.size;
    const node2Size = node2.size == null ? 1 : node2.size;
    const distance =
      Math.sqrt(xDist * xDist + yDist * yDist) - node1Size - node2Size;

    if (distance > 0) {
      // NB: factor = force / distance
      const factor =
        -this.coefficient *
        edgeWeight *
        Math.log(1 + distance) /
        distance /
        node1Layout.mass;

      node1Layout.dx += xDist * factor;
      node1Layout.dy += yDist * factor;

      node2Layout.dx -= xDist * factor;
      node2Layout.dy -= yDist * factor;
    }
  }
}

// export singleton
module.exports = new ForceFactory();
