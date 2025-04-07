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
  const widgetElem = await new Promise((resolve, reject) => {
    let attempts = 0;
    const checkElement = () => {
      // document.queryElementById() and friends don't work with shadowRoot, so we use element reference
      const div = document.getElementById(widgetId) || el.querySelector(`#${widgetId}`);
      if (div) {
        Logger.debug(`Widget ${widgetId}: DOM element initialized`);
        resolve(div);
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
  const d3graphvizInstance = d3graphviz(widgetElem, { useWorker: false });

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
    $(widgetElem).graphviz({
      shrink: null,
      zoom: false,
      ready: function () {
        Logger.debug(`Widget ${widgetId}: Graph plugin initialization started`);
        graphvizInstance = this;
        handleGraphvizSvgEvents(graphvizInstance, $, currentSelection, () => selectedDirection);
        resolve(); // Signal that we're ready
        Logger.debug(`Widget ${widgetId}: Graph plugin initialization complete`);
      },
    });
  });

  const renderGraph = (dotSource) => {
    // Directly return the promise from d3-graphviz render process
    return new Promise((resolve, reject) => { // Wrap in a promise that resolves on 'end'
      Logger.debug(`Widget ${widgetId}: Starting graph render`);
      const zoomEnabled = model.get("enable_zoom");
      try {
        d3graphvizInstance
          .engine("dot")
          .fade(false)
          .tweenPaths(false)
          .tweenShapes(false)
          .zoomScaleExtent([0, Infinity])
          .zoomScaleExtent(zoomEnabled ? [0, Infinity] : [1, 1])
          .zoom(zoomEnabled)
          .on("end", () => {
            Logger.debug(`Widget ${widgetId}: Render complete ('end' event)`);
            const svg = $(widgetElem).data("graphviz.svg");
            if (svg) {
              svg.setup();
              if (!zoomEnabled) {
                d3.select(widgetElem.querySelector('svg')).on(".zoom", null);
              }
              Logger.info(`Widget ${widgetId}: Setup successful`);
            } else {
              Logger.error(`Widget ${widgetId}: SVG initialization failed`);
            }
            resolve(); // Resolve the promise when render finishes
          })
          .renderDot(dotSource)
          .fit(true);
        Logger.debug(`Widget ${widgetId}: renderDot called`); // Add log here
      } catch (error) {
         Logger.error(`Widget ${widgetId}: Error during renderDot call:`, error);
         reject(error); // Reject the promise on error
      }
    });
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
    Logger.debug(`Search type updated to: ${model.get("search_type")}`);
    searchObject.type = model.get("search_type");
  });

  model.on("change:case_sensitive", () => {
    Logger.debug(`Case sensitive updated to: ${model.get("case_sensitive")}`);
    searchObject.case = model.get("case_sensitive") ? "sensitive" : "insensitive";
  });

  model.on("change:dot_source", async () => {
    const newSource = model.get("dot_source"); // Get source outside log
    Logger.debug(`Dot source change detected. Length: ${newSource.length}`); // Modified log
    try {
      await renderGraph(newSource); // Await the promise that resolves on 'end'
      Logger.debug("renderGraph awaited successfully.");
    } catch (error) {
       Logger.error("Error awaiting renderGraph:", error);
    }
  });

  model.on("change:selected_direction", () => {
    Logger.debug(`Selected direction updated to: ${model.get("selected_direction")}`);
    updateDirection(model.get("selected_direction"));
  });

  model.on("change:enable_zoom", async () => {
    Logger.debug(`Enable zoom updated to: ${model.get("enable_zoom")}`);
    await renderGraph(model.get("dot_source"));
  });

  model.on("change:freeze_scroll", async () => {
    Logger.debug(`Freeze scroll updated to: ${model.get("freeze_scroll")}`);
    const freezeScroll = model.get("freeze_scroll");
    const svg = d3.select(widgetElem.querySelector('svg'));
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
        Logger.debug(`Re-enabling zoom`);
        svg.call(d3graphvizInstance.zoomBehavior());
      }
    }
  });

  model.on("msg:custom", (msg) => {
    Logger.debug(`Custom message received: ${msg.action}`);
    if (msg.action === "reset_zoom") {
      Logger.debug(`Resetting zoom`);
      resetGraph();
    } else if (msg.action === "search") {
      Logger.debug(`Searching and highlighting`);
      searchAndHighlight(msg.query);
    }
  });

  // Initial render
  try {
      await renderGraph(model.get("dot_source"));
      Logger.debug("Initial render completed.");
  } catch(error) {
      Logger.error("Error during initial render:", error);
  }
}

export default { initialize, render };
