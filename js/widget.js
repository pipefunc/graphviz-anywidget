// widget.js

import * as d3 from "d3";
import "graphvizsvg";
import { graphviz as d3graphviz } from "d3-graphviz";

const Logger = {
  DEBUG: false, // Can be controlled via environment or initialization

  debug(...args) {
    if (this.DEBUG) {
      console.debug("🔍 [DEBUG]", ...args);
    }
  },

  info(...args) {
    console.info("ℹ️ [INFO]", ...args);
  },

  warn(...args) {
    console.warn("⚠️ [WARN]", ...args);
  },

  error(...args) {
    console.error("❌ [ERROR]", ...args);
  },
};

function getLegendElements(graphvizInstance, $) {
  const legendNodes = [];
  const legendEdges = [];

  graphvizInstance.nodes().each(function () {
    const $node = $(this);
    if ($node.attr("data-name").startsWith("legend_")) {
      legendNodes.push($node[0]);
    }
  });

  graphvizInstance.edges().each(function () {
    const $edge = $(this);
    if ($edge.attr("data-name").startsWith("legend_")) {
      legendEdges.push($edge[0]);
    }
  });
  return { legendNodes: $(legendNodes), legendEdges: $(legendEdges) };
}

function findEdges(text, searchFunction, graphvizInstance, $) {
  const $set = $();
  graphvizInstance.edges().each((index, edge) => {
    if (edge.textContent && searchFunction(text, edge.textContent)) {
      $set.push(edge);
    }
  });
  return $set;
}

function findNodes(text, searchFunction, nodeName, nodeLabel, graphvizInstance, $) {
  const $set = $();
  const nodes = graphvizInstance.nodesByName();

  for (const [nodeID, node] of Object.entries(nodes)) {
    if (
      (nodeName && searchFunction(text, nodeID)) ||
      (nodeLabel && node.textContent && searchFunction(text, node.textContent))
    ) {
      $set.push(node);
    }
  }
  return $set;
}

function search(text, searchObject, graphvizInstance, $) {
  let searchFunction;

  switch (searchObject.type) {
    case "exact":
      searchFunction = (search, str) => str.trim() === search.trim();
      break;
    case "included":
      searchFunction = (search, str) => {
        const searchStr = searchObject.case === "insensitive" ? search.toLowerCase() : search;
        const valStr = searchObject.case === "insensitive" ? str.toLowerCase() : str;
        return valStr.indexOf(searchStr) !== -1;
      };
      break;
    case "regex":
      searchFunction = (search, str) => {
        const regex = new RegExp(search, searchObject.case === "insensitive" ? "i" : undefined);
        return !!str.trim().match(regex);
      };
      break;
  }

  let $edges = $();
  if (searchObject.edgeLabel) {
    $edges = findEdges(text, searchFunction, graphvizInstance, $);
  }

  let $nodes = $();
  if (searchObject.nodeLabel || searchObject.nodeName) {
    $nodes = findNodes(
      text,
      searchFunction,
      searchObject.nodeName,
      searchObject.nodeLabel,
      graphvizInstance,
      $
    );
  }
  return { nodes: $nodes, edges: $edges };
}

function getConnectedNodes(nodeSet, mode, graphvizInstance) {
  let resultSet = $().add(nodeSet);
  const nodes = graphvizInstance.nodesByName();

  nodeSet.each((i, el) => {
    if (mode === "single") {
      resultSet = resultSet.add(el);
    } else if (el.className.baseVal === "edge") {
      const [startNode, endNode] = $(el).data("name").split("->");
      if ((mode === "bidirectional" || mode === "upstream") && startNode) {
        resultSet = resultSet
          .add(nodes[startNode])
          .add(graphvizInstance.linkedTo(nodes[startNode], true));
      }
      if ((mode === "bidirectional" || mode === "downstream") && endNode) {
        resultSet = resultSet
          .add(nodes[endNode])
          .add(graphvizInstance.linkedFrom(nodes[endNode], true));
      }
    } else {
      if (mode === "bidirectional" || mode === "upstream") {
        resultSet = resultSet.add(graphvizInstance.linkedTo(el, true));
      }
      if (mode === "bidirectional" || mode === "downstream") {
        resultSet = resultSet.add(graphvizInstance.linkedFrom(el, true));
      }
    }
  });
  return resultSet;
}

function highlightSelection(graphvizInstance, currentSelection, $) {
  let highlightedNodes = $();
  let highlightedEdges = $();

  currentSelection.forEach((selection) => {
    const nodes = getConnectedNodes(selection.set, selection.direction, graphvizInstance);
    highlightedNodes = highlightedNodes.add(nodes);
  });

  const { legendNodes, legendEdges } = getLegendElements(graphvizInstance, $);
  highlightedNodes = highlightedNodes.add(legendNodes);
  highlightedEdges = highlightedEdges.add(legendEdges);

  graphvizInstance.highlight(highlightedNodes, highlightedEdges);
  graphvizInstance.bringToFront(highlightedNodes);
  graphvizInstance.bringToFront(highlightedEdges);
}

function handleGraphvizSvgEvents(graphvizInstance, $, currentSelection, getSelectedDirection) {
  // Add hover event listeners for edges
  Logger.debug("Initializing graph events");
  graphvizInstance.edges().each(function () {
    const $edge = $(this);

    // Store the original stroke width, with a fallback to "1"
    const originalStroke = $edge.attr("stroke-width") || "1";
    $edge.data("original-stroke", originalStroke);

    $edge.on("mouseenter", function () {
      // Highlight edge by making the stroke width thicker
      $(this).find("path").attr("stroke-width", "3");
      // Highlight edge label by making the text visible
      $(this).find("text").attr("fill", "black");
    });

    $edge.on("mouseleave", function () {
      // Revert edge highlight by restoring the original stroke color
      const originalStroke = $(this).data("original-stroke");
      $(this).find("path").attr("stroke-width", originalStroke);
      // Revert edge label highlight by making the text transparent
      $(this).find("text").attr("fill", "transparent");
    });
  });
  Logger.debug("Edge event handlers attached");

  // Add event listeners for nodes
  graphvizInstance.nodes().click(function (event) {
    const nodeSet = $().add(this);
    const selectionObject = {
      set: nodeSet,
      direction: getSelectedDirection(),
    };
    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      currentSelection.push(selectionObject);
    } else {
      currentSelection.splice(0, currentSelection.length, selectionObject);
    }

    highlightSelection(graphvizInstance, currentSelection, $);
  });
  Logger.debug("Node click handlers attached");

  // Add a keydown event listener for escape key to reset highlights
  $(document).keydown(function (event) {
    if (event.keyCode === 27) {
      // Escape key
      graphvizInstance.highlight();
    }
  });
  Logger.debug("Keyboard handlers attached");
}

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
        handleGraphvizSvgEvents(graphvizInstance, $, currentSelection, () => selectedDirection);
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
        d3graphvizInstance
          .engine("dot")
          .fade(false)
          .tweenPaths(false)
          .tweenShapes(false)
          .zoomScaleExtent([0, Infinity])
          .zoom(true)
          .on("end", () => {
            Logger.debug(`Widget ${widgetId}: Render complete`);
            const svg = $(`#${widgetId}`).data("graphviz.svg");
            if (svg) {
              svg.setup();
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
