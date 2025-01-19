// js/react/CaseToggle.jsx
import * as React from "react";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useModelState } from "@anywidget/react";

function CaseToggle() {
  const [caseSensitive, setCaseSensitive] = useModelState("case_sensitive");

  return (
    <FormControlLabel
      control={
        <Switch
          checked={caseSensitive}
          onChange={(e) => setCaseSensitive(e.target.checked)}
        />
      }
      label="Case Sensitive"
    />
  );
}

export default CaseToggle;
