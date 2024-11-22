from graphviz_anywidget import GraphvizWidget


def test_widget() -> None:
    dot_string = "digraph { a -> b; b -> c; c -> a; }"
    pipe_func_graph_widget = GraphvizWidget(dot_source=dot_string)
    assert pipe_func_graph_widget.dot_source == dot_string
