import escapeHtml from "escape-html"
import { Box, Flex, Image } from "rebass"
import { bind } from "nd"
import { useState, Fragment, useEffect } from "react"
import { sortBy, isNil, map } from "ramda"
import { Textarea } from "@rebass/forms"
import Edit from "components/Edit"
import Comment from "components/Comment"

const Comments = bind(
  ({
    comment_map,
    comment_map_id,
    set,
    init,
    $,
    router,
    article,
    setComment,
    comment,
    setIsComment,
    isComment,
    comment_reply,
    setReply,
    setCommentReply,
    edit,
    setEdit,
    reply,
    isBorderTop = false,
  }) => {
    const fn = init(["getComments"])

    return (
      <Fragment>
        <Flex width={1} px={[4, null, null, 5, null, 3]}>
          <Box
            sx={{
              borderTop: [
                isBorderTop ? "" : "1px solid #ccc",
                null,
                null,
                null,
                null,
                "0px",
              ],
            }}
            width={1}
            py={[4, null, null, null, null, 0]}
          >
            {isNil($.user) ? null : (
              <Flex width={1} mb={4}>
                <Box width="55px">
                  <Image
                    src={isNil($.user) ? null : $.user.image64 || $.user.image}
                    size="35px"
                    sx={{ borderRadius: "50%" }}
                  />
                </Box>
                {isComment && isNil(reply) ? (
                  <Edit
                    {...{
                      parent_content: null,
                      parent: null,
                      setComment,
                      comment,
                      setIsComment,
                      article,
                    }}
                  />
                ) : (
                  <Box
                    flex={1}
                    onClick={e => {
                      setReply(null)
                      setIsComment(true)
                      setTimeout(() => {
                        document.getElementById("comment").focus()
                      }, 300)
                    }}
                  >
                    <Textarea
                      bg="white"
                      height="40px"
                      pt="10px"
                      px={3}
                      placeholder={$.lang.enter_comment}
                      sx={{
                        cursor: "pointer",
                        borderRadius: "4px",
                        border: "1px solid #CCCCCC",
                        ":hover": { opacity: 0.75 },
                      }}
                      width={1}
                    />
                  </Box>
                )}
              </Flex>
            )}
            {map(v => (
              <Comment
                {...{
                  comment_map,
                  comment_map_id,
                  article,
                  comment: v,
                  depth: 1,
                  reply,
                  comment_reply,
                  setReply,
                  setCommentReply,
                  edit,
                  setEdit,
                }}
              />
            ))(sortBy(v => v.date * -1)(comment_map["null"] || []))}
            {$.next_comments ? (
              <Flex
                bg="#ddd"
                fontSize="12px"
                justifyContent="center"
                py={3}
                width={1}
                mt={3}
                sx={{ cursor: "pointer", borderRadius: "3px" }}
                onClick={() => {
                  fn.getComments({ id: article.id, next: true })
                }}
              >
                {$.lang.load_more}
              </Flex>
            ) : null}
          </Box>
        </Flex>
      </Fragment>
    )
  },
  ["data_storage", "user", "next_comments"]
)

export default bind(Comments, [
  "user",
  "user_init",
  "lang",
  "isFB",
  "data_storage",
  "comments",
  "next_comments",
  "blog_user_map",
  "topics",
  "blog_map",
  "blog_todos",
  "blog_todo_map",
  "personal_blog_epic",
  "personal_blog_todo_map",
  "personal_blog_todos",
])
