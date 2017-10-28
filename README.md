# graph-wrangle

A command-line tool and library for wrangling network graph data



## Installation

```
$ npm install graph-wrangle
```

For drawing graphs, node-canvas is used which requires Cairo and Pango. For details about setting up node-canvas, [see their documentation](https://github.com/Automattic/node-canvas#installation). To install Cairo and Pango on OS X run: `brew install pkg-config cairo pango libpng jpeg giflib`.


## Sample Usage

From a command-line:

```
graph-wrangle style -i examples/data/100nodes.json -k genre_like | \
  graph-wrangle layout -a force-atlas2 -t 200 | \
  graph-wrangle draw -o my_graph.png -w 600 -h 600
```

Using a pipeline config file (typically named `graph-wrangle.config.json` or `.js`)

```
graph-wrangle pipeline --config graph-wrangle.config.json
```

See the examples folder for example pipeline config JSON and sample graph datasets.

Note that depending how you installed it, you may need to run `bin/graph-wrangle.js` instead of just typing `graph-wrangle`.

## Examples

### Pipeline with Shared Input/Output

Run a pipeline with generated output filenames based on the input filename. Available tokens in the pipeline config json are:

* **[name]** The input graph filename without the json extension (e.g. mygraph.json becomes mygraph)
* **[timestamp]** The timestamp when the script was run (YYYY-MM-DD-HHmmss)

Example usage:

```
graph-wrangle pipeline --config examples/pipeline_shared_io.json -i examples/data/100nodes.json
```
