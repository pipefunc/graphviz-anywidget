import pytest
from graphviz_anywidget import (
    GraphvizAnyWidget,
    graphviz_widget_simple,
    graphviz_widget,
)
from ipywidgets import VBox, HBox, Button, Dropdown, Text, ToggleButton


def test_graphviz_anywidget() -> None:
    dot_string = "digraph { a -> b; b -> c; c -> a; }"
    widget = GraphvizAnyWidget(dot_source=dot_string)
    assert widget.dot_source == dot_string


# Test data
SIMPLE_DOT = "digraph { a -> b; }"
COMPLEX_DOT = """
digraph {
    a -> b;
    b -> c;
    c -> d;
    d -> a;
    a -> c;
}
"""


def test_graphviz_anywidget_initialization() -> None:
    """Test basic widget initialization."""
    widget = GraphvizAnyWidget(dot_source=SIMPLE_DOT)
    assert widget.dot_source == SIMPLE_DOT
    assert widget.selected_direction == "bidirectional"
    assert widget.search_type == "included"
    assert widget.case_sensitive is False
    assert widget.enable_zoom is True


def test_graphviz_widget_simple_default() -> None:
    """Test simple widget with default settings."""
    widget = graphviz_widget_simple()
    assert isinstance(widget, GraphvizAnyWidget)
    assert widget.enable_zoom is True
    assert widget.dot_source != ""


def test_graphviz_widget_simple_custom() -> None:
    """Test simple widget with custom settings."""
    widget = graphviz_widget_simple(dot_source=COMPLEX_DOT, enable_zoom=False)
    assert isinstance(widget, GraphvizAnyWidget)
    assert widget.enable_zoom is False
    assert widget.dot_source == COMPLEX_DOT


def test_graphviz_widget_full_structure() -> None:
    """Test full widget structure and components."""
    widget = graphviz_widget(COMPLEX_DOT)

    # Test overall structure
    assert isinstance(widget, VBox)
    assert len(widget.children) == 2

    # Test control row 1 (reset and direction)
    control_row1 = widget.children[0]
    assert isinstance(control_row1, HBox)
    assert len(control_row1.children) == 6
    assert isinstance(control_row1.children[0], Button)  # Reset button
    assert isinstance(control_row1.children[1], ToggleButton)  # Freeze scroll button
    assert isinstance(control_row1.children[2], Dropdown)  # Direction selector
    assert isinstance(control_row1.children[3], Text)  # Search input
    assert isinstance(control_row1.children[4], Dropdown)  # Search type
    assert isinstance(control_row1.children[5], ToggleButton)  # Case sensitive

    # Test graph widget
    assert isinstance(widget.children[-1], GraphvizAnyWidget)


def test_graphviz_widget_direction_options() -> None:
    """Test direction selector options in full widget."""
    widget = graphviz_widget()
    direction_selector = widget.children[0].children[2]
    assert set(direction_selector.options) == {
        "bidirectional",
        "downstream",
        "upstream",
        "single",
    }


def test_graphviz_widget_search_type_options() -> None:
    """Test search type options in full widget."""
    widget = graphviz_widget()
    search_type_selector = widget.children[0].children[4]
    assert set(search_type_selector.options) == {"exact", "included", "regex"}


def test_graphviz_widget_invalid_dot() -> None:
    """Test widget behavior with invalid DOT source."""
    invalid_dot = "invalid dot source"
    widget = graphviz_widget(invalid_dot)
    assert widget.children[-1].dot_source == invalid_dot


@pytest.mark.parametrize(
    "dot_source",
    [
        "",  # Empty string
        "digraph {}",  # Empty graph
        SIMPLE_DOT,  # Simple graph
        COMPLEX_DOT,  # Complex graph
    ],
)
def test_graphviz_widget_various_inputs(dot_source: str) -> None:
    """Test widget with various DOT source inputs."""
    simple_widget = graphviz_widget_simple(dot_source)
    full_widget = graphviz_widget(dot_source)

    assert simple_widget.dot_source == dot_source
    assert full_widget.children[-1].dot_source == dot_source
