import { bind } from "nd"
import { Box } from "rebass"
import { isNil } from "ramda"

export default bind(
  ({ $, set }) => {
    return !isNil($.blog_note) ? (
      <Box
        fontSize={["12px", null, "14px"]}
        px={3}
        py={2}
        bg={$.blog_note.bg || "#5386E4"}
        title="click to close"
        sx={{
          cursor: "pointer",
          position: "absolute",
          right: "30px",
          bottom: "50px",
          borderRadius: "3px",
        }}
        color={"white"}
        onClick={() => set(null, "blog_note")}
      >
        {$.blog_note.text}
      </Box>
    ) : null
  },
  ["blog_note", "lang"]
)
