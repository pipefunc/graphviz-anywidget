# graphviz-anywidget

[![PyPI version](https://badge.fury.io/py/graphviz-anywidget.svg)](https://badge.fury.io/py/graphviz-anywidget)
[![Python Version](https://img.shields.io/pypi/pyversions/graphviz-anywidget.svg)](https://pypi.org/project/graphviz-anywidget/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Interactive Graphviz visualization widget for Jupyter notebooks using anywidget.
Graphviz is provided via WASM ([hpcc-js-wasm](https://github.com/hpcc-systems/hpcc-js-wasm)) and the rendering is done using [graphvizsvg](https://github.com/pipefunc/graphvizsvg) and [d3-graphviz](https://github.com/magjac/d3-graphviz), inspired by the VS Code extension [Graphviz Interactive Preview](https://github.com/tintinweb/vscode-interactive-graphviz/).

https://github.com/user-attachments/assets/74cf39c5-2d64-4c98-b3ee-cf7308753da6

https://github.com/user-attachments/assets/8947dfd1-5d4a-43b9-b0c7-22cb52f72dc3

## Features

* 🎨 Interactive SVG visualization of Graphviz DOT graphs
* 🔍 Search functionality with regex support
* 🎯 Node and edge highlighting
* ↔️ Directional graph traversal
* 🔄 Zoom reset functionality
* 📱 Responsive design
* 🎨 Smooth animations and transitions
* 💻 Works in JupyterLab, Jupyter Notebook, and VS Code

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
from graphviz_anywidget import graphviz_widget

# Create a widget with a DOT string
dot_source = """
digraph {
    a -> b;
    b -> c;
    c -> a;
}
"""
widget = graphviz_widget(dot_source)
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

### graphviz_widget

```python
def graphviz_widget(dot_source: str = "digraph { a -> b; }") -> widgets.VBox:
    """Create an interactive Graphviz widget.

    Parameters
    ----------
    dot_source
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

## License

MIT

## Credits

Built with:
- [anywidget](https://github.com/manzt/anywidget)
- [graphvizsvg](https://www.npmjs.com/package/graphvizsvg)
- [d3-graphviz](https://www.npmjs.com/package/d3-graphviz)
- The WASM binary comes from [@hpcc-js/wasm](https://github.com/hpcc-systems/hpcc-js-wasm) (via `d3-graphviz`)
- Inspired by the VS Code extension [Graphviz Interactive Preview](https://github.com/tintinweb/vscode-interactive-graphviz/).
