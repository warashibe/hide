import { Flex, Box, Image } from "rebass"
import hljs from "highlight.js"
const entities = require("entities")
import { LANGS } from "lib/const"
import copy from "copy-to-clipboard"
import { _checkHeight, toMarked, checkURL, useScript } from "lib/utils"
const _md = require("markdown-it")({
  html: true,
})

const mk = require("markdown-it-katex")
_md.use(mk)
import cheerio from "cheerio"
import escapeHtml from "escape-html"
import turndown from "turndown"
import ReactHtmlParser from "react-html-parser"
const md_bare = require("markdown-it")({
  html: true,
})
import sanitizeHtml from "sanitize-html"
import parser from "slate-md-serializer/lib/parser"
import {
  Editor as SEditor,
  Transforms,
  createEditor,
  Node,
  Text,
  Range,
  Element as SlateElement,
} from "slate"

import {
  hasPath,
  assocPath,
  remove,
  insertAll,
  addIndex,
  concat,
  trim,
  filter,
  map,
  isNil,
  indexOf,
  isEmpty,
} from "ramda"

export const serialize = nodes =>
  map(n => Node.string(n || []))(nodes || []).join("\n")

export const toValue = text =>
  map(v => ({ type: "paragraph", children: [{ text: v }] }))(text.split("\n"))

export const getElementOffset = element => {
  if (isNil(element)) {
    return { top: 0, left: 0 }
  }
  var de = document.documentElement
  var box = element.getBoundingClientRect()
  var top = box.top + window.pageYOffset - de.clientTop
  var left = box.left + window.pageXOffset - de.clientLeft
  return { top: top, left: left }
}
export const offsetTop = () => {
  var supportPageOffset = window.pageXOffset !== undefined
  var isCSS1Compat = (document.compatMode || "") === "CSS1Compat"
  var scrollTop = supportPageOffset
    ? window.pageYOffset
    : isCSS1Compat
    ? document.documentElement.scrollTop
    : document.body.scrollTop
  return scrollTop
}

export const makePValue = md => {
  const turndownService = new turndown({
    strongDelimiter: "**",
    emDelimiter: "*",
    headingStyle: "atx",
  })
  const html = sanitizeHtml(md_bare.render(md), {
    allowedTags: [
      "p",
      "em",
      "strong",
      "h1",
      "h2",
      "h3",
      "ul",
      "li",
      "ol",
      "a",
      "img",
      "code",
      "blockquote",
    ],
    allowedSchemes: ["http", "https", "ftp", "mailto", "tel", "data"],
  })
  const markdown = turndownService.turndown(html)
  const st = toSlate(parser.parse(markdown))
  return isEmpty(st) ? [{ type: "paragraph", children: [{ text: "" }] }] : st
}

export const toHTML = value => ReactHtmlParser(toMarked(value))

const isLeaf = v => {
  return (
    hasPath(["nodes", "0", "leaves", "0", "object"])(v) &&
    v.nodes[0].leaves[0].object === "leaf" &&
    v.nodes[0].leaves[0].text === ""
  )
}
const getNode = v => {
  let children = []
  if (!isNil(v.nodes) && !isNil(v.nodes[0])) {
    if (!isNil(v.nodes[0].leaves)) {
      for (let v2 of v.nodes || []) {
        if (v2.object === "text") {
          children = concat(children, v2.leaves)
        } else if (v2.type === "image") {
        } else if (v2.type === "link") {
          children.push({
            type: "link",
            url: v2.data.href,
            children: getNode(v2),
          })
        }
      }
    } else if (!isNil(v.nodes[0].nodes[0].leaves)) {
      if (v.nodes[0].type === "image") {
        children = [
          {
            type: "image",
            url: v.nodes[0].data.src,
            children: getNode(v.nodes[0]),
          },
        ]
      } else if (v.nodes[0].type === "link") {
        children = [
          {
            type: "link",
            url: v.nodes[0].data.href,
            children: getNode(v.nodes[0]),
          },
        ]
      } else {
        children = v.nodes[0].nodes[0].leaves
      }
    } else {
      children = v.nodes
      for (let v2 of children || []) {
        v2.children = getNode(v2)
      }
    }
    for (let v2 of children || []) {
      for (let v3 of v2.marks || []) {
        v2[v3.type] = true
      }
      delete v2.marks
    }
    delete v.nodes
  }
  return children
}

