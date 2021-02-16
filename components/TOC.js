import { Box, Flex, Image } from "rebass"
import { isNil, map } from "ramda"

const getElementOffset = element => {
  if (isNil(element)) {
    return { top: 0, left: 0 }
  }
  var de = document.documentElement
  var box = element.getBoundingClientRect()
  var top = box.top + window.pageYOffset - de.clientTop
  var left = box.left + window.pageXOffset - de.clientLeft
  return { top: top, left: left }
}

export default ({ content_table }) => {
  return content_table.length === 0 ? null : (
    <Box sx={{ borderLeft: "3px solid #5386E4" }} p={2}>
      {map(v => {
        return (
          <Box
            as="a"
            display="block"
            color="#666"
            sx={{
              textDecoration: "none",
              ":hover": {
                color: "#A2C856",
              },
            }}
            onClick={e => {
              e.preventDefault()
              const x = getElementOffset(
                document.getElementById(`title-${v.index}`)
              )
              window.scrollTo({
                top: x.top - 65,
                behavior: "smooth",
              })
            }}
            href={`#title-${v.index}`}
            p={1}
            ml={v.tagname === "h1" ? 2 : "25px"}
            lineHeight="150%"
            fontSize={v.tagname === "h1" ? "16px" : "13px"}
          >
            {v.title}
          </Box>
        )
      })(content_table)}
    </Box>
  )
}
