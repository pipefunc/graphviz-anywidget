import importlib.metadata
from pathlib import Path
from typing import Any

import anywidget
import ipywidgets
import traitlets

try:
    __version__ = importlib.metadata.version("graphviz-anywidget")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class GraphvizAnyWidget(anywidget.AnyWidget):
    """A widget for rendering a Graphviz graph using d3-graphviz and graphvizsvg.

    Example:
    -------
    >>> dot_source = "digraph { a -> b; b -> c; c -> a; }"
    >>> widget = GraphvizWidget(dot_source=dot_source)
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


def graphviz_widget(
    dot_source: str = "digraph { a -> b; b -> c; c -> a; }",
) -> ipywidgets.VBox:
    widget = GraphvizAnyWidget(dot_source=dot_source)
    reset_button = ipywidgets.Button(description="Reset Zoom")
    direction_selector = ipywidgets.Dropdown(
        options=["bidirectional", "downstream", "upstream", "single"],
        value="bidirectional",
        description="Direction:",
    )
    search_input = ipywidgets.Text(
        placeholder="Search...",
        description="Search:",
    )
    search_type_selector = ipywidgets.Dropdown(
        options=["exact", "included", "regex"],
        value="exact",
        description="Search Type:",
    )
    case_toggle = ipywidgets.ToggleButton(
        value=False,
        description="Case Sensitive",
        icon="check",
    )

    # Define button actions
    def reset_graph(_: Any) -> None:
        widget.send({"action": "reset_zoom"})

    def update_direction(change: dict) -> None:
        widget.selected_direction = change["new"]

    def perform_search(change: dict) -> None:
        widget.send({"action": "search", "query": change["new"]})

    def update_search_type(change: dict) -> None:
        widget.search_type = change["new"]

    def toggle_case_sensitive(change: dict) -> None:
        widget.case_sensitive = change["new"]

    reset_button.on_click(reset_graph)
    direction_selector.observe(update_direction, names="value")
    search_input.observe(perform_search, names="value")
    search_type_selector.observe(update_search_type, names="value")
    case_toggle.observe(toggle_case_sensitive, names="value")

    # Display ipywidgets
    return ipywidgets.VBox(
        [
            ipywidgets.HBox([reset_button, direction_selector]),
            ipywidgets.HBox([search_input, search_type_selector, case_toggle]),
            widget,
        ],
    )
