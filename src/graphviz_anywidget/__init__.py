import importlib.metadata
from pathlib import Path

import anywidget
import traitlets

try:
    __version__ = importlib.metadata.version("pipefunc")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class GraphvizWidget(anywidget.AnyWidget):
    """A widget for rendering a Graphviz graph using d3-graphviz and graphvizsvg.

    Example:
    -------
    >>> dot_string = "digraph { a -> b; b -> c; c -> a; }"
    >>> widget = GraphvizWidget(dot_source=dot_string)
    >>> widget

    """

    _esm = Path(__file__).parent / "static" / "widget.js"

    _css = """
    #graph {
        margin: auto;
    }
    """

    dot_source = traitlets.Unicode("").tag(sync=True)
    selected_direction = traitlets.Unicode("bidirectional").tag(sync=True)
    search_type = traitlets.Unicode("included").tag(sync=True)
    case_sensitive = traitlets.Bool(False).tag(sync=True)  # noqa: FBT003
