import { Logger } from "./logger";

export function getLegendElements(graphvizInstance, $) {
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

function _findEdges(text, searchFunction, graphvizInstance, $) {
  const $set = $();
  graphvizInstance.edges().each((index, edge) => {
    if (edge.textContent && searchFunction(text, edge.textContent)) {
      $set.push(edge);
    }
  });
  return $set;
}

function _findNodes(text, searchFunction, nodeName, nodeLabel, graphvizInstance, $) {
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

export function search(text, searchObject, graphvizInstance, $) {
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
    $edges = _findEdges(text, searchFunction, graphvizInstance, $);
  }

  let $nodes = $();
  if (searchObject.nodeLabel || searchObject.nodeName) {
    $nodes = _findNodes(
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

function _getConnectedNodes(nodeSet, mode, graphvizInstance) {
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

function _highlightSelection(graphvizInstance, currentSelection, $) {
  let highlightedNodes = $();
  let highlightedEdges = $();

  currentSelection.forEach((selection) => {
    const nodes = _getConnectedNodes(selection.set, selection.direction, graphvizInstance);
    highlightedNodes = highlightedNodes.add(nodes);
  });

  const { legendNodes, legendEdges } = getLegendElements(graphvizInstance, $);
  highlightedNodes = highlightedNodes.add(legendNodes);
  highlightedEdges = highlightedEdges.add(legendEdges);

  graphvizInstance.highlight(highlightedNodes, highlightedEdges);
  graphvizInstance.bringToFront(highlightedNodes);
  graphvizInstance.bringToFront(highlightedEdges);
}

export function handleGraphvizSvgEvents(graphvizInstance, $, currentSelection, getSelectedDirection) {
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

    _highlightSelection(graphvizInstance, currentSelection, $);
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
