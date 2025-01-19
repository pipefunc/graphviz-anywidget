// js/react/Controls.jsx
import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import ResetButton from "./ResetButton";
import DirectionSelect from "./DirectionSelect";
import SearchInput from "./SearchInput";
import SearchTypeSelect from "./SearchTypeSelect";
import CaseToggle from "./CaseToggle";

function Controls() {
  return (
    <Box sx={{ width: "100%" }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <ResetButton />
          <DirectionSelect />
        </Stack>
        <Stack direction="row" spacing={2}>
          <SearchInput />
          <SearchTypeSelect />
          <CaseToggle />
        </Stack>
      </Stack>
    </Box>
  );
}

export default Controls;
