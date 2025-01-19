// js/react/Widget.jsx
import * as React from "react";
import { useModel, useModelState } from "@anywidget/react";
import * as d3 from "d3";
import "graphvizsvg";
import { graphviz as d3graphviz } from "d3-graphviz";
import { Logger } from "../logger";
import { search, getLegendElements, handleGraphvizSvgEvents } from "../helpers";
import Controls from "./Controls";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";


// Create a theme instance
const theme = createTheme({
  components: {
    MuiButton: {
      defaultProps: {
        size: "small",
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiSelect: {
      defaultProps: {
        size: "small",
      },
    },
  },
});

function Widget() {
  const model = useModel(); // Use useModel to get the model
  const widgetId = React.useRef(`graph-${Math.random().toString(36).substr(2, 9)}`).current;
  const [graphvizInstance, setGraphvizInstance] = React.useState(null);
  const currentSelection = React.useRef([]);

  const [selectedDirection, setSelectedDirection] = useModelState("selected_direction");
  const searchObject = React.useRef({
    type: model.get("search_type"),
    case: model.get("case_sensitive") ? "sensitive" : "insensitive",
    nodeName: true,
    nodeLabel: true,
    edgeLabel: true,
  });

  React.useEffect(() => {
    const el = document.getElementById(widgetId);
    el.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div id="controls-${widgetId}" style="padding: 16px;"></div>
        <div id="${widgetId}" style="text-align: center;"></div>
      </div>
    `;

    const initializeGraph = async () => {
      const d3graphvizInstance = d3graphviz(`#${widgetId}`, { useWorker: false });
      await new Promise((resolve) => {
        Logger.debug(`Widget ${widgetId}: D3 initialization complete`);
        d3graphvizInstance.on("initEnd", resolve);
      });

      let instance;
      await new Promise((resolve) => {
        $(`#${widgetId}`).graphviz({
          shrink: null,
          zoom: false,
          ready: function () {
            Logger.debug(`Widget ${widgetId}: Graph plugin initialization started`);
            instance = this;
            handleGraphvizSvgEvents(instance, $, currentSelection.current, () => selectedDirection);
            resolve();
            Logger.debug(`Widget ${widgetId}: Graph plugin initialization complete`);
          },
        });
      });

      setGraphvizInstance({ d3: d3graphvizInstance, instance });
    };

    initializeGraph();

    return () => {
      // Cleanup logic here (if needed)
    };
  }, [widgetId]);

  const renderGraph = React.useCallback(
    async (dotSource) => {
      if (!graphvizInstance) return;

      Logger.debug(`Widget ${widgetId}: Starting graph render`);
      const zoomEnabled = model.get("enable_zoom");

      graphvizInstance.d3
        .engine("dot")
        .fade(false)
        .tweenPaths(false)
        .tweenShapes(false)
        .zoomScaleExtent([0, Infinity])
        .zoomScaleExtent(zoomEnabled ? [0, Infinity] : [1, 1])
        .zoom(zoomEnabled)
        .on("end", () => {
          Logger.debug(`Widget ${widgetId}: Render complete`);
          const svg = $(`#${widgetId}`).data("graphviz.svg");
          if (svg) {
            svg.setup();
            if (!zoomEnabled) {
              d3.select(`#${widgetId} svg`).on(".zoom", null);
            }
            Logger.info(`Widget ${widgetId}: Setup successful`);
          } else {
            Logger.error(`Widget ${widgetId}: SVG initialization failed`);
          }
        })
        .renderDot(dotSource)
        .fit(true);
    },
    [graphvizInstance, model]
  );

  const resetGraph = () => {
    if (!graphvizInstance) return;
    Logger.debug("Graph reset triggered");
    graphvizInstance.d3.resetZoom();
    graphvizInstance.instance.highlight();
    currentSelection.current.length = 0;
  };

  const updateDirection = (newDirection) => {
    Logger.debug(`Direction updated to: ${newDirection}`);
    setSelectedDirection(newDirection);
    resetGraph();
  };

  const searchAndHighlight = (query) => {
    if (!graphvizInstance) return;
    Logger.debug(`Search triggered with query: ${query}`);
    const searchResults = search(query, searchObject.current, graphvizInstance.instance, $);
    const { legendNodes, legendEdges } = getLegendElements(graphvizInstance.instance, $);
    const nodesToHighlight = searchResults.nodes.add(legendNodes);
    const edgesToHighlight = searchResults.edges.add(legendEdges);
    graphvizInstance.instance.highlight(nodesToHighlight, edgesToHighlight);
  };

  React.useEffect(() => {
    renderGraph(model.get("dot_source"));
  }, [graphvizInstance, renderGraph, model]);

  React.useEffect(() => {
    const handleModelChange = () => {
      searchObject.current.type = model.get("search_type");
      searchObject.current.case = model.get("case_sensitive") ? "sensitive" : "insensitive";
    };

    model.on("change:search_type change:case_sensitive", handleModelChange);

    return () => {
      model.off("change:search_type change:case_sensitive", handleModelChange);
    };
  }, [model]);

  React.useEffect(() => {
    const handleDotSourceChange = () => {
      renderGraph(model.get("dot_source"));
    };

    model.on("change:dot_source", handleDotSourceChange);

    return () => {
      model.off("change:dot_source", handleDotSourceChange);
    };
  }, [model, renderGraph]);

  React.useEffect(() => {
    const handleDirectionChange = () => {
      updateDirection(model.get("selected_direction"));
    };

    model.on("change:selected_direction", handleDirectionChange);

    return () => {
      model.off("change:selected_direction", handleDirectionChange);
    };
  }, [model]);

  React.useEffect(() => {
    const handleZoomChange = () => {
      renderGraph(model.get("dot_source"));
    };

    model.on("change:enable_zoom", handleZoomChange);

    return () => {
      model.off("change:enable_zoom", handleZoomChange);
    };
  }, [model, renderGraph]);

  React.useEffect(() => {
    const handleCustomMessage = (msg) => {
      if (msg.action === "reset_zoom") {
        resetGraph();
      } else if (msg.action === "search") {
        searchAndHighlight(msg.query);
      }
    };

    model.on("msg:custom", handleCustomMessage);

    return () => {
      model.off("msg:custom", handleCustomMessage);
    };
  }, [model]);

  // Render the Controls component inside the Widget
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div id={widgetId}>
        <div id={`controls-${widgetId}`} style={{ padding: "16px" }}>
          <Controls />
        </div>
        <div id={`graph-${widgetId}`} style={{ textAlign: "center" }} />
      </div>
    </ThemeProvider>
  );
}

export default Widget;
