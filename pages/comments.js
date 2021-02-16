import { Fragment, useEffect, useState } from "react"
import ModHead from "components/ModHead"
import useEventListener from "@use-it/event-listener"
import { bind } from "nd"
import {
  filter,
  values,
  compose,
  indexBy,
  prop,
  isNil,
  map,
  includes,
} from "ramda"

import { Flex, Box, Image } from "rebass"
import NavCustomized from "components/NavCustomized"
import Comment from "components/Comment"
import Articles from "components/Articles"
import Loading from "components/Loading"
import { comment_map_parent } from "lib/selectors"
import { _checkHeight } from "lib/utils"

export default bind(
  ({ $, set, init, conf, router }) => {
    const fn = init(["getTopics", "getNotifications", "getReplyTo"])
    const [topic, setTopic] = useState(null)
    useEffect(() => {
      if ($.isFB) {
        fn.getTopics()
      }
    }, [$.isFB])
    const [height, setHeight] = useState(null)
    const checkHeight = () => {
      _checkHeight({
        setHeight,
        ids: ["nav"],
        _default: 500,
      })
    }
    useEventListener("resize", () => checkHeight())
    useEffect(() => {
      checkHeight()
    }, [])
    const [comment_reply, setCommentReply] = useState("")
    const [reply, setReply] = useState(null)
    const [edit, setEdit] = useState(null)
    const [tab, setTab] = useState("unread")
    const [initNotification, setInitNotification] = useState(false)
    useEffect(() => {
      if ($.isFB && !isNil($.user)) {
        fn.getNotifications({ user: $.user, unread: true }).then(isUnread => {
          if (isUnread === false) {
            setTab("comments")
          } else {
            setTab("unread")
          }
          setInitNotification(true)
        })
        fn.getNotifications({ user: $.user })
      }
    }, [$.isFB, $.user])
    const topics = compose(indexBy(prop("key")))($.topics)
    let main_notes = tab === "unread" ? $.unread : $.notifications
    if (
      !isNil($.comment_selected) &&
      !isNil($._comment_map[$.comment_selected])
    ) {
      main_notes = [{ comment_id: $.comment_selected }]
    }
    return (
      <Fragment>
        <NavCustomized side_selected="comments">
          {!initNotification ? (
            <Loading text={$.lang.loading_comments} />
          ) : (
            <Fragment>
              <Flex color="#333" sx={{ position: "relative" }}>
                <Box
                  flex={1}
                  width={1}
                  flexWrap="wrap"
                  p={[3, null, 4]}
                  sx={{ maxWidth: tab === "comments" ? "750px" : null }}
                >
                  <Flex mb={3}>
                    {!isNil($.comment_selected) ? (
                      <Box
                        mr={4}
                        color={[tab === "#999"]}
                        sx={{ cursor: "pointer", ":hover": { opacity: 0.75 } }}
                        onClick={() => set(null, "comment_selected")}
                      >
                        <Box mr={2} className="fas fa-chevron-left" />
                        {$.lang.back}
                      </Box>
                    ) : (
                      <Fragment>
                        {$.isNotifications ? (
                          <Box
                            mr={4}
                            color={[
                              tab === "unread" ? "#F44E3B" : "#999",
                              null,
                              null,
                              null,
                              tab === "unread" ? "#F44E3B" : "#999",
                            ]}
                            sx={{
                              cursor: "pointer",
                              ":hover": { opacity: 0.75 },
                            }}
                            onClick={() => setTab("unread")}
                          >
                            <Box mr={2} className="fas fa-envelope" />
                            {$.lang.unread}
                          </Box>
                        ) : null}

                        <Box
                          mr={4}
                          color={[
                            tab === "comments" ? "#5285E3" : "#999",
                            null,
                            null,
                            null,
                            tab === "comments" || tab === "articles"
                              ? "#5285E3"
                              : "#999",
                          ]}
                          sx={{
                            cursor: "pointer",
                            ":hover": { opacity: 0.75 },
                          }}
                          onClick={() =>
                            set(null, "comment_selected") && setTab("comments")
                          }
                        >
                          <Box mr={2} className="fas fa-comments" />
                          {$.lang.new_comments}
                        </Box>
                        <Box
                          sx={{
                            cursor: "pointer",
                            ":hover": { opacity: 0.75 },
                          }}
                          onClick={() => setTab("articles")}
                          mr={4}
                          color={[tab === "articles" ? "#5285E3" : "#999"]}
                          display={["block", null, null, null, "none"]}
                        >
                          <Box mr={2} className="fas fa-rss" />
                          {$.lang.comment_articles}
                        </Box>
                      </Fragment>
                    )}
                  </Flex>
                  <Box
                    width={1}
                    display={[
                      tab === "articles" ? "block" : "none",
                      null,
                      null,
                      null,
                      "none",
                    ]}
                  >
                    <Articles
                      topics={topics}
                      isPrivate={false}
                      articles={values($._article_map)}
                      next={null}
                    />
                  </Box>
                  <Box
                    width={1}
                    display={[
                      tab !== "articles" ? "block" : "none",
                      null,
                      null,
                      null,
                      "block",
                    ]}
                  >
                    {compose(
                      map(v => {
                        const cmt = $._comment_map[v.comment_id]
                        const comment_map = indexBy(prop("parent"))(values(cmt))
                        const art =
                          !isNil(cmt) && !isNil($._article_map[cmt.article])
                            ? $._article_map[cmt.article]
                            : null
                        return !isNil(cmt) ? (
                          <Fragment key={cmt.id}>
                            {!isNil($.comment_selected) &&
                            !isNil(
                              $._comment_map[
                                $._comment_map[$.comment_selected].reply_to
                              ]
                            ) ? (
                              <Box
                                width={1}
                                onClick={e => {
                                  const cid =
                                    $._comment_map[$.comment_selected].reply_to
                                  e.stopPropagation()
                                  fn.getReplyTo({ id: cid })
                                  set(cid, "comment_selected")
                                }}
                                sx={{
                                  cursor: "pointer",
                                  ":hover": {
                                    backgroundColor: "#eee",
                                  },
                                }}
                              >
                                <Comment
                                  {...{
                                    heading: $.lang.replied_comment,
                                    disable: true,
                                    container_px: 2,
                                    unread: includes($.user.uid)(
                                      v.unread || []
                                    ),
                                    showArticle: true,
                                    comment_map: $.comment_map_parent,
                                    comment_map_id: $._comment_map,
                                    article: art,
                                    comment:
                                      $._comment_map[
                                        $._comment_map[$.comment_selected]
                                          .reply_to
                                      ],
                                    depth: 1,
                                    reply,
                                    comment_reply,
                                    setReply,
                                    setCommentReply,
                                    edit,
                                    setEdit,
                                  }}
                                />
                              </Box>
                            ) : null}
                            <Box
                              width={1}
                              onClick={e => {
                                e.stopPropagation()
                                fn.getReplyTo({ id: cmt.reply_to })
                                set(cmt.id, "comment_selected")
                              }}
                              sx={{
                                cursor: !isNil($.comment_selected)
                                  ? "default"
                                  : "pointer",
                                ":hover": {
                                  backgroundColor: !isNil($.comment_selected)
                                    ? ""
                                    : "#eee",
                                },
                              }}
                            >
                              <Comment
                                {...{
                                  comment_selected: $.comment_selected,
                                  container_px: 2,
                                  unread: includes($.user.uid)(v.unread || []),
                                  showArticle: true,
                                  comment_map: $.comment_map_parent,
                                  comment_map_id: $._comment_map,
                                  article: art,
                                  comment: cmt,
                                  depth: 1,
                                  reply,
                                  comment_reply,
                                  setReply,
                                  setCommentReply,
                                  edit,
                                  setEdit,
                                }}
                              />
                            </Box>
                          </Fragment>
                        ) : null
                      }),
                      filter(
                        v =>
                          isNil($.comment_selected) ||
                          $.comment_selected === v.comment_id
                      )
                    )(main_notes)}
                    {(tab === "unread" && $.next_unread) ||
                    (isNil($.comment_selected) &&
                      tab !== "unread" &&
                      $.next_notifications) ? (
                      <Flex
                        bg="#ddd"
                        fontSize="12px"
                        justifyContent="center"
                        py={3}
                        width={1}
                        mt={3}
                        sx={{ cursor: "pointer", borderRadius: "3px" }}
                        onClick={() => {
                          if (tab === "unread") {
                            fn.getNotifications({
                              user: $.user,
                              next: true,
                              unread: true,
                            })
                          } else {
                            fn.getNotifications({ user: $.user, next: true })
                          }
                        }}
                      >
                        {$.read_more}
                      </Flex>
                    ) : null}
                  </Box>
                </Box>
                <Box
                  bg="#eee"
                  flex={1}
                  display={["none", null, null, null, "block"]}
                >
                  <Box
                    width={1}
                    sx={{
                      direction: "rtl",
                      top: 50,
                      position: "sticky",
                      overflow: "auto",
                    }}
                    height={height}
                  >
                    <Box sx={{ direction: "ltr" }}>
                      <Articles
                        width={[1, null, null, null, null, 1 / 2]}
                        topics={topics}
                        isPrivate={false}
                        articles={values($._article_map)}
                        next={null}
                      />
                    </Box>
                  </Box>
                </Box>
              </Flex>
            </Fragment>
          )}
        </NavCustomized>
      </Fragment>
    )
  },
  [
    "user",
    "lang",
    "isFB",
    "isNotifications",
    "next_notifications",
    "notifications",
    "next_unread",
    "unread",
    "_comment_map",
    "_article_map",
    "topics",
    "isNotifications",
    "comment_selected",
    {
      comment_map_parent,
    },
  ]
)
