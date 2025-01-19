// js/react/SearchInput.jsx
import * as React from "react";
import TextField from "@mui/material/TextField";
import { useModelState } from "@anywidget/react";
import { useCustomHook } from "./hooks";

function SearchInput() {
  const [searchQuery, setSearchQuery] = useModelState("search_query");
  const { sendSearchQuery } = useCustomHook();

  const handleInputChange = (event) => {
    const newQuery = event.target.value;
    setSearchQuery(newQuery);
    sendSearchQuery(newQuery);
  };

  return (
    <TextField
      placeholder="Search..."
      value={searchQuery}
      onChange={handleInputChange}
      size="small"
    />
  );
}

export default SearchInput;
