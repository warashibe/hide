var linkify = require("linkifyjs")
require("linkifyjs/plugins/hashtag")(linkify)
var linkifyHtml = require("linkifyjs/html")
import escapeHtml from "escape-html"
import { Box, Flex, Image } from "rebass"
import moment from "moment"
import "moment/locale/ja"
moment.locale("ja")
import { bind } from "nd"
import { useState, Fragment, useEffect } from "react"
import { addIndex, o, sortBy, isNil, map, filter, prop } from "ramda"

import Edit from "components/Edit"

const isContent = (v, cmap, arr = []) => {
  for (let v2 of cmap[v.id] || []) {
    if (v2.state !== "deleted") {
      arr.push(v2)
    }
    isContent(v2, cmap, arr)
  }
  return arr
}

const Comment = bind(
  ({
    comment_selected,
    article,
    showArticle = false,
    comment_map,
    comment_map_id,
    comment,
    $,
    init,
    depth,
    siblings = [],
    index,
    reply,
    comment_reply,
    setReply,
    setEdit,
    edit,
    setCommentReply,
    unread,
    container_px = "0px",
    heading,
    disable,
  }) => {
    const v = comment
    const user = $.blog_user_map[v.uid]
    const [open, setOpen] = useState(false)
    const [open2, setOpen2] = useState(false)
    useEffect(() => {
      if (comment_selected === v.id) {
        fn.getReply({ comment: comment })
        setOpen(true)
      }
    }, [])
    const fn = init(["getComments", "addComment", "deleteComment", "getReply"])
    const noShow =
      v.state === "deleted" &&
      filter(v => v.state !== "deleted")(siblings).length === 0 &&
      isContent(v, comment_map).length === 0
    const isZero = (v.total_reply || v.reply || 0) === 0
    const showReply =
      ((v.total_reply || v.reply || 0) === 0 || open) && !isNil($.user)
    return noShow ? null : (
      <Fragment>
        <Flex
          width={1}
          pt={"10px"}
          px={container_px}
          fontSize="14px"
          lineHeight="150%"
          sx={{ borderTop: "1px solid #ccc" }}
        >
          <Box width="40px" mr="15px">
            <Box as="a" href={isNil(user) ? null : `/user?id=${user.uid}`}>
              <Image
                src={isNil(user) ? null : user.image64 || user.image}
                size="40px"
                sx={{ borderRadius: "50%" }}
              />
            </Box>
            {unread ? (
              <Box
                textAlign="center"
                color="#F44E3B"
                fontWeight="bold"
                fontSize="14px"
              >
                {$.lang.unread}
              </Box>
            ) : null}
          </Box>
          <Box flex={1}>
            {v.state === "deleted" ? (
              <Box py={2} color="crimson">
                {$.lang.deleted}
              </Box>
            ) : edit === v.id ? (
              <Edit
                {...{
                  reply_content: comment,
                  setOpen,
                  origin: v.origin,
                  _comment: v,
                  id: v.id,
                  parent: v.parent,
                  parent_content: comment_map_id[v.parent],
                  setComment: setCommentReply,
                  comment: comment_reply,
                  setIsComment: setEdit,
                  article,
                }}
              />
            ) : (
              <Flex flexDirection="column">
                <Box width={1}>
                  <Flex alignItems="center">
                    <Box
                      fontWeight="bold"
                      as="a"
                      color="#555"
                      sx={{
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        textDecoration: "none",
                        ":hover": { opacity: 0.75, color: "#5386E4" },
                      }}
                      mr={2}
                      href={isNil(user) ? null : `/user?id=${user.uid}`}
                      title={isNil(user) ? null : user.name}
                    >
                      {isNil(user) ? null : user.name}
                    </Box>
                    <Box
                      as="span"
                      mr={2}
                      color="#777"
                      fontSize="10px"
                      sx={{ minWidth: "100px" }}
                    >
                      {moment(v.date).fromNow()}
                    </Box>
                  </Flex>
                </Box>
                <Box
                  py={2}
                  dangerouslySetInnerHTML={{
                    __html: linkifyHtml(escapeHtml(v.comment), {
                      target: "_blank",
                    }).replace(/\n/g, "<br />"),
                  }}
                />
                <Box></Box>
              </Flex>
            )}
            {edit !== v.id ? (
              <Fragment>
                <Flex fontSize="12px" color="#777" mb="10px">
                  <Fragment>
                    <Box
                      as="span"
                      mr={2}
                      sx={{
                        cursor: "pointer",
                        ":hover": { opacity: 0.75, color: "#5386E4" },
                      }}
                      color={showReply ? "#5386E4" : null}
                      onClick={async () => {
                        await fn.getReply({ comment: v })
                        setOpen(!open)
                      }}
                    >
                      <Box as="i" className="fas fa-comments" mr={1} />
                      {v.total_reply || v.reply || 0}
                    </Box>
                  </Fragment>
                  {isNil($.user) ? null : (
                    <Fragment>
                      {showReply ? (
                        <Box
                          as="span"
                          mr={2}
                          sx={{
                            cursor: "pointer",
                            ":hover": { opacity: 0.75, color: "#5386E4" },
                          }}
                          color={reply === v.id ? "#5386E4" : null}
                          onClick={() => {
                            setReply(reply === v.id ? null : v.id)
                          }}
                        >
                          {$.lang.reply}
                        </Box>
                      ) : null}
                      {noShow ? null : (
                        <Fragment>
                          {!isNil($.user) &&
                          v.uid === $.user.uid &&
                          v.state !== "deleted" ? (
                            <Fragment>
                              <Box
                                as="span"
                                mr={2}
                                sx={{
                                  cursor: "pointer",
                                  ":hover": { opacity: 0.75, color: "#5386E4" },
                                }}
                                onClick={() => {
                                  setCommentReply(v.comment)
                                  setEdit(v.id)
                                }}
                              >
                                {$.lang.edit}
                              </Box>

                              <Box
                                as="span"
                                mr={2}
                                sx={{
                                  cursor: "pointer",
                                  ":hover": { opacity: 0.75, color: "crimson" },
                                }}
                                onClick={() => {
                                  if (confirm("削除してよろしいですか？")) {
                                    fn.deleteComment({ comment: v })
                                  }
                                }}
                              >
                                {$.lang.delete}
                              </Box>
                            </Fragment>
                          ) : null}
                        </Fragment>
                      )}
                    </Fragment>
                  )}

                  <Box as="span" color="#BF731C" fontSize="10px">
                    {v.edit === false ? "" : $.lang.edited}
                  </Box>
                  {showArticle && !isNil(article) ? (
                    <Box
                      flex={1}
                      ml={2}
                      fontSize="10px"
                      sx={{
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        cursor: "pointer",
                        ":hover": { opacity: 0.75 },
                      }}
                    >
                      <Box
                        as="a"
                        target="_self"
                        sx={{ textDecoration: "none", color: "#5386E4" }}
                        href={`/articles/${article.id}`}
                      >
                        <Box as="i" className="fas fa-rss" mr={1} />
                        {article.title}
                      </Box>
                    </Box>
                  ) : null}
                </Flex>
              </Fragment>
            ) : null}
            {reply === v.id ? (
              <Edit
                {...{
                  reply_content: v,
                  setOpen,
                  origin: v.origin,
                  mt: 2,
                  parent_content:
                    comment_map_id[
                      depth === 1 || siblings.length !== index + 1
                        ? v.id
                        : v.parent
                    ],
                  parent:
                    depth === 1 || siblings.length !== index + 1
                      ? v.id
                      : v.parent,
                  setComment: setCommentReply,
                  comment: comment_reply,
                  setIsComment: setReply,
                  article,
                }}
              />
            ) : null}
            {!open ? null : (
              <Box width={1}>
                {o(
                  addIndex(map)((v2, i2) => (
                    <Comment
                      {...{
                        comment_map,
                        comment_map_id,
                        article,
                        comment: v2,
                        depth: depth + 1,
                        reply,
                        comment_reply,
                        setReply,
                        setEdit,
                        edit,
                        setCommentReply,
                        index: i2,
                        siblings: comment_map[v.id],
                      }}
                    />
                  )),
                  sortBy(prop("date"))
                )(comment_map[v.id] || [])}
              </Box>
            )}
          </Box>
        </Flex>
        {!isNil(heading) ? (
          <Box textAlign="center" color="#999" bg="#eee" fontSize="10px" p={1}>
            {heading}
          </Box>
        ) : null}
      </Fragment>
    )
  },
  ["user", "blog_user_map", "lang"]
)

export default Comment
