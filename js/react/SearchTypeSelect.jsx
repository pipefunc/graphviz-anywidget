// js/react/SearchTypeSelect.jsx
import * as React from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import { useModelState } from "@anywidget/react";

function SearchTypeSelect() {
  const [searchType, setSearchType] = useModelState("search_type");
  const options = ["exact", "included", "regex"];

  return (
    <FormControl size="small">
      <Select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default SearchTypeSelect;
