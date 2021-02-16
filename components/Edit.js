import { Box, Flex } from "rebass"
import { bind } from "nd"
import { useState, Fragment, useEffect } from "react"
import { isNil } from "ramda"

import { Textarea } from "@rebass/forms"

export default bind(
  ({
    reply_content = null,
    parent_content = null,
    origin,
    init,
    parent,
    id,
    setComment,
    comment,
    $,
    article,
    setIsComment,
    mt = 0,
    _comment,
    setOpen,
  }) => {
    const fn = init([
      "getComments",
      "addComment",
      "deleteComment",
      "getLocalArticle",
      "downloadMD",
    ])
    const breaks = comment.match(/\n/g)
    const addition = 16 * Math.max(0, isNil(breaks) ? 0 : breaks.length)
    return (
      <Box flex={1} mt={mt} mb={2}>
        <Textarea
          id="comment"
          autoFocus={true}
          height={36 + addition + "px"}
          fontSize="14px"
          bg="white"
          placeholder={$.lang.enter_comment}
          sx={{
            borderRadius: "4px 4px 0 0",
            border: "1px solid #CCCCCC",
          }}
          width={1}
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
        <Flex width={1}>
          <Flex
            width={1 / 2}
            px={3}
            py={1}
            bg="#5386E4"
            color="white"
            justifyContent="center"
            sx={{
              borderRadius: "0 0 0 4px",
              cursor: "pointer",
              ":hover": { opacity: 0.75 },
            }}
            onClick={async () => {
              if (comment.length > 1000) {
                alert($.lang.comment1000)
              } else if (!/^\s*$/.test(comment)) {
                fn.addComment({
                  reply_content,
                  origin,
                  article: article,
                  user: $.user,
                  parent,
                  parent_content,
                  comment,
                  id,
                })
                if (!isNil(setOpen)) setOpen(true)
                setComment("")
                setIsComment(null)
              }
            }}
          >
            {$.lang.commenting}
          </Flex>
          <Flex
            width={1 / 2}
            px={3}
            py={1}
            bg="#BF731C"
            color="white"
            justifyContent="center"
            sx={{
              borderRadius: "0 0 4px 0",
              cursor: "pointer",
              ":hover": { opacity: 0.75 },
            }}
            onClick={async () => {
              setComment("")
              setIsComment(null)
            }}
          >
            {$.lang.cancel}
          </Flex>
        </Flex>
      </Box>
    )
  },
  ["user", "lang"]
)
