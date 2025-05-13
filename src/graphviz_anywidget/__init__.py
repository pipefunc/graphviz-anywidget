import importlib.metadata
from pathlib import Path
from typing import Any, Literal, get_args, Sequence, Callable

import anywidget
import ipywidgets
import traitlets

try:
    __version__ = importlib.metadata.version("graphviz-anywidget")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"

_CSS = """
div[id^="graph-"] {
    margin: auto;
}
"""


class GraphvizAnyWidget(anywidget.AnyWidget):
    """A widget for rendering a Graphviz graph using d3-graphviz and graphvizsvg.

    Example:
    -------
    >>> dot_source = "digraph { a -> b; b -> c; c -> a; }"
    >>> widget = GraphvizWidget(dot_source=dot_source)
    >>> widget

    """

    _esm = Path(__file__).parent / "static" / "widget.js"
    _css = _CSS

    dot_source = traitlets.Unicode("").tag(sync=True)
    selected_direction = traitlets.Unicode("bidirectional").tag(sync=True)
    search_type = traitlets.Unicode("included").tag(sync=True)
    case_sensitive = traitlets.Bool(False).tag(sync=True)  # noqa: FBT003
    enable_zoom = traitlets.Bool(True).tag(sync=True)
    freeze_scroll = traitlets.Bool(False).tag(sync=True)  # noqa: FBT003


Controls = Literal["zoom", "search", "direction"]


