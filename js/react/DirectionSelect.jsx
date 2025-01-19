// js/react/DirectionSelect.jsx
import * as React from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import { useModelState } from "@anywidget/react";

function DirectionSelect() {
  const [selectedDirection, setSelectedDirection] = useModelState("selected_direction");
  const options = ["bidirectional", "downstream", "upstream", "single"];

  return (
    <FormControl size="small">
      <Select
        value={selectedDirection}
        onChange={(e) => setSelectedDirection(e.target.value)}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default DirectionSelect;
