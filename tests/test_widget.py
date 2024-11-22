from graphviz_anywidget import GraphvizAnyWidget


def test_graphviz_anywidget() -> None:
    dot_string = "digraph { a -> b; b -> c; c -> a; }"
    widget = GraphvizAnyWidget(dot_source=dot_string)
    assert widget.dot_source == dot_string