def graphviz_widget(
    dot_source: str = "digraph { a -> b; b -> c; c -> a; }",
    controls: bool | Controls | list[Controls] = True,
    extra_controls_factory: Callable[
        [GraphvizAnyWidget], ipywidgets.Widget | Sequence[ipywidgets.Widget] | None
    ]
    | None = None,
) -> ipywidgets.VBox:
    """Create a full-featured interactive Graphviz visualization widget.

    Parameters
    ----------
    dot_source
        The DOT language string representing the graph.
        Default is a simple cyclic graph: "digraph { a -> b; b -> c; c -> a; }"
    controls
        Controls to display above the graph. Can be:

        - ``True``: show all controls
        - ``False``: hide all controls
        - ``"zoom"``: show only zoom-related controls (reset and freeze scroll)
        - ``"search"``: show only search-related controls (search box, type selector, case toggle)
        - ``"direction"``: show only direction selector
        - list of the above strings to show multiple control groups

        Default is True (show all controls).
    extra_controls_factory
        A function that takes the `GraphvizAnyWidget` instance as input
        and returns an extra widget or sequence of widgets to display
        above the standard controls. This allows creating custom controls
        that interact with the graph widget.

    Returns
    -------
    ipywidgets.VBox
        A widget container with the following components:
        - Reset zoom button
        - Direction selector (bidirectional/downstream/upstream/single)
        - Search functionality with type selection and case sensitivity
        - Interactive graph visualization

    Notes
    -----
    The widget provides the following interactive features:
    - Zoom and pan functionality
    - Node/edge search with regex support
    - Directional graph traversal
    - Interactive highlighting
    - Case-sensitive search option

    Examples
    --------
    >>> from graphviz_anywidget import graphviz_widget
    >>> dot = '''
    ... digraph {
    ...     a -> b;
    ...     b -> c;
    ...     c -> a;
    ... }
    ... '''
    >>> widget = graphviz_widget(dot)
    >>> widget  # Display in notebook
    """
    widget = GraphvizAnyWidget(dot_source=dot_source)
    reset_button = ipywidgets.Button(
        description="Reset",
        layout=ipywidgets.Layout(width="auto"),
        icon="refresh",
        button_style="warning",
    )
    freeze_toggle = ipywidgets.ToggleButton(
        value=False,
        description="Freeze Scroll",
        icon="snowflake-o",
        layout=ipywidgets.Layout(width="auto"),
        button_style="primary",
    )
    direction_selector = ipywidgets.Dropdown(
        options=["bidirectional", "downstream", "upstream", "single"],
        value="bidirectional",
        description="Direction:",
        layout=ipywidgets.Layout(width="auto"),
    )
    search_input = ipywidgets.Text(
        placeholder="Search...",
        description="Search:",
        layout=ipywidgets.Layout(width="200px"),
    )
    search_type_selector = ipywidgets.Dropdown(
        options=["exact", "included", "regex"],
        value="exact",
        description="Search Type:",
        layout=ipywidgets.Layout(width="auto"),
    )
    case_toggle = ipywidgets.ToggleButton(
        value=False,
        description="Case Sensitive",
        icon="font",
        layout=ipywidgets.Layout(width="auto"),
    )

    # Define button actions
    def reset_graph(_: Any) -> None:
        widget.send({"action": "reset_zoom"})

    def toggle_freeze_scroll(change: dict) -> None:
        widget.freeze_scroll = change["new"]
        if widget.freeze_scroll:
            freeze_toggle.description = "Unfreeze Scroll"
            freeze_toggle.button_style = "danger"
        else:
            freeze_toggle.description = "Freeze Scroll"
            freeze_toggle.button_style = "primary"

    def update_direction(change: dict) -> None:
        widget.selected_direction = change["new"]

    def perform_search(change: dict) -> None:
        widget.send({"action": "search", "query": change["new"]})

    def update_search_type(change: dict) -> None:
        widget.search_type = change["new"]

    def toggle_case_sensitive(change: dict) -> None:
        widget.case_sensitive = change["new"]

    reset_button.on_click(reset_graph)
    freeze_toggle.observe(toggle_freeze_scroll, names="value")
    direction_selector.observe(update_direction, names="value")
    search_input.observe(perform_search, names="value")
    search_type_selector.observe(update_search_type, names="value")
    case_toggle.observe(toggle_case_sensitive, names="value")

    zoom_widgets = [reset_button, freeze_toggle]
    search_widgets = [search_input, search_type_selector, case_toggle]

    controls_box = ipywidgets.HBox(
        [*zoom_widgets, direction_selector, *search_widgets],
        layout=ipywidgets.Layout(margin="8px"),
    )

    # Set visibility of controls based on the `controls` parameter
    if isinstance(controls, bool):
        if not controls:
            controls_box.layout.visibility = "hidden"
    else:
        if isinstance(controls, str):
            controls = [controls]
        for w in controls_box.children:
            w.layout.visibility = "hidden"
        for control in controls:
            if control == "search":
                for w in search_widgets:
                    w.layout.visibility = "visible"
            elif control == "zoom":
                for w in zoom_widgets:
                    w.layout.visibility = "visible"
            elif control == "direction":
                direction_selector.layout.visibility = "visible"
            else:
                options = get_args(Controls)
                msg = (
                    f"Unknown control: `{control}`."
                    f" Valid options are: {', '.join(options)} or lists of them."
                )
                raise ValueError(msg)

    # Call the factory to get extra controls, if provided
    extra_widget_list: list[ipywidgets.Widget] = []
    if extra_controls_factory:
        created_widgets = extra_controls_factory(widget)
        if created_widgets:
            if isinstance(created_widgets, ipywidgets.Widget):
                extra_widget_list = [created_widgets]
            else:
                extra_widget_list = list(created_widgets)

    return ipywidgets.VBox([*extra_widget_list, controls_box, widget])


def graphviz_widget_simple(
    dot_source: str = "digraph { a -> b; b -> c; c -> a; }",
    enable_zoom: bool = True,
) -> GraphvizAnyWidget:
    """Create a simple Graphviz widget with optional zooming functionality.

    Parameters
    ----------
    dot_source
        The DOT string representing the graph
    enable_zoom
        Whether to enable zoom functionality

    Returns
    -------
    GraphvizAnyWidget
        A widget displaying the graph with optional zoom functionality
    """
    return GraphvizAnyWidget(dot_source=dot_source, enable_zoom=enable_zoom)
