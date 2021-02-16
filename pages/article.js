import { getTOC } from "lib/editor"
import ModHead from "components/ModHead"
import Comments from "components/Comments"
import useEventListener from "@use-it/event-listener"
var linkify = require("linkifyjs")
require("linkifyjs/plugins/hashtag")(linkify)
var linkifyHtml = require("linkifyjs/html")
import url from "url"
import DOMPurify from "isomorphic-dompurify"
import Link from "next/link"
import { Box, Flex, Image } from "rebass"
import NavCustomized from "components/NavCustomized"
import Loading from "components/Loading"
import TOC from "components/TOC"
import moment from "moment"
import "moment/locale/ja"
moment.locale("ja")
import { bind } from "nd"
import { useState, Fragment, useEffect } from "react"
import { getContrastYIQ } from "lib/utils"
import {
  assoc,
  values,
  concat,
  addIndex,
  o,
  sortBy,
  isNil,
  map,
  prepend,
  keys,
  compose,
  filter,
  includes,
  indexBy,
  groupBy,
  prop,
  uniq,
  mergeLeft,
  append,
  is,
  clone,
  tap,
} from "ramda"
const btn = { cursor: "pointer", ":hover": { opacity: 0.75 } }
import conf from "nd/conf"
import { checkURL, useScript } from "lib/utils"
import { comment_map_parent } from "lib/selectors"
import {
  Switch,
  Label,
  Input,
  Select,
  Textarea,
  Radio,
  Checkbox,
} from "@rebass/forms"

import hljs from "highlight.js"
import cheerio from "cheerio"
import Dracula from "lib/css/Dracula"
import GithubMarkdown from "lib/css/GithubMarkdown"

export const _checkHeight = ({ ids, _default, delay = 0, setHeight }) => {
  if (!isNil(window)) {
    let missing = false
    let tries = 0
    const check = () => {
      tries += 1
      setTimeout(() => {
        let _height = window.innerHeight
        const h1 = document.getElementById(ids[0])
        if (!isNil(h1)) {
          _height -= h1.offsetHeight
          if (ids.length > 1) {
            for (let v of ids.slice(1)) {
              const h = document.getElementById(v)
              if (!isNil(h)) {
                _height -= h.offsetHeight
              } else {
                missing = true
              }
            }
          }
        } else {
          missing = true
        }
        if (missing === false) {
          setHeight(_height)
        } else {
          if (tries < 5) {
            check()
          }
        }
      }, delay)
    }
    check()
  }
}

const Script = props => {
  useScript(props.src + "?_=" + Date.now())
  return null
}

const offsetTop = () => {
  var supportPageOffset = window.pageXOffset !== undefined
  var isCSS1Compat = (document.compatMode || "") === "CSS1Compat"
  var scrollTop = supportPageOffset
    ? window.pageYOffset
    : isCSS1Compat
    ? document.documentElement.scrollTop
    : document.body.scrollTop
  return scrollTop
}

