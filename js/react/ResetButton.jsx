// js/react/ResetButton.jsx
import * as React from "react";
import Button from "@mui/material/Button";
import { useCustomHook } from "./hooks";

function ResetButton() {
  const { resetZoom } = useCustomHook();
  return (
    <Button variant="contained" onClick={resetZoom}>
      Reset Zoom
    </Button>
  );
}

export default ResetButton;