const toSlate = obj => {
  obj = filter(v => !isLeaf(v))(obj.nodes)
  for (let v of obj) {
    v.children = getNode(v)
  }
  return obj
}
const md_escape = str => {
  const map = {
    "*": "\\*",
    "#": "\\#",
    "(": "\\(",
    ")": "\\)",
    "[": "\\[",
    "]": "\\]",
    _: "\\_",
    "\\": "\\\\",
    "+": "\\+",
    "=": "\\+",
    "-": "\\-",
    "`": "\\`",
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    $: "\\$",
  }
  return str.replace(/[\*\(\)\[\]\$\+\-\\_`#<>]/g, m => map[m])
}

const parseChildren = (children, type, br = "") => {
  return addIndex(map)((v2, i2) => {
    if (isNil(v2.children)) {
      let text = v2.code ? md_escape(v2.text) : escapeHtml(md_escape(v2.text))
      if (text !== "") {
        if (v2.code) text = `\`${text}\``
        if (v2.bold)
          text = `${text.replace(/^(\s*).*$/, "$1")}**${trim(
            text
          )}**${text.replace(/^.*(\s*)$/, "$1")}`
        if (v2.italic) text = `*${text}*`
      }
      return text
    } else {
      if (v2.type === "image") {
        const txt = parseChildren(v2.children)
        return `![${txt}](${v2.url})`
      } else if (v2.type === "link") {
        const txt = parseChildren(v2.children)
        return txt === "" ? "" : `[${txt}](${v2.url})`
      } else {
        let pre = ""

        if (type === "ordered-list") pre += `${i2 + 1}. `
        if (type === "bulleted-list") pre += `- `
        return pre + parseChildren(v2.children)
      }
    }
  })(children).join(br)
}
export const toMD = nodes => {
  return map(v => {
    let pre = ""
    let br = ""
    let noText = false
    if (v.type === "heading1") {
      pre += "# "
    } else if (v.type === "heading2") {
      pre += "## "
    } else if (v.type === "heading3") {
      pre += "### "
    } else if (v.type === "block-quote") {
      pre += "> "
    } else if (v.type === "ordered-list" || v.type === "bulleted-list") {
      br = "\n"
    } else if (v.type === "image") {
      noText = true
    }
    if (!noText) {
      return pre + parseChildren(v.children, v.type, br)
    } else {
      return `![${parseChildren(v.children, v.type, br)}](${v.url})`
    }
  })(nodes).join("\n\n")
}