const isContent = (v, cmap, arr = []) => {
  for (let v2 of cmap[v.id] || []) {
    if (v2.state !== "deleted") {
      arr.push(v2)
    }
    isContent(v2, cmap, arr)
  }
  return arr
}
const Article = ({ set, init, $, _article, router }) => {
  const [loading, setLoading] = useState(
    (isNil(_article) || !isNil(_article.body)) &&
      $.data_storage !== "localforage"
      ? false
      : true
  )
  const [article, setArticle] = useState(_article)
  const [articleConf, setArticleConf] = useState(null)
  const [comment, setComment] = useState("")
  const [isComment, setIsComment] = useState(null)
  const [comment_reply, setCommentReply] = useState("")
  const [reply, setReply] = useState(null)
  const [edit, setEdit] = useState(null)
  const fn = init([
    "removeFromAuthors",
    "getComments",
    "addComment",
    "deleteComment",
    "getLocalArticle",
    "downloadMD",
    "getArticleConf",
    "getImages",
  ])
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
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if ($.isFB && !isNil(article)) fn.getImages({})
  }, [article, $.isFB])

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
  useEffect(() => {
    ;(async () => {
      if ($.isFB && !isNil(article)) {
        const art_conf = await fn.getArticleConf({ article })
        setArticleConf(art_conf)
      }
    })()
  }, [$.isFB, article])
  useEffect(() => {
    ;(async () => {
      if ($.isFB && !isNil(router.query.id)) {
        if ($.data_storage === "localforage") {
          setArticle(await fn.getLocalArticle({ id: router.query.id }))
        }
      }
    })()
  }, [router, $.isFB])

  if (isNil(article) || article.no_display) {
    return (
      <NavCustomized>
        {loading || true ? (
          <Flex
            sx={{ position: "absolute", zIndex: 1000 }}
            width={1}
            height="100%"
            bg="rgba(0, 0, 0, 0.75)"
          >
            <Loading
              text={$.lang.loading_article}
              color="#ffffff"
              textColor="#ffffff"
            />
          </Flex>
        ) : (
          <Flex justifyContent="center" alignItems="center" height="100%">
            {$.no_article}
          </Flex>
        )}
      </NavCustomized>
    )
  }

  let { __html, content_table, scripts } = getTOC(
    article.body,
    true,
    $.image_map
  )
  const author_map = isNil(article)
    ? {}
    : mergeLeft(
        { [article.uid]: article.user },
        isNil(articleConf) ? {} : articleConf.authors_data || {}
      )
  const authors = isNil(article)
    ? []
    : o(
        uniq,
        append(article.uid)
      )(isNil(articleConf) ? [] : articleConf.authors || [])
  let side_height = 45
  let side_selected = null
  let font_size = "16px"
  let side_iconWidth = 50
  const ArticleHeader = () => {
    return (
      <Flex width={1} flexWrap="wrap">
        <Flex width={1} alignItems="center" px={2} flexWrap="wrap">
          <Flex width={authors.length <= 1 ? "60px" : 1}>
            {map(a => {
              const author = author_map[a]
              return (
                <Link href={`/user?id=${author.uid}`}>
                  <Image
                    sx={{
                      cursor: "pointer",
                      ":hover": { opacity: 0.75 },
                      borderRadius: "50%",
                    }}
                    mr={2}
                    width="40px"
                    src={author.image}
                    title={author.name}
                    height="40px"
                  />
                </Link>
              )
            })(authors)}
          </Flex>
          <Flex
            flex={authors.length <= 1 ? 1 : null}
            width={authors.length <= 1 ? 1 / 2 : null}
            fontSize="14px"
            flexWrap="wrap"
            lineHeight="150%"
            mt={authors.length <= 1 ? 0 : 3}
          >
            <Box width={1}>
              {addIndex(map)((a, i) => {
                const author = author_map[a]
                return (
                  <Link href={`/user?id=${author.uid}`}>
                    <Box
                      as="span"
                      sx={{
                        cursor: "pointer",
                        ":hover": { opacity: 0.75 },
                        wordBreak: "break-all",
                      }}
                    >
                      {(i !== 0 ? ", " : "") + author.name}
                    </Box>
                  </Link>
                )
              })(authors)}
            </Box>
            <Flex alignItems="center" flexWrap="wrap">
              <Box mr={2}>
                {moment(article.published_at || article.created_at).fromNow()}
              </Box>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    )
  }
  const ArticleBtns = () => (
    <Flex
      alignItems="center"
      justifyContent={["center", null, "flex-end", null, "center"]}
      mt={[3, null, null, null, null, 2]}
      width={1}
      fontSize="14px"
    >
      {isNil($.user) || $.user.uid !== article.uid ? null : (
        <Link href={`/articles/edit?id=${article.id}`}>
          <Box
            bg="#5386E4"
            color="white"
            py={2}
            px={3}
            mx={[2, null, null, null, 1]}
            textAlign="center"
            flex={[1, null, null, "auto"]}
            sx={{
              borderRadius: "3px",
              cursor: "pointer",
              ":hover": { opacity: 0.75 },
            }}
          >
            <Box as="i" className="fas fa-edit" mr={2} />
            {$.lang.edit}
          </Box>
        </Link>
      )}
      {isNil($.user) ||
      !includes($.user.uid)(authors) ||
      $.user.uid === article.uid ? null : (
        <Box
          bg="#FF5757"
          color="white"
          py={2}
          px={3}
          mx={[2, null, null, null, 1]}
          textAlign="center"
          flex={[1, null, null, "auto"]}
          sx={{
            borderRadius: "3px",
            cursor: "pointer",
            ":hover": { opacity: 0.75 },
          }}
          onClick={async () => {
            if (confirm($.lang.remove_coauthor)) {
              const new_authors = await fn.removeFromAuthors({
                user: $.user,
                article,
              })
              await setArticle(
                mergeLeft({ authors: new_authors }, article),
                article
              )
              alert($.lang.author_removed)
            }
          }}
        >
          <Box as="i" className="fas fa-ban" mr={2} />
          {$.lang.coauthoring}
        </Box>
      )}
      {(isNil($.user) || $.user.uid !== article.uid) &&
      article.downloadable !== true ? null : (
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
          onClick={() => fn.downloadMD({ article })}
        >
          <Box as="i" className="fas fa-download" mr={2} />
          DL
        </Box>
      )}
    </Flex>
  )
  return (
    <Fragment>
      {isNil(article) ? null : (
        <ModHead
          title={`${article.title} | ${article.user.name}`}
          description={article.overview}
          image={article.cover}
        />
      )}
      <NavCustomized
        side_iconWidth={side_iconWidth}
        side_height={side_height}
        side_selected={side_selected}
        side_fontSize={font_size}
      >
        <GithubMarkdown />
        <Dracula />
        <Flex color="#333" sx={{ position: "relative" }}>
          <Box width={[1, null, null, 3 / 4]} sx={{ maxWidth: "750px" }}>
            <Box px={[4]}>
              <Box
                py={4}
                sx={{ borderBottom: ["none", null, null, "1px solid #ddd"] }}
              >
                <Box
                  lineHeight="150%"
                  fontSize={["25px", "30px", "40px"]}
                  fontWeight="bold"
                >
                  {article.title}
                </Box>
                <Box
                  mt={3}
                  width={1}
                  display={["block", null, null, null, null, "none"]}
                >
                  <ArticleHeader />
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
              className="markdown-body"
              lineHeight="200%"
              dangerouslySetInnerHTML={{
                __html: __html,
              }}
            />
            <Box
              width={1}
              display={["block", null, null, null, null, "none"]}
              mb={3}
            >
              <Comments
                {...{
                  isBorderTop: true,
                  comment_map: $.comment_map_parent,
                  comment_map_id: $._comment_map,
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
                }}
              />
            </Box>
          </Box>
          <Box
            flex={1}
            display={["none", null, null, "block"]}
            sx={{ maxWidth: "350px" }}
          >
            <Box width={1} sx={{ top: 80, position: "sticky" }} pr={4}>
              <Box
                p={3}
                bg="#eee"
                mb={3}
                sx={{ borderRadius: "5px" }}
                display={["none", null, null, null, null, "block"]}
              >
                <ArticleHeader />
              </Box>
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
          <Box
            bg="#eee"
            flex={1}
            display={["none", null, null, null, null, "block"]}
          >
            <Box
              width={1}
              py={4}
              sx={{
                direction: "rtl",
                top: 50,
                position: "sticky",
                overflow: "auto",
              }}
              height={height}
            >
              <Box sx={{ direction: "ltr" }}>
                <Comments
                  {...{
                    isBorderTop: true,
                    comment_map: $.comment_map_parent,
                    comment_map_id: $._comment_map,
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
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Flex>
        {compose(
          map(v => <Script src={v} />),
          filter(v => {
            if (isNil(v)) return false
            const _url = url.parse(v)
            return includes(_url.hostname)([
              "widgets.coingecko.com",
              "platform.twitter.com",
            ])
          })
        )(scripts)}
      </NavCustomized>
    </Fragment>
  )
}

export default bind(Article, [
  "user",
  "lang",
  "isFB",
  "data_storage",
  "comments",
  "next_comments",
  "blog_user_map",
  "blog_map",
  "_comment_map",
  "image_map",
  {
    comment_map_parent,
  },
])
