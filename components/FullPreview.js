import { getTOC, getElementOffset, serialize } from "lib/editor"
import Link from "next/link"
import { Flex, Box, Image } from "rebass"
import moment from "moment"
import "moment/locale/ja"
moment.locale("ja")
import DOMPurify from "isomorphic-dompurify"
import { Fragment, useEffect, useState } from "react"
import GithubMarkdown from "lib/css/GithubMarkdown"
import Dracula from "lib/css/Dracula"
import { compose, filter, isNil, map, includes } from "ramda"
import { checkURL, useScript } from "lib/utils"
import Note from "components/Note"
import TOC from "components/TOC"

const Script = props => {
  useScript(props.src + "?_=" + Date.now())
  return null
}

export default ({ content, title, height, setTab, $, downloadMD }) => {
  useEffect(() => {
    DOMPurify.addHook("uponSanitizeElement", (node, data) => {
      if (data.tagName === "iframe") {
        const src = node.getAttribute("src")
        if (!isNil(src) && checkURL(src)) {
          return isNil(node.parentNode)
            ? node.remove()
            : node.parentNode.removeChild(node)
        }
      }
    })
  }, [])
  let { __html, content_table, scripts } = getTOC(content, true, $.image_map)
  const ArticleBtns = () => (
    <Flex
      alignItems="center"
      justifyContent={["center", null, "flex-end", null, "center"]}
      mt={[3, null, null, null, null, 2]}
      width={1}
      fontSize="14px"
    >
      <Box
        bg="#5386E4"
        color="white"
        py={2}
        px={3}
        textAlign="center"
        mx={[2, null, null, null, 1]}
        flex={[1, null, null, "auto"]}
        sx={{
          borderRadius: "3px",
          cursor: "pointer",
          ":hover": { opacity: 0.75 },
        }}
        onClick={() =>
          downloadMD({ article: { title, body: serialize(content) } })
        }
      >
        <Box as="i" className="fas fa-download" mr={2} />
        DL
      </Box>
    </Flex>
  )
  return (
    <Fragment>
      <Flex width={1} height="100%" flexDirection="column">
        <GithubMarkdown />
        <Dracula />
        <Flex color="#111" flex={1} height={height} sx={{ overflow: "auto" }}>
          <Box width={[1, null, null, 3 / 4]} sx={{ maxWidth: "750px" }}>
            <Box px={4}>
              <Box
                py={4}
                sx={{ borderBottom: "1px solid #ddd" }}
                px={[4, null, null, 5]}
              >
                <Box
                  lineHeight="150%"
                  fontSize={["25px", "30px", "40px"]}
                  fontWeight="bold"
                >
                  {title}
                </Box>
                <Box
                  mt={3}
                  width={1}
                  display={["block", null, null, null, null, "none"]}
                >
                  <ArticleBtns />
                </Box>
              </Box>
            </Box>
            {content_table.length === 0 ? null : (
              <Box width={1} px={4} display={["flex", null, null, "none"]}>
                <Box
                  bg="#eee"
                  py={3}
                  px={4}
                  width={1}
                  sx={{ borderRadius: "5px" }}
                >
                  <TOC content_table={content_table} />
                </Box>
              </Box>
            )}
            <Box
              py={[3, null, 4]}
              px={[4, null, null, 5]}
              lineHeight="200%"
              className="markdown-body"
              dangerouslySetInnerHTML={{
                __html: __html,
              }}
            />
          </Box>
          <Box
            flex={1}
            display={["none", null, null, "block"]}
            sx={{ maxWidth: "350px" }}
          >
            <Box width={1} sx={{ top: 80, position: "sticky" }}>
              <Box
                width={1}
                mb={4}
                display={["none", null, null, null, null, "block"]}
              >
                <ArticleBtns />
              </Box>
              <TOC content_table={content_table} />
            </Box>
          </Box>
        </Flex>
        <Flex>
          <Box
            flex={1}
            textAlign="center"
            onClick={() => {
              setTab("edit")
            }}
            sx={{ cursor: "pointer" }}
            p={2}
            bg="#BF731C"
            color="white"
            id="blog_btn_delete"
          >
            {$.lang.back_to_edit}
          </Box>
          <Box
            flex={1}
            textAlign="center"
            onClick={() => setTab("post")}
            sx={{ cursor: "pointer" }}
            p={2}
            bg="#5386E4"
            color={"white"}
            id="blog_btn_save"
          >
            {$.lang.post_settings}
          </Box>
        </Flex>
      </Flex>
      {compose(
        map(v => {
          return <Script src={v} />
        }),
        filter(v => {
          if (isNil(v)) return false
          const _url = url.parse(v)
          return includes(_url.hostname)([
            "widgets.coingecko.com",
            "platform.twitter.com",
          ])
        })
      )(scripts)}
      <Note />
    </Fragment>
  )
}
