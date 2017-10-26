const debug = require('debug')('graph-wrangle:normalize');
const d3 = require('d3');

/**
 * Ensure each field has expected properties including data-type and extent
 */
function transformMeta(meta, nodes) {
  const fieldsToAdd = [];

  let newFields = meta.fields.map(field => {
    field = { ...field }; // copy the field

    // interpret format strings with d3 format
    if (field.format) {
      field.format = d3.format(field.format);
    } else {
      field.format = d => d;
    }

    if (!field['data-type']) {
      switch (field.type) {
        case 'integer':
        case 'number':
          field['data-type'] = 'numeric';
          break;
        case 'string':
        case 'boolean':
          field['data-type'] = 'categorical';
          break;
        default:
          field['data-type'] = 'none';
      }
    }

    if (field['data-type'] === 'numeric' && !field.extent) {
      field.extent = d3.extent(nodes, d => d[field.name]);
    }

    // add label default if not there
    if (!field.label) {
      field.label = field.name;
    }

    // augment field if necessary
    if (field.type === 'twitter-user-id') {
      fieldsToAdd.push({
        name: '__twitterUser',
        type: 'twitter-user',
        label: 'Twitter User',
        'data-type': 'none',
        twitterField: field.name,
      });

      fieldsToAdd.push({
        name: '__twitterData',
        type: 'twitter-data',
        label: 'Twitter Data',
        'data-type': 'none',
        twitterField: field.name,
      });
    }

    return field;
  });

  // add any augmented fields (e.g. twitter data and user)
  newFields = newFields.concat(fieldsToAdd);

  // create new object to prevent mutating original
  const newMeta = {
    ...meta,
    fields: newFields,
  };

  return newMeta;
}

/**
 * Transform nodes mapping the id field to `id` for simplicity throughout
 * the codebase.
 */
function transformNodes(nodes, meta) {
  const { fields } = meta;
  let idField = fields.find(d => d.type === 'node-id');

  if (idField == null) {
    debug("No field with type node-id found. Assuming 'id'.");
    idField = { name: 'id' };
  }

  const newNodes = nodes.map(d => ({
    ...d,
    id: d[idField.name],
  }));

  return newNodes;
}

/**
 * Transform links into what d3-force expects
 * converts from [s, t] to { source: node_s, target: node_t }
 * Need to convert to actual objects since d3 expands it to that state
 * when running force. By doing it immediately, it means derivations done
 * in graphStore always receive the same form.
 */
function transformLinks(links, nodes) {
  // if already transformed, just create copies
  if (
    links.length &&
    !Array.isArray(links[0]) &&
    typeof links[0] === 'object'
  ) {
    return links.map(link => ({ ...link }));
  }

  const nodesById = d3
    .nest()
    .key(d => d.id)
    .rollup(d => d[0])
    .object(nodes);

  // keep track of node IDs that are not in nodesById
  let missingNodes = [];

  const transformedLinks = links
    .map(link => {
      const source = nodesById[link[0]];
      const target = nodesById[link[1]];
      const weight = link[2];

      // we need to ensure that both source and target nodes exist otherwise the layout
      // algorithm from d3-force fails.
      if (source == null || target == null) {
        if (source == null) {
          missingNodes.push(link[0]);
        }

        if (target == null) {
          missingNodes.push(link[1]);
        }

        return null;
      }

      const expandedLink = { source, target };

      if (weight != null) {
        expandedLink.weight = weight;
      }

      return expandedLink;
    })
    .filter(d => d); // filter out the nulls

  if (missingNodes.length) {
    // keep only the first occurrence of each node ID
    missingNodes = missingNodes.filter((d, i, a) => a.indexOf(d) === i);
    console.warn(
      'Found links for nodes that are not in the dataset. Removing all links with node IDs: ' +
        missingNodes.join(', ')
    );
  }

  return transformedLinks;
}

/**
 * Transform graphs to be in a normal form:
 * - copies of nodes are made with `id` field
 * - links are expanded to be { source:node, target:node, weight:?number }
 * - meta is created with fields and all fields have expected properties
 */
function normalizeGraph(graph) {
  let { nodes, links, meta } = graph;
  meta = meta || { fields: [] };

  debug('Transforming graph into normal form.');

  const transformedMeta = transformMeta(meta, nodes);
  const transformedNodes = transformNodes(nodes, transformedMeta);
  const transformedLinks = transformLinks(links, transformedNodes);

  return {
    nodes: transformedNodes,
    links: transformedLinks,
    meta: transformedMeta,
  };
}

module.exports = normalizeGraph;
