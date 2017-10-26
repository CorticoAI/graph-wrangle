# graph-wrangle

A command-line tool and library for wrangling network graph data



# Installation

```
$ npm install graph-wrangle
```

For drawing graphs, node-canvas is used which requires Cairo and Pango. For details about setting up node-canvas, [see their documentation](https://github.com/Automattic/node-canvas#installation). To install Cairo and Pango on OS X run: `brew install pkg-config cairo pango libpng jpeg giflib`.


# Sample Usage

From a command-line:

```
gw style -i examples/data/100nodes.json -k genre_like | \
  gw layout -a force-atlas2 -t 200 | \
  gw draw -o my_graph.png -w 600 -h 600
```