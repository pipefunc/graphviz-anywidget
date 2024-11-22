# graphviz-anywidget

Interactive Graphviz visualization widget for Jupyter notebooks using anywidget.
Graphviz is provided via WASM ([hpcc-js-wasm](https://github.com/hpcc-systems/hpcc-js-wasm)) and the rendering is done using [graphvizsvg](https://github.com/pipefunc/graphvizsvg) and [d3-graphviz](https://github.com/magjac/d3-graphviz).

## Features

* 🎨 Interactive SVG visualization of Graphviz DOT graphs
* 🔍 Search functionality with regex support
* 🎯 Node and edge highlighting
* ↔️ Directional graph traversal
* 🔄 Zoom reset functionality
* 📱 Responsive design
* 🎨 Smooth animations and transitions
* 💻 Works in JupyterLab and Jupyter Notebook

## Installation

```sh
pip install graphviz-anywidget
```

or with [uv](https://github.com/astral-sh/uv):

```sh
uv add graphviz-anywidget
```

## Usage

```python
from graphviz_anywidget import graph_widget

# Create a widget with a DOT string
dot_string = """
digraph {
    a -> b;
    b -> c;
    c -> a;
}
"""
widget = graph_widget(dot_string)
widget
```

### Features

1. **Search**: Use the search box to find nodes and edges
   - Supports exact match, substring, and regex search
   - Case-sensitive option available

2. **Direction Selection**: Choose how to traverse the graph
   - Bidirectional: Show connections in both directions
   - Downstream: Show only outgoing connections
   - Upstream: Show only incoming connections
   - Single: Show only the selected node

3. **Zoom Reset**: Reset the graph to its original position and scale

## API

### graph_widget

```python
def graph_widget(dot_string: str = "digraph { a -> b; }") -> widgets.VBox:
    """Create an interactive Graphviz widget.
    
    Parameters
    ----------
    dot_string
        The DOT string representing the graph
    
    Returns
    -------
    widgets.VBox
        The widget containing the graph and controls
    """
```

## Dependencies

- anywidget
- ipywidgets
- graphvizsvg (npm package)
- d3-graphviz (npm package)
- hpcc-js-wasm (npm package)

## Development

We recommend using [uv](https://github.com/astral-sh/uv) for development.
It will automatically manage virtual environments and dependencies for you.

```sh
uv run jupyter lab example.ipynb
```

Alternatively, create and manage your own virtual environment:

```sh
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
jupyter lab example.ipynb
```

The widget front-end code bundles it's JavaScript dependencies. After setting up Python,
make sure to install these dependencies locally:

```sh
npm install
```

While developing, you can run the following in a separate terminal to automatically
rebuild JavaScript as you make changes:

```sh
npm run dev
```

Open `example.ipynb` in JupyterLab, VS Code, or your favorite editor
to start developing. Changes made in `js/` will be reflected
in the notebook.

## Implementation Notes

- The WASM binary is embedded in the JavaScript bundle as base64
- We override the fetch API to intercept WASM file requests
- Web Worker mode is disabled to ensure consistent WASM loading
- This approach works in any Jupyter environment without needing a separate file server

## License

MIT

## Credits

Built with:
- [anywidget](https://github.com/manzt/anywidget)
- [graphvizsvg](https://www.npmjs.com/package/graphvizsvg)
- [d3-graphviz](https://www.npmjs.com/package/d3-graphviz)
- The WASM binary comes from [@hpcc-js/wasm](https://github.com/hpcc-systems/hpcc-js-wasm) (via `d3-graphviz`)