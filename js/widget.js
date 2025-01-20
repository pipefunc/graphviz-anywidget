// widget.js

import * as d3 from "d3";
import "graphvizsvg";
import { graphviz as d3graphviz } from "d3-graphviz";
import { Logger } from "./logger";
import { search, getLegendElements, handleGraphvizSvgEvents } from "./helpers";

async function initialize({ model }) {}

async function render({ model, el }) {
  // Create a unique ID for this widget instance
  const widgetId = `graph-${Math.random().toString(36).substr(2, 9)}`;
  el.innerHTML = `<div id="${widgetId}" style="text-align: center;"></div>`;

  // CRITICAL: We must ensure the div exists before proceeding
  // This prevents the "__graphviz__" error that occurs when trying to
  // initialize d3-graphviz on a non-existent element
  await new Promise((resolve, reject) => {
    let attempts = 0;
    const checkElement = () => {
      const div = document.getElementById(widgetId);
      if (div) {
        Logger.debug(`Widget ${widgetId}: DOM element initialized`);
        resolve();
      } else if (attempts < 10) {
        Logger.debug(`Widget ${widgetId}: DOM element not found, attempt ${attempts + 1}/10`);
        attempts++;
        setTimeout(checkElement, 10); // check again in 10ms
      } else {
        Logger.error(`Widget ${widgetId}: Failed to initialize DOM element after 10 attempts`);
        reject(new Error(`Widget ${widgetId}: DOM element initialization failed`));
      }
    };
    checkElement();
  });

  // Initialize d3-graphviz and wait for it to be ready
  const d3graphvizInstance = d3graphviz(`#${widgetId}`, { useWorker: false });

  // Wait for initialization
  await new Promise((resolve) => {
    Logger.debug(`Widget ${widgetId}: D3 initialization complete`);
    d3graphvizInstance.on("initEnd", resolve);
  });

  const currentSelection = [];

  let selectedDirection = model.get("selected_direction") || "bidirectional";

  const searchObject = {
    type: model.get("search_type") || "included",
    case: model.get("case_sensitive") ? "sensitive" : "insensitive",
    nodeName: true,
    nodeLabel: true,
    edgeLabel: true,
  };

  let graphvizInstance;

  // Initialize the jquery-graphviz plugin and wait for it to be ready
  // This sets up the interactive features like highlighting
  await new Promise((resolve) => {
    $(`#${widgetId}`).graphviz({
      shrink: null,
      zoom: false,
      ready: function () {
        Logger.debug(`Widget ${widgetId}: Graph plugin initialization started`);
        graphvizInstance = this;
        handleGraphvizSvgEvents(
          graphvizInstance,
          $,
          currentSelection,
          () => selectedDirection,
          model
        );
        resolve(); // Signal that we're ready
        Logger.debug(`Widget ${widgetId}: Graph plugin initialization complete`);
      },
    });
  });

  // CRITICAL: This queue ensures that when multiple widgets are initialized,
  // their rendering operations happen sequentially rather than simultaneously
  // This prevents the "too late: already running" error from d3 transitions
  let renderQueue = Promise.resolve();

  const renderGraph = (dotSource) => {
    // Add this render operation to the queue
    renderQueue = renderQueue.then(() => {
      return new Promise((resolve) => {
        Logger.debug(`Widget ${widgetId}: Starting graph render`);
        const zoomEnabled = model.get("enable_zoom");
        d3graphvizInstance
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
              // If zoom is disabled, remove zoom behavior completely
              if (!zoomEnabled) {
                // Remove zoom behavior from the SVG
                d3.select(`#${widgetId} svg`).on(".zoom", null);
              }
              Logger.info(`Widget ${widgetId}: Setup successful`);
            } else {
              // This sometimes happens and I haven't been able to figure out why
              Logger.error(`Widget ${widgetId}: SVG initialization failed`);
            }
          })
          .renderDot(dotSource)
          .fit(true);
      });
    });

    return renderQueue; // Return the promise for the entire queue
  };

  const resetGraph = () => {
    Logger.debug("Graph reset triggered");
    d3graphvizInstance.resetZoom();
    graphvizInstance.highlight();
    currentSelection.length = 0;
  };

  const updateDirection = (newDirection) => {
    Logger.debug(`Direction updated to: ${newDirection}`);
    selectedDirection = newDirection;
    resetGraph();
  };

  const searchAndHighlight = (query) => {
    Logger.debug(`Search triggered with query: ${query}`);
    const searchResults = search(query, searchObject, graphvizInstance, $);
    const { legendNodes, legendEdges } = getLegendElements(graphvizInstance, $);
    const nodesToHighlight = searchResults.nodes.add(legendNodes);
    const edgesToHighlight = searchResults.edges.add(legendEdges);
    graphvizInstance.highlight(nodesToHighlight, edgesToHighlight);
  };

  model.on("change:search_type", () => {
    searchObject.type = model.get("search_type");
  });

  model.on("change:case_sensitive", () => {
    searchObject.case = model.get("case_sensitive") ? "sensitive" : "insensitive";
  });

  model.on("change:dot_source", async () => {
    await renderGraph(model.get("dot_source"));
  });

  model.on("change:selected_direction", () => {
    updateDirection(model.get("selected_direction"));
  });

  model.on("change:enable_zoom", async () => {
    await renderGraph(model.get("dot_source"));
  });

  model.on("change:freeze_scroll", async () => {
    const freezeScroll = model.get("freeze_scroll");
    const svg = d3.select(`#${widgetId} svg`);
    const zoomEnabled = model.get("enable_zoom");

    if (freezeScroll) {
      // Disable only scroll and zoom
      svg.on("wheel.zoom", null); // Disable scroll wheel zoom
      svg.on("mousedown.zoom", null); // Disable zoom on mousedown
      svg.on("touchstart.zoom", null); // Disable zoom on touchstart
      svg.on("touchmove.zoom", null); // Disable zoom on touchmove
      svg.on("touchend.zoom", null); // Disable zoom on touchend
      svg.on("touchcancel.zoom", null); // Disable zoom on touchcancel
    } else {
      // Re-enable zoom if not frozen and zoom is enabled
      if (zoomEnabled) {
        svg.call(d3graphvizInstance.zoomBehavior());
      }
    }
  });

  model.on("msg:custom", (msg) => {
    if (msg.action === "reset_zoom") {
      resetGraph();
    } else if (msg.action === "search") {
      searchAndHighlight(msg.query);
    }
  });

  await renderGraph(model.get("dot_source"));
}

export default { initialize, render };
