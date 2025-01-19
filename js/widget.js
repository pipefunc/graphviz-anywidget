// widget.js

import * as React from "react";
import { createRender } from "@anywidget/react";
import Widget from "./react/Widget"; // Import the Widget component

const render = createRender(Widget);

async function initialize({ model }) {}

export default { initialize, render };
