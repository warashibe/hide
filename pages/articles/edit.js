import { toValue } from "lib/editor"
import Loading from "components/Loading"
import Editor from "components/Editor"
import { Fragment, useEffect, useState } from "react"
import useEventListener from "@use-it/event-listener"
import { bind } from "nd"
import { isNil } from "ramda"
import { Flex, Box, Image } from "rebass"
import moment from "moment"
require("moment-timezone")
moment.locale("ja")

import NavCustomized from "components/NavCustomized"
import Note from "components/Note"

import { _checkHeight } from "lib/utils"

import { Input, Select, Textarea, Radio, Checkbox } from "@rebass/forms"

export default bind(
  ({ $, set, init, conf, router, get }) => {
    const [tab, setTab] = useState("edit")
    const [isOwner, setIsOwner] = useState(null)
    const [article, setArticle] = useState(null)

    const [downloadable, setDownloadable] = useState(false)
    const [unlisted, setUnlisted] = useState(false)
    const [restricted, setRestricted] = useState(false)
    const [epic, setEpic] = useState(false)
    const [new_epic, setNewEpic] = useState(false)

    const [height, setHeight] = useState(null)
    const checkHeight = () => {
      _checkHeight({
        setHeight,
        ids:
          tab === "full_preview"
            ? ["nav", "blog_btn_save"]
            : ["nav", "blog_title", "blog_btn_save"],
        _default: 170,
      })
    }
    useEventListener("resize", () => checkHeight())
    const fn = init(["getImages", "getLocalArticle", "getArticle"])
    useEffect(() => {
      checkHeight()
    })
    useEffect(() => {
      if (!isNil($.user)) {
        fn.getImages({})
      }
    }, [$.user])
    useEffect(() => {
      ;(async () => {
        if (!isNil($.user)) {
          if (!isNil(router.query.id)) {
            const _article =
              $.data_storage === "localforage"
                ? await fn.getLocalArticle({
                    id: router.query.id,
                    user: $.user,
                    ignorePublished: true,
                  })
                : await fn.getArticle({
                    id: router.query.id,
                    user: $.user,
                  })
            if (_article === false || isNil(_article)) {
              setIsOwner(false)
            } else {
              setArticle(_article)
              setDownloadable(_article.downloadable || false)
              setUnlisted(_article.unlisted || false)
              setRestricted(_article.restricted || false)
              setEpic(_article.epic || null)
              setNewEpic(_article.epic || null)
            }
          }
        }
      })()
    }, [router, $.user])
    let smenu = []
    let tmenu = []
    if (!isNil($.user)) {
      smenu.unshift({
        index: 1,
        text: $.lang.blog,
        key: `top-user_blog`,
        awesome_icon: `fas fa-rss`,
        href: `/blog/${$.user.uid}`,
        target: "_self",
      })
      if (!isNil(router.query.id)) {
        smenu.push({
          index: 2,
          text: $.lang.create_article,
          key: `top-edit`,
          awesome_icon: `fas fa-edit`,
          href: "/blog/edit",
          target: "_self",
        })
      }
      tmenu.push({
        index: 0,
        text: $.lang.edit,
        key: `edit`,
        awesome_icon: `fas fa-edit`,
        onClick: () => setTab("edit"),
      })
      tmenu.push({
        index: 1,
        text: $.lang.full_preview,
        key: `full_preview`,
        awesome_icon: `fas fa-eye`,
        onClick: () => setTab("full_preview"),
      })
      tmenu.push({
        index: 2,
        text: $.lang.post,
        key: `post`,
        awesome_icon: `fas fa-upload`,
        onClick: () => setTab("post"),
      })
    }
    return (
      <Fragment>
        <NavCustomized
          noComment={true}
          side_width={230}
          chosen={tab}
          {...{ smenu, tmenu }}
        >
          {isNil($.user) ? (
            <Fragment>
              <Flex
                bg="#eee"
                flexDirection="column"
                width={1}
                height="100%"
                sx={{
                  backgroundColor: "white",
                  display: "flex",
                  justifyContent: "center",
                  minHeight: "100%",
                  color: "#444",
                }}
              >
                <Flex
                  flex="1"
                  flexDirection="column"
                  width={1}
                  justifyContent="center"
                  width={1}
                >
                  <Flex
                    width={1}
                    textAlign="center"
                    sx={{ height: "100%" }}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Box p={4}>
                      {$.user_init ? (
                        <Flex
                          justifyContent="center"
                          alignItems="center"
                          mt={3}
                          color="#111"
                          px={4}
                          py={3}
                          bg="#5386E4"
                          sx={{
                            cursor: "pointer",
                            ":hover": { opacity: 0.75 },
                            borderRadius: "5px",
                          }}
                          color="white"
                          onClick={async () => {
                            location.href = "/login"
                          }}
                        >
                          <Box as="i" className="fas fa-sign-in-alt" mr={2} />
                          {$.lang.login}
                        </Flex>
                      ) : (
                        <Box mt={3} color="#111">
                          {$.lang.logding}
                        </Box>
                      )}
                    </Box>
                  </Flex>
                </Flex>
              </Flex>
            </Fragment>
          ) : (
            <Fragment>
              <Flex flexDirection="column" width={1} height="100%">
                <Flex
                  flex={1}
                  flexDirection="column"
                  justifyContent="center"
                  width={1}
                >
                  {isOwner === false ? (
                    <Flex
                      width={1}
                      textAlign="center"
                      sx={{ height: "100%" }}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Box p={4}>
                        <Box mt={3} color="#111">
                          {$.lang.article_missing}
                        </Box>
                      </Box>
                    </Flex>
                  ) : isNil($.user) ||
                    (!isNil(router.query.id) && isNil(article)) ? (
                    <Flex
                      width={1}
                      textAlign="center"
                      sx={{ height: "100%" }}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Box p={4}>
                        <Box mt={3} color="#111">
                          {$.lang.loading_article}
                        </Box>
                      </Box>
                    </Flex>
                  ) : (
                    <Flex flex={1} width={1}>
                      {isNil(article) ? (
                        <Editor
                          {...{
                            tab,
                            setTab,
                            checkHeight,
                            height,
                            setDownloadable,
                            setUnlisted,
                            unlisted,
                            setRestricted,
                            restricted,
                            setEpic,
                            epic,
                            setNewEpic,
                            new_epic,
                            downloadable,
                          }}
                          editor_style={{
                            overflowX: "hidden",
                            wordBreak: "break-all",
                            flex: 1,
                            width: "100%",
                            padding: "16px",
                          }}
                        />
                      ) : (
                        <Editor
                          {...{
                            tab,
                            setTab,
                            checkHeight,
                            height,
                            setDownloadable,
                            setUnlisted,
                            unlisted,
                            setRestricted,
                            restricted,
                            setEpic,
                            epic,
                            setNewEpic,
                            new_epic,
                            downloadable,
                          }}
                          editor_style={{
                            overflowX: "hidden",
                            wordBreak: "break-all",
                            flex: 1,
                            width: "100%",
                            padding: "16px",
                          }}
                          init_id={article.id}
                          init_cover={{
                            hash: article.cover_hash,
                            src: article.cover,
                          }}
                          init_value={toValue(article.body)}
                          init_title={article.title}
                          init_topics={article.topics}
                          init_members={article.members}
                          init_authors={
                            isNil($.blog_data) ? [] : $.blog_data.authors
                          }
                        />
                      )}
                    </Flex>
                  )}
                </Flex>
              </Flex>
              {tab !== "full_preview" ? <Note /> : null}
            </Fragment>
          )}
          {$.posting_article ? (
            <Flex
              sx={{ position: "absolute", zIndex: 1000 }}
              width={1}
              height="100%"
              bg="rgba(0, 0, 0, 0.75)"
            >
              <Loading
                text={$.lang.posting_article}
                color="white"
                textColor="white"
              />
            </Flex>
          ) : null}
        </NavCustomized>
      </Fragment>
    )
  },
  [
    "blog_data",
    "user",
    "user_init",
    "lang",
    "blog_history_cursor",
    "blog_updated",
    "blog_editor_value",
    "data_storage",
    "posting_article",
  ]
)