export const getPreview = (props, value) => {
  let sanitized = _md.render(serialize(value))
  if (props.$.data_storage === "localforage") {
    const $ = cheerio.load(`<div id="outerHTML">${sanitized}</div>`)
    $("img").each(function () {
      const src = $(this).attr("src")
      if (!isNil(src)) {
        const imageID = src.split(",")[1]
        if (!isNil(props.$.image_map[imageID])) {
          $(this).attr("src", props.$.image_map[imageID].blob_url)
        }
      }
    })
    sanitized = $("#outerHTML").html()
  }

  let __html = ReactHtmlParser(sanitized)
  let AceEditor
  AceEditor = require("react-ace").default
  require("brace/theme/monokai")

  let index = 0
  const checkCode = v => {
    if (
      !isNil(v) &&
      v.type === "pre" &&
      !isNil(v.props.children[0]) &&
      v.props.children[0].type === "code"
    ) {
      const text = v.props.children[0].props.children[0]
      const language = isNil(v.props.children[0].props.className)
        ? ""
        : v.props.children[0].props.className.split("-")[1]
      let nolang = true
      if (indexOf(language)(LANGS) !== -1) {
        require(`brace/mode/${language}`)
        nolang = false
      } else {
        require(`brace/mode/text`)
      }
      const i = index
      const onChange = code => {
        props.setSavable(true)
        const codes = code.split("\n")
        let incode = false
        let ci = 0
        let ci2 = 0
        let start = null
        let end = null
        for (let c of value) {
          const txt = c.children[0].text
          if (txt.match(/^```/) !== null && txt.match(/^```.*```/) === null) {
            if (incode === false) {
              incode = true
              if (i === ci2) {
                start = ci
              }
            } else {
              if (i === ci2) {
                end = ci
              }
              ci2 += 1
              incode = false
            }
          }
          ci += 1
        }
        let new_value =
          !isNil(start) && !isNil(end) && end - start > 1
            ? remove(start + 1, end - start - 1, value)
            : value
        new_value = insertAll(
          start + 1,
          map(t => {
            return { type: "paragraph", children: [{ text: t }] }
          })(codes)
        )(new_value)
        props.setValue(new_value)
      }
      let ace = null
      const _text = isNil(text) ? "" : text.replace(/\n$/, "")
      try {
        ace = (
          <AceEditor
            tabSize="2"
            style={{ marginBottom: "16px" }}
            width="100%"
            mode={nolang ? "text" : language}
            value={_text}
            theme="monokai"
            maxLines={Infinity}
            onChange={onChange}
            name={`code_${index++}`}
            editorProps={{ $blockScrolling: true }}
          />
        )
      } catch (e) {
        console.log(e)
      }
      return (
        <Box
          pt="17px"
          px="17px"
          pb="1px"
          bg="#272822"
          mb={3}
          color="white"
          sx={{ borderRadius: "3px", position: "relative" }}
        >
          <Box
            as="i"
            sx={{
              zIndex: 100,
              position: "absolute",
              top: "10px",
              right: "10px",
              opacity: 0.75,
              ":hover": { opacity: 1 },
              cursor: "pointer",
            }}
            onClick={() => {
              copy(_text)
              props.popNote({ text: props.$.lang.copied })
            }}
            className="fas fa-copy"
          />
          {ace}
        </Box>
      )
    } else if (hasPath(["props", "children"])(v) && !isNil(v.props.children)) {
      return assocPath(
        ["props", "children"],
        map(checkCode)(v.props.children)
      )(v)
    } else {
      return v
    }
  }

  return map(checkCode)(__html)
}

export const getTOC = (content, purify = false, image_map) => {
  const serialized = typeof content === "string" ? content : serialize(content)
  let _marked = purify ? toMarked(serialized) : _md.render(serialized)
  let __html = ReactHtmlParser(_marked)
  let content_table = []
  let scripts = []
  try {
    try {
      __html = _marked
      try {
        const $ = cheerio.load(`<div id="outerHTML">${__html}</div>`)
        $("script").each(function () {
          scripts.push($(this).attr("src"))
          $(this).remove()
        })
        $("img").each(function () {
          const src = $(this).attr("src")
          if (!isNil(src)) {
            const imageID = src.split(",")[1]
            if (!isNil(image_map[imageID])) {
              $(this).attr("src", image_map[imageID].blob_url)
            }
          }
        })
        $("pre").each(function () {
          $(this)
            .find("code")
            .each(function () {
              let language
              try {
                const classes = $(this).attr("class").split(" ")
                for (let v of classes) {
                  if (v.match(/language-/) !== null) {
                    language = v.split("-").slice(1).join("-")
                  }
                }
              } catch (e) {}
              $(this).addClass("hljs")
              try {
                $(this).html(
                  isNil(language)
                    ? hljs.highlightAuto(entities.decodeHTML($(this).html()))
                        .value
                    : hljs.highlight(
                        language,
                        entities.decodeHTML($(this).html())
                      ).value
                )
              } catch (e) {}
            })
        })
        let i = 0
        $("h1,h2").each(function (e) {
          $(this).attr("id", `title-${++i}`)
          content_table.push({
            tagname: this.name,
            index: i,
            title: $(this).text(),
          })
        })
        __html = $("#outerHTML").html()
      } catch (e) {
        console.log(e)
      }
    } catch (e) {
      console.log(e)
    }
  } catch (e) {
    console.log(e)
  }
  return { __html, content_table, scripts }
}
