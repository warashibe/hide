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
  Editable,
  withReact,
  useSlate,
  Slate,
  useSelected,
  useFocused,
} from "slate-react"

import copy from "copy-to-clipboard"
import imageExtensions from "image-extensions"
import isUrl from "is-url"
import { withHistory } from "slate-history"

import moment from "moment"
require("moment-timezone")
moment.locale("ja")
import { toMarked } from "lib/utils"
import { Button, Icon } from "components/RichEditor"
import { Input, Select, Textarea, Radio, Checkbox } from "@rebass/forms"
import { getTOC, toMD, serialize, toValue, makePValue } from "lib/editor"
import GithubMarkdown from "lib/css/GithubMarkdown"
import Dracula from "lib/css/Dracula"
import Preview from "components/Preview"
import FullPreview from "components/FullPreview"

import {
  without,
  append,
  concat,
  compose,
  filter,
  prepend,
  equals,
  reverse,
  addIndex,
  isNil,
  map,
  includes,
  keys,
  uniq,
} from "ramda"

import { Flex, Box, Image } from "rebass"
import { Fragment, useEffect, useState, useMemo, useCallback } from "react"
import { bind } from "nd"
import url from "url"
import useInterval from "@use-it/interval"

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }
  if (leaf.code) {
    children = <code>{children}</code>
  }
  if (leaf.italic) {
    children = <em>{children}</em>
  }
  return <span {...attributes}>{children}</span>
}

const withImages = editor => {
  const { insertData, isVoid } = editor

  editor.isVoid = element => {
    return element.type === "image" ? true : isVoid(element)
  }

  editor.insertData = data => {
    const text = data.getData("text/plain")
    const { files } = data

    if (files && files.length > 0) {
      for (const file of files) {
        const reader = new FileReader()
        const [mime] = file.type.split("/")

        if (mime === "image") {
          reader.addEventListener("load", () => {
            const url = reader.result
            insertImage(editor, url)
          })

          reader.readAsDataURL(file)
        }
      }
    } else if (isImageUrl(text)) {
      insertImage(editor, text)
    } else {
      insertData(data)
    }
  }

  return editor
}

const insertImage = (editor, url) => {
  Transforms.insertNodes(editor, {
    type: "image",
    url,
    children: [{ text: "" }],
  })
  if (editor.selection.anchor.path[0] + 1 == editor.children.length) {
    Transforms.insertNodes(editor, {
      type: "paragraph",
      children: [{ text: "" }],
    })
  }
}

const ImageElement = ({ attributes, children, element, image_map = {} }) => {
  const selected = useSelected()
  const focused = useFocused()
  let src = element.url
  if (!isNil(src)) {
    const imageID = src.split(",")[1]
    if (!isNil(image_map[imageID])) {
      src = image_map[imageID].blob_url
    }
  }

  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <Image
          src={src}
          sx={{
            display: "block",
            maxWidth: "100%",
            maxHeight: "20em",
            boxShadow: `${selected && focused ? "0 0 0 3px #B4D5FF" : "none"}`,
          }}
        />
      </div>
      {children}
    </div>
  )
}

const InsertImageButton = () => {
  const editor = useSlate()
  return (
    <Button
      onMouseDown={event => {
        event.preventDefault()
        const url = window.prompt("Enter the URL of the image:")
        if (!url) return
        insertImage(editor, url)
      }}
    >
      <Icon className="fas fa-image" />
    </Button>
  )
}

const isImageUrl = url => {
  if (!url) return false
  if (!isUrl(url)) return false
  const ext = new URL(url).pathname.split(".").pop()
  return imageExtensions.includes(ext)
}

const withLinks = editor => {
  const { insertData, insertText, isInline } = editor

  editor.isInline = element => {
    return element.type === "link" ? true : isInline(element)
  }

  editor.insertText = text => {
    if (text && isUrl(text)) {
      wrapLink(editor, text)
    } else {
      insertText(text)
    }
  }

  editor.insertData = data => {
    const text = data.getData("text/plain")

    if (text && isUrl(text)) {
      wrapLink(editor, text)
    } else {
      insertData(data)
    }
  }

  return editor
}

const insertLink = (editor, url) => {
  if (editor.selection) {
    wrapLink(editor, url)
  }
}

const isLinkActive = editor => {
  const [link] = SEditor.nodes(editor, {
    match: n =>
      !SEditor.isEditor(n) && SlateElement.isElement(n) && n.type === "link",
  })
  return !!link
}

const unwrapLink = editor => {
  Transforms.unwrapNodes(editor, {
    match: n =>
      !SEditor.isEditor(n) && SlateElement.isElement(n) && n.type === "link",
  })
}

const wrapLink = (editor, url) => {
  if (isLinkActive(editor)) {
    unwrapLink(editor)
  }

  const { selection } = editor
  const isCollapsed = selection && Range.isCollapsed(selection)
  const link = {
    type: "link",
    url,
    children: isCollapsed ? [{ text: url }] : [],
  }

  if (isCollapsed) {
    Transforms.insertNodes(editor, link)
  } else {
    Transforms.wrapNodes(editor, link, { split: true })
    Transforms.collapse(editor, { edge: "end" })
  }
}

const Element = props => {
  const { attributes, children, element } = props
  switch (element.type) {
    case "link":
      return (
        <a {...attributes} href={element.url}>
          {children}
        </a>
      )
    case "image":
      return <ImageElement {...props} />
    case "block-quote":
      return <blockquote {...attributes}>{children}</blockquote>
    case "bulleted-list":
      return <ul {...attributes}>{children}</ul>
    case "heading1":
      return <h1 {...attributes}>{children}</h1>
    case "heading2":
      return <h2 {...attributes}>{children}</h2>
    case "heading3":
      return <h3 {...attributes}>{children}</h3>
    case "heading4":
      return <h4 {...attributes}>{children}</h4>
    case "heading5":
      return <h5 {...attributes}>{children}</h5>
    case "heading6":
      return <h6 {...attributes}>{children}</h6>
    case "list-item":
      return <li {...attributes}>{children}</li>
    case "ordered-list":
      return <ol {...attributes}>{children}</ol>
    default:
      return <p {...attributes}>{children}</p>
  }
}

const makeT = v =>
  addIndex(map)((v2, i2) => {
    let text = ""
    if (!isNil(v2.text)) text = v2.text
    if (v2.bold) text = `**${text}**`
    if (v2.italic) text = `*${text}*`
    if (v2.code) text = `\`${text}\``
    if (v.type === "ordered-list" && v2.type === "list-item")
      text = (i2 > 0 ? "\n" : "") + `${i2 + 1}. ${makeT(v2)}`
    if (v.type === "bulleted-list" && v2.type === "list-item")
      text = (i2 > 0 ? "\n" : "") + `- ${makeT(v2)}`
    return text
  })(v.children).join("")

const serializeHTML = node => {
  return map(v => {
    let ptext = makeT(v)
    if (v.type === "block-quote") ptext = `> ${ptext}`
    if (v.type === "heading1") ptext = `# ${ptext}`
    if (v.type === "heading2") ptext = `## ${ptext}`
    return ptext
  })(node)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
}

const HOTKEYS = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+`": "code",
}

const LIST_TYPES = ["ordered-list", "bulleted-list"]

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format)
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: n =>
      LIST_TYPES.includes(
        !SEditor.isEditor(n) && SlateElement.isElement(n) && n.type
      ),
    split: true,
  })
  const newProperties = {
    type: isActive ? "paragraph" : isList ? "list-item" : format,
  }
  Transforms.setNodes(editor, newProperties)

  if (!isActive && isList) {
    const block = { type: format, children: [] }
    Transforms.wrapNodes(editor, block)
  }
}

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format)
  if (isActive) {
    SEditor.removeMark(editor, format)
  } else {
    SEditor.addMark(editor, format, true)
  }
}

const isBlockActive = (editor, format) => {
  const [match] = SEditor.nodes(editor, {
    match: n =>
      !SEditor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
  })

  return !!match
}

const isMarkActive = (editor, format) => {
  const marks = SEditor.marks(editor)
  return marks ? marks[format] === true : false
}

const LinkButton = () => {
  const editor = useSlate()
  return (
    <Button
      active={isLinkActive(editor)}
      onMouseDown={event => {
        event.preventDefault()
        const url = window.prompt("Enter the URL of the link:")
        if (!url) return
        insertLink(editor, url)
      }}
    >
      <Icon className="fas fa-link" />
    </Button>
  )
}

const BlockButton = ({ format, icon, text }) => {
  const editor = useSlate()
  return (
    <Button
      active={isBlockActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
    >
      <Icon className={icon} text={text} />
    </Button>
  )
}

const MarkButton = ({ format, icon }) => {
  const editor = useSlate()
  return (
    <Button
      active={isMarkActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
    >
      <Icon className={icon} />
    </Button>
  )
}

export default bind(
  ({
    setTab,
    router,
    set,
    conf,
    get,
    $,
    init_value,
    editor_style,
    init,
    height,
    init_title,
    init_topics,
    init_id,
    init_cover,
    init_members,
    init_authors,
    global,
    tab,
    setDownloadable,
    downloadable,
    setUnlisted,
    unlisted,
    setRestricted,
    restricted,
    setEpic,
    epic,
    setNewEpic,
    new_epic,
  }) => {
    const url_parsed = url.parse(location.href)
    const domain = `${url_parsed.protocol}//${url_parsed.host}`
    const fn = init([
      "parseImportMD",
      "downloadMD",
      "searchUserWithKey",
      "popNote",
      "uploadToHideaki",
      "getGallery",
      "getCovers",
      "popNote",
      "clearHistory",
      "loadHistory",
      "postArticle",
      "deleteArticle",
      "getHistory",
      "getTopics",
      "saveHistory",
      "getUserMap",
    ])
    const [ext, setExt] = useState(null)
    const [isCoAuthor, setIsCoAuther] = useState(
      (init_authors || []).length !== 0
    )
    const [storage, setStorage] = useState("hideaki")
    const [uploadedArtwork, setUploadedArtwork] = useState(null)
    const [uploadedArtworkURL, setUploadedArtworkURL] = useState(null)
    const [value, setValue] = useState(
      init_value || [{ type: "paragraph", children: [{ text: "" }] }]
    )
    const [importMD, setImportMD] = useState(null)
    const [pvalue, setPValue] = useState(value)
    const [subtab, setSubtab] = useState("default")
    const [editTab, setEditTab] = useState("markdown")
    const [mobileTab, setMobileTab] = useState("edit")
    const [topics, setTopics] = useState(init_topics || [])
    const [id, setID] = useState(init_id || null)
    const [title, setTitle] = useState(init_title || "")
    const [cover, setCover] = useState(init_cover || { hash: null, src: null })
    const [savable, setSavable] = useState(false)
    const [check, setCheck] = useState(Date.now())
    const [history, setHistory] = useState([])
    const [searchKey, setSearchKey] = useState("")
    const [searchKey2, setSearchKey2] = useState("")
    const [members, setMembers] = useState(init_members || [])
    const [authors, setAuthors] = useState(init_authors || [])
    const [history_cursor, setHistoryCursor] = useState(-1)
    const [md, setMD] = useState(serialize(value))
    const _saveHistory = async () => {
      const new_history = await fn.saveHistory({
        id,
        title,
        body: md,
      })
      setHistory(new_history)
      setHistoryCursor(new_history.length - 1)
      setSavable(false)
    }
    useInterval(() => {
      if (savable) _saveHistory()
    }, 30000)

    useEffect(() => {
      fn.getTopics()
      fn.getUserMap({ uids: concat(authors, members) })
    }, [])
    useEffect(() => {
      setMD(serialize(value))
    }, [value])

    useEffect(() => {
      let _md = toMD(pvalue)
      setMD(_md)
      const value = toValue(_md)
      setValue(value)
    }, [pvalue])

    useEffect(() => {
      if (editTab === "rich") {
        setPValue(makePValue(md))
      } else {
        const value = toValue(md)
        setValue(value)
      }
    }, [editTab])

    useEffect(() => {
      ;(async () => {
        const { diff, current } = await fn.getHistory({ id: init_id })
        try {
          setHistory(diff)
          if (isNil(init_id)) {
            setTitle(current.title)
            const value = toValue(current.body)
            setValue(value)
            setHistoryCursor(diff.length - 1)
          }
          setSavable(false)
        } catch (e) {}
      })()
    }, [])
    useEffect(() => {
      if (tab === "post") {
        fn.getCovers({ html: toMarked(serialize(value)) })
      }
    }, [tab])
    useEffect(() => {
      if (!isNil($.user)) {
        fn.getGallery({ user: $.user })
      }
    }, [$.user])

    const renderElement = useCallback(
      props => <Element {...props} image_map={$.image_map} />,
      [$.image_map]
    )
    const renderLeaf = useCallback(props => <Leaf {...props} />, [])
    const editor = useMemo(() => withHistory(withReact(createEditor())), [])
    const peditor = useMemo(
      () => withHistory(withImages(withLinks(withReact(createEditor())))),
      []
    )

    const onChange = _value => {
      if (!equals(_value, value)) {
        setSavable(true)
      }
      setValue(_value)
    }
    const onChangeP = _value => {
      if (!equals(_value, pvalue)) {
        setSavable(true)
      }
      setPValue(_value)
    }

    let subtabs = [{ key: "default", name: $.lang.preview, icon: "fas fa-eye" }]
    subtabs.push({
      key: "gallery",
      name: $.lang.gallery,
      icon: "fas fa-image",
    })
    subtabs.push({ key: "toc", name: $.lang.toc, icon: "fas fa-list-ul" })
    subtabs.push({
      key: "history",
      name: $.lang.edit_history,
      icon: "fas fa-history",
    })
    subtabs.push({
      key: "advanced",
      name: $.lang.advanced,
      icon: "fas fa-cogs",
    })

    const _title = (
      <Flex width={[1, null, 1 / 2]}>
        {tab === "edit" ? (
          <Fragment>
            <Box
              textAlign="center"
              width="35px"
              title="Markdown"
              bg={editTab === "markdown" ? "#5386E4" : "#999"}
              sx={{ cursor: "pointer" }}
              color={"white"}
              p={2}
              onClick={async () => {
                if (savable) await _saveHistory()
                setEditTab("markdown")
              }}
            >
              <Box as="i" className="fab fa-markdown" />
            </Box>
            <Box
              textAlign="center"
              width="35px"
              title="Markdown"
              bg={editTab === "rich" ? "#5386E4" : "#999"}
              sx={{ cursor: "pointer" }}
              color={"white"}
              p={2}
              onClick={async () => {
                if (confirm($.lang.not_compatible)) {
                  if (savable) await _saveHistory()
                  setEditTab("rich")
                }
              }}
            >
              <Box as="i" className="fas fa-tv" />
            </Box>
          </Fragment>
        ) : null}

        <Input
          flex={1}
          id="blog_title"
          sx={{
            border: "0",
            borderBottom: "1px solid #999",
            borderRight: "1px solid #999",
            borderRadius: 0,
          }}
          placeholder={$.lang.article_title}
          defaultValue={title}
          value={title}
          onChange={e => {
            setTitle(e.target.value)
            setSavable(true)
          }}
        />
        {map(v => {
          return (
            <Box
              display={["block", null, "none"]}
              textAlign="center"
              width="35px"
              title={v.name}
              bg={mobileTab === v.key ? "#5386E4" : "#999"}
              sx={{ cursor: "pointer" }}
              color={"white"}
              p={2}
              onClick={() => setMobileTab(v.key)}
            >
              {isNil(v.image) ? (
                <Box as="i" className={v.icon} />
              ) : (
                <Image src={v.image} size="16px" />
              )}
            </Box>
          )
        })(
          prepend(
            {
              key: "edit",
              name: tab === "post" ? $.lang.post_tab : $.lang.edit,
              icon: tab === "post" ? "fas fa-upload" : "fas fa-edit",
            },
            subtabs
          )
        )}
      </Flex>
    )
    const btns =
      tab === "post" ? (
        <Flex width={1}>
          <Box
            flex={1}
            textAlign="center"
            onClick={async () => {
              if (/^\s*$/.test(title)) {
                alert($.lang.enter_title)
              } else {
                const post = await fn.postArticle({
                  epic,
                  authors,
                  members,
                  restricted,
                  unlisted,
                  downloadable,
                  article: $.blog_article,
                  id,
                  user: $.user,
                  cover: cover,
                  title: title,
                  body: serialize(value),
                  published: false,
                  topics,
                })
                if (post.err === false) {
                  if (isNil(id)) {
                    setHistory(post.history)
                    setHistoryCursor(history.length)
                  }
                  router.replace(`/articles/edit?id=${post.id}`, undefined, {
                    shallow: true,
                  })
                  setID(post.id)
                }
              }
            }}
            sx={{ cursor: "pointer" }}
            p={2}
            bg="teal"
            color="white"
          >
            {isNil($.blog_article) || $.blog_article.published === false
              ? $.lang.post_draft
              : $.lang.unpublish}
          </Box>
          <Box
            flex={1}
            textAlign="center"
            onClick={async () => {
              if (/^\s*$/.test(title)) {
                alert($.lang.enter_title)
              } else {
                const post = await fn.postArticle({
                  epic,
                  authors,
                  members,
                  restricted,
                  unlisted,
                  downloadable,
                  article: $.blog_article,
                  id,
                  user: $.user,
                  cover: cover,
                  title: title,
                  body: serialize(value),
                  topics,
                })
                if (post.err === false) {
                  if (isNil(id)) {
                    setHistory(post.history)
                    setHistoryCursor(history.length)
                    setSavable(false)
                  }
                  router.replace(`/articles/edit?id=${post.id}`, undefined, {
                    shallow: true,
                  })
                  setID(post.id)
                }
              }
            }}
            sx={{ cursor: "pointer" }}
            p={2}
            bg="#5386E4"
            color={"white"}
            id="blog_btn_save"
          >
            {$.lang.publish}
          </Box>

          {isNil($.blog_article) ? null : (
            <Box
              flex={1}
              textAlign="center"
              onClick={async () => {
                if (confirm($.lang.delete_confirmation)) {
                  await fn.deleteArticle({ id, user: $.user })
                  router.replace(`/user?id=${$.user.uid}`)
                }
              }}
              sx={{ cursor: "pointer" }}
              p={2}
              bg="#FF5757"
              color="white"
            >
              {$.lang.delete}
            </Box>
          )}
        </Flex>
      ) : tab === "edit" ? (
        <Flex width={1}>
          <Box
            flex={1}
            textAlign="center"
            onClick={() => {
              setTab("full_preview")
            }}
            sx={{ cursor: "pointer" }}
            p={2}
            bg="#5386E4"
            color={"white"}
            id="blog_btn_save"
          >
            {$.lang.full_preview}
          </Box>
          <Box
            flex={1}
            textAlign="center"
            onClick={async () => {
              if (savable) {
                _saveHistory()
              }
            }}
            sx={{ cursor: savable ? "pointer" : "default" }}
            p={2}
            bg={savable ? "teal" : "gray"}
            color="white"
            id="blog_btn_save"
          >
            {$.lang.save_history}
          </Box>
          {isNil(id) ? (
            <Box
              flex={1}
              textAlign="center"
              onClick={async () => {
                if (confirm($.lang.clear_history)) {
                  fn.clearHistory({ id })
                  setTitle("")
                  const value = [
                    { type: "paragraph", children: [{ text: "" }] },
                  ]
                  setValue(value)
                  setPValue(value)
                  setHistory([])
                  setHistoryCursor(-1)
                }
              }}
              sx={{ cursor: "pointer" }}
              p={2}
              bg="#BF731C"
              color="white"
              id="blog_btn_save"
            >
              {$.lang.reset}
            </Box>
          ) : null}
        </Flex>
      ) : null
    const __toc = getTOC(value, null, $.image_map)
    const toc =
      subtab === "toc" || mobileTab === "toc" ? __toc.content_table : null
    const _toc = (
      <Fragment>
        <Box color="#5386E4" fontWeight="bold" mb={2}>
          {$.lang.table_of_contents}
        </Box>
        <Box sx={{ borderLeft: `3px solid #5386E4` }} ml={3} p={2}>
          {map(v => {
            return (
              <Box
                display="block"
                color="#666"
                sx={{
                  textDecoration: "none",
                  ":hover": {
                    color: "#5386E4",
                  },
                }}
                p={1}
                ml={v.tagname === "h1" ? 2 : "25px"}
                fontSize={v.tagname === "h1" ? "18px" : "16px"}
              >
                {v.title}
              </Box>
            )
          })(toc || [])}
        </Box>
      </Fragment>
    )
    const _history = (
      <Box p={2} width={1}>
        {addIndex(map)((v, i) => {
          return (
            <Flex
              display="inline-block"
              width={1}
              py={1}
              px={2}
              textAlign="center"
              bg={
                history_cursor === history.length - i - 1
                  ? "#5386E4"
                  : i % 2 === 0
                  ? "#777"
                  : "#555"
              }
              color={"white"}
              sx={{ cursor: "pointer", ":hover": { opacity: 0.75 } }}
              onClick={() => {
                const obj = fn.loadHistory({
                  history,
                  index: history.length - i - 1,
                })
                setTitle(obj.title)
                setMD(obj.body)
                const value =
                  editTab === "markdown"
                    ? setValue(toValue(obj.body))
                    : setPValue(makePValue(obj.body))
                setHistoryCursor(history.length - i - 1)
              }}
            >
              <Flex width="50px" justifyContent="center">
                {history.length - i}
              </Flex>
              <Flex flex={1}>
                {moment(v.date).format("YYYY MM/DD HH:mm:ss")}
              </Flex>
            </Flex>
          )
        })(reverse(history))}
      </Box>
    )
    return tab === "full_preview" ? (
      <FullPreview
        {...{
          content: value,
          setTab,
          title,
          height,
          $,
          downloadMD: fn.downloadMD,
        }}
      />
    ) : (
      <Flex
        width={1}
        height="100%"
        flexDirection="column"
        display="none"
        fontSize={["14px", null, "16px"]}
      >
        <style global jsx>{`
          #slate img {
            margin-bottom: 16px;
          }
        `}</style>
        <Flex width={1} flexWrap="wrap">
          {_title}
          <Box
            width={[1, null, 1 / 2]}
            flexWrap="wrap"
            display={["none", null, "flex"]}
          >
            {map(v => {
              const bg = v.key === subtab ? "#5386E4" : "#999"
              return (
                <Box
                  textAlign="center"
                  width={1 / subtabs.length}
                  bg={bg}
                  sx={{ cursor: "pointer" }}
                  color={"white"}
                  p={2}
                  onClick={() => setSubtab(v.key)}
                >
                  {v.name}
                </Box>
              )
            })(subtabs)}
          </Box>
        </Flex>
        <Flex flex={1} width={1} flexWrap="wrap">
          <Box
            display={[mobileTab !== "edit" ? "flex" : "none", null, "none"]}
            width={[1, null, 1 / 2]}
            sx={{ borderRight: "1px solid #999", overflow: "auto" }}
            height={isNil(height) ? null : height + "px"}
            p={mobileTab === "preview" ? "16px" : null}
            className={mobileTab === "markdown-body" ? "16px" : null}
          >
            {mobileTab === "history" ? (
              _history
            ) : mobileTab === "toc" ? (
              <Box p={3} height={height} sx={{ overflow: "auto" }}>
                {_toc}
              </Box>
            ) : (
              <Box
                width={1}
                p="16px"
                className="markdown-body"
                height={isNil(height) ? null : height + "px"}
                sx={{ overflow: "auto" }}
              >
                <Preview
                  subtab={mobileTab}
                  scripts={__toc.scripts}
                  $={$}
                  popNote={fn.popNote}
                  setValue={setValue}
                  value={value}
                  height={height}
                  setSavable={setSavable}
                />
              </Box>
            )}
          </Box>
          <Box
            display={[mobileTab === "edit" ? "flex" : "none", null, "flex"]}
            width={[1, null, 1 / 2]}
            sx={{ borderRight: "1px solid #999", overflow: "auto" }}
          >
            {tab === "edit" ? (
              editTab === "markdown" ? (
                <Slate editor={editor} value={value} onChange={onChange}>
                  <Box width={1}>
                    <Flex
                      width={1}
                      sx={{ overflow: "auto" }}
                      height={isNil(height) ? null : height + "px"}
                    >
                      <Editable
                        spellCheck
                        style={editor_style || {}}
                        id="slate"
                      />
                    </Flex>
                  </Box>
                </Slate>
              ) : (
                <Slate editor={peditor} value={pvalue} onChange={onChangeP}>
                  <GithubMarkdown />
                  <Dracula />
                  <Box width={1}>
                    <Flex
                      alignItems="center"
                      bg="#333"
                      justifyContent="center"
                      height="35px"
                    >
                      <LinkButton />
                      <InsertImageButton />
                      <MarkButton format="bold" icon="fas fa-bold" />
                      <MarkButton format="italic" icon="fas fa-italic" />
                      <MarkButton format="code" icon="fas fa-code" />
                      <BlockButton
                        format="heading1"
                        icon="fas fa-heading"
                        text="H1"
                      />
                      <BlockButton
                        format="heading2"
                        icon="fas fa-heading"
                        text="H2"
                      />
                      <BlockButton
                        format="heading3"
                        icon="fas fa-heading"
                        text="H3"
                      />
                      <BlockButton
                        format="block-quote"
                        icon="fas fa-quote-right"
                      />
                      <BlockButton
                        format="ordered-list"
                        icon="fas fa-list-ol"
                      />
                      <BlockButton
                        format="bulleted-list"
                        icon="fas fa-list-ul"
                      />
                    </Flex>
                    <Flex
                      width={1}
                      sx={{ overflow: "auto" }}
                      height={isNil(height) ? null : height - 35 + "px"}
                      className="markdown-body"
                    >
                      <Editable
                        renderElement={renderElement}
                        renderLeaf={renderLeaf}
                        spellCheck
                        style={{ ...editor_style } || {}}
                        id="slate"
                      />
                    </Flex>
                  </Box>
                </Slate>
              )
            ) : (
              <Box
                p={3}
                width={1}
                height={isNil(height) ? null : height + "px"}
              >
                <Box fontSize="12px" lineHeight="150%" color="#232538">
                  {$.lang.choose_cover}
                </Box>
                <Box width="0" height="0" sx={{ overflow: "hidden" }}>
                  <Flex
                    id="cover"
                    width="500px"
                    height="250px"
                    bg="#222"
                    fontWeight="bold"
                    color="white"
                    p={4}
                    fontSize="30px"
                    justifyContent="center"
                    alignItems="center"
                    lineHeight="150%"
                  >
                    {title}
                  </Flex>
                </Box>

                {$.covers.length === 0 ? (
                  <Box
                    p={2}
                    textAlign="center"
                    color="#FF5757"
                    mb={2}
                    fontSize="14px"
                  >
                    {$.lang.no_photo}
                  </Box>
                ) : (
                  map(v => {
                    return (
                      <Box
                        display="inline-block"
                        width="100px"
                        height="100px"
                        bg="#198643"
                        mx={2}
                        my={3}
                        onClick={() =>
                          setCover(
                            v.hash === cover.hash
                              ? { hash: null, src: null }
                              : v
                          )
                        }
                        sx={{
                          cursor: "pointer",
                          opacity: cover.hash === v.hash ? 1 : 0.75,
                          border:
                            cover.hash === v.hash
                              ? `3px solid #5386E4`
                              : "3px solid #999",
                          backgroundImage: `url(${v.src})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    )
                  })($.covers)
                )}
                <Box as="hr" />
                <Box fontSize="12px" lineHeight="150%" color="#232538" mt={3}>
                  {$.lang.only_url}
                </Box>
                <Flex mt={2} mb={3} alignItems="center" color="#111">
                  <Box
                    as="span"
                    onClick={() => setUnlisted(!unlisted)}
                    mr={2}
                    sx={{ cursor: "pointer" }}
                  >
                    <Checkbox checked={unlisted ? "checked" : ""} />
                  </Box>
                  <Box>{$.lang.unlisted}</Box>
                </Flex>
                <Box as="hr" />
                <Box fontSize="12px" lineHeight="150%" color="#232538" mt={3}>
                  {$.lang.allow_download}
                </Box>
                <Flex mt={2} mb={3} alignItems="center" color="#111">
                  <Box
                    as="span"
                    onClick={() => setDownloadable(!downloadable)}
                    mr={2}
                    sx={{ cursor: "pointer" }}
                  >
                    <Checkbox checked={downloadable ? "checked" : ""} />
                  </Box>
                  <Box>{$.lang.allow}</Box>
                </Flex>
                <Box as="hr" />
                <Box width={1} my={3}>
                  <Flex mt={2} alignItems="center" color="#111">
                    <Box
                      my={2}
                      as="span"
                      onClick={() => setRestricted(!restricted)}
                      sx={{ cursor: "pointer" }}
                    >
                      <Checkbox checked={restricted ? "checked" : ""} />
                    </Box>
                    <Box as="span" ml={2} mr={3}>
                      {$.lang.limit_access}
                    </Box>
                    {restricted ? (
                      <Box
                        onClick={() => {
                          fn.searchUserWithKey({
                            key: searchKey,
                          })
                        }}
                        p={2}
                        color="white"
                        bg="#5386E4"
                        sx={{
                          border: "1px solid #5386E4",
                          borderRadius: "3px",
                          cursor: "pointer",
                          ":hover": { opacity: 0.75 },
                        }}
                      >
                        {$.lang.get_all_users}
                      </Box>
                    ) : null}
                  </Flex>
                  {restricted ? (
                    <Flex flexWrap="wrap" width={1}>
                      {map(v => {
                        const user = $.blog_user_map[v]
                        return isNil(user) ? null : (
                          <Box
                            my={2}
                            mx={3}
                            sx={{
                              cursor: "pointer",
                              opacity: includes(v, members) ? 1 : 0.5,
                            }}
                            title={user.name}
                            width="50px"
                            fontSize="10px"
                            onClick={() => {
                              if (includes(v, members)) {
                                if (includes(v, authors)) {
                                  alert($.lang.cannot_remove_coauthor)
                                } else {
                                  setMembers(without(v, members))
                                }
                              } else {
                                setMembers(append(v, members))
                              }
                            }}
                          >
                            <Image
                              src={user.image64 || user.image}
                              size="50px"
                              sx={{
                                borderRadius: "5px",
                                border: includes(v)(members)
                                  ? "3px solid #5386E4"
                                  : "",
                              }}
                            />
                            <Box
                              width={1}
                              mt={2}
                              sx={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {user.name}
                            </Box>
                          </Box>
                        )
                      })(
                        compose(
                          filter(v => v !== $.user.uid),
                          keys
                        )($.blog_user_map)
                      )}
                    </Flex>
                  ) : null}
                </Box>
                <Box as="hr" />
                <Box width={1} my={3}>
                  <Flex my={2} alignItems="center" color="#111">
                    <Box as="span" ml={2} mr={3}>
                      {$.lang.coauthors4}
                    </Box>
                    <Box
                      onClick={() => {
                        fn.searchUserWithKey({
                          key: searchKey2,
                          state_name: "hit_users2",
                        })
                      }}
                      p={2}
                      color="white"
                      bg="#5386E4"
                      sx={{
                        border: "1px solid #5386E4",
                        borderRadius: "3px",
                        cursor: "pointer",
                        ":hover": { opacity: 0.75 },
                      }}
                    >
                      {$.lang.get_all_users}
                    </Box>
                  </Flex>
                  <Flex mt={2} flexWrap="wrap" width={1}>
                    {map(v => {
                      const user = $.blog_user_map[v]
                      return isNil(user) ? null : (
                        <Box
                          my={2}
                          mx={3}
                          sx={{
                            cursor: "pointer",
                            opacity: includes(v, authors) ? 1 : 0.5,
                          }}
                          title={user.name}
                          width="50px"
                          fontSize="10px"
                          onClick={() => {
                            if (includes(v, authors)) {
                              setAuthors(without(v, authors))
                            } else {
                              if (authors.length >= 5) {
                                alert($.lang.only_4authors)
                              } else {
                                setAuthors(append(v, authors))
                                setMembers(uniq(append(v, members)))
                              }
                            }
                          }}
                        >
                          <Image
                            src={user.image64 || user.image}
                            size="50px"
                            sx={{
                              borderRadius: "5px",
                              border: includes(v)(authors)
                                ? "3px solid #5386E4"
                                : "",
                            }}
                          />
                          <Box
                            width={1}
                            mt={2}
                            sx={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {user.name}
                          </Box>
                        </Box>
                      )
                    })(
                      compose(
                        filter(v => v !== $.user.uid),
                        keys
                      )($.blog_user_map)
                    )}
                  </Flex>
                </Box>
                {isNil(id) || $.blog_article.published === false ? null : (
                  <Fragment>
                    <Box as="hr" />
                    <Box width={1} mb={3}>
                      <Box
                        my={3}
                        fontSize="12px"
                        lineHeight="150%"
                        color="#5386E4"
                      >
                        {$.lang.article_url}
                      </Box>
                      <Flex>
                        <Box
                          display="block"
                          px={3}
                          py={2}
                          color={"white"}
                          bg="#5386E4"
                          sx={{
                            borderRadius: "3px 0 0 3px",
                            cursor: "pointer",
                            wordBreak: "break-all",
                          }}
                          fontSize="14px"
                          as="a"
                          href={`${domain}/article?id=${id}`}
                        >
                          <Box color="white" sx={{ textDecoration: "none" }}>
                            {domain}/article?id={id}
                          </Box>
                        </Box>
                        <Flex
                          justifyContent="center"
                          alignItems="center"
                          px={3}
                          color="#5386E4"
                          bg="#ccc"
                          sx={{
                            borderRadius: "0 3px 3px 0",
                            cursor: "pointer",
                            ":hover": { opacity: 0.75 },
                          }}
                          onClick={() => {
                            copy(`${domain}/article?id=${id}`)
                            fn.popNote({ text: $.lang.copied })
                          }}
                        >
                          <Box as="i" className="fas fa-copy" />
                        </Flex>
                      </Flex>
                      {$.data_storage === "localforage" ? (
                        <Box color="#FF5757" my={3} fontSize="12px" pb={3}>
                          {$.lang.offline_no_share}
                        </Box>
                      ) : null}
                    </Box>
                  </Fragment>
                )}
              </Box>
            )}
          </Box>
          {subtab === "gallery" ? (
            <Flex
              p={3}
              flexWrap="wrap"
              flexDirection="column"
              width={[1, null, 1 / 2]}
            >
              <Flex
                width={1}
                justifyContent="center"
                alignItems="center"
                pb={2}
              >
                <Input
                  id="image_upload"
                  flex={1}
                  accept="image/*"
                  type="file"
                  p={1}
                  onChange={async e => {
                    const file = e.target.files[0]
                    setUploadedArtwork(e.target.files[0])
                    const reader = new FileReader()
                    const [mime] = file.type.split("/")
                    if (mime === "image") {
                      reader.addEventListener("load", () => {
                        const url = reader.result
                        setUploadedArtworkURL(url)
                      })

                      reader.readAsDataURL(file)
                    }
                    const url = URL.createObjectURL(e.target.files[0])
                    if (!isNil(e.target) && !isNil(e.target.files[0])) {
                      setExt(e.target.files[0].type.split("/")[1])
                    }
                  }}
                />
                {isNil(uploadedArtworkURL) ? null : (
                  <Box
                    size="34px"
                    sx={{
                      background: `url(${uploadedArtworkURL})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></Box>
                )}

                <Flex
                  justifyContent="center"
                  alignItems="center"
                  py={2}
                  px={3}
                  bg="#5386E4"
                  color="white"
                  fontSize="12px"
                  height="34px"
                  onClick={async () => {
                    if (
                      $.uploading_image === false &&
                      !isNil(uploadedArtwork)
                    ) {
                      if (storage === "hideaki") {
                        await fn.uploadToHideaki({
                          ext,
                          image: uploadedArtwork,
                          base64: uploadedArtworkURL,
                          user: $.user,
                        })
                      }
                      setUploadedArtwork(null)
                      setUploadedArtworkURL(null)
                      document.getElementById("image_upload").value = null
                    }
                  }}
                  sx={{ cursor: "pointer", ":hover": { opacity: 0.75 } }}
                >
                  <Box
                    as="i"
                    className={
                      $.uploading_image
                        ? "fas fa-circle-notch fa-spin"
                        : "fas fa-upload"
                    }
                  />
                </Flex>
              </Flex>
              <Flex width={1} justifyContent="center">
                <Box display="inline-block" textAlign="left" width={1}>
                  {map(v => (
                    <Box
                      display="inline-block"
                      target="_blank"
                      href={v.url}
                      m={2}
                      onClick={() => {
                        copy(`${v.url.split(";")[0]};local,${v.id}`)
                        fn.popNote({ text: $.lang.copied })
                      }}
                      size="90px"
                      sx={{
                        cursor: "pointer",
                        borderRadius: "5px",
                        backgroundImage: `url(${v.url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        position: "relative",
                      }}
                    >
                      <Flex
                        size="90px"
                        sx={{
                          cursor: "pointer",
                          opacity: 0,
                          ":hover": {
                            opacity: 0.5,
                          },
                          position: "absolute",
                          top: 0,
                          left: 0,
                          borderRadius: "5px",
                        }}
                        bg="black"
                        color="white"
                        justifyContent="center"
                        alignItems="center"
                      >
                        {$.lang.copy_url}
                      </Flex>
                      {v.type === "alis" ? (
                        <Flex
                          sx={{
                            zIndex: 99,
                            position: "absolute",
                            bottom: "5px",
                            right: "5px",
                          }}
                          color="white"
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Image
                            src="/static/images/alis-white.png"
                            size="20px"
                          />
                        </Flex>
                      ) : null}
                    </Box>
                  ))($.gallery)}
                </Box>
              </Flex>
              {$.next_gallery ? (
                <Flex width={1} justifyContent="center" m={3}>
                  <Box
                    onClick={() => {
                      fn.getGallery({ next: true, user: $.user })
                    }}
                    justifyContent="center"
                    py={2}
                    px={5}
                    bg="#eee"
                    sx={{
                      borderRadius: "5px",
                      cursor: "pointer",
                      ":hover": { opacity: 0.75 },
                    }}
                  >
                    <Box as="i" className="fas fa-chevron-down" />
                  </Box>
                </Flex>
              ) : null}
            </Flex>
          ) : subtab === "history" ? (
            <Box
              p={3}
              height={height}
              sx={{ overflow: "auto" }}
              width={1 / 2}
              display={["none", null, "block"]}
            >
              {_history}
            </Box>
          ) : subtab === "toc" ? (
            <Box
              p={3}
              height={height}
              sx={{ overflow: "auto" }}
              display={["none", null, "block"]}
            >
              {_toc}
            </Box>
          ) : subtab === "advanced" ? (
            <Box
              width={[1, null, 1 / 2]}
              display={["none", null, "block"]}
              p="16px"
              height={isNil(height) ? null : height + "px"}
              sx={{ overflow: "auto" }}
            >
              <Flex
                width={1}
                justifyContent="center"
                alignItems="center"
                pb={2}
              >
                <Input
                  id="md_upload"
                  flex={1}
                  accept=".md"
                  type="file"
                  p={1}
                  onChange={async e => {
                    const file = e.target.files[0]
                    const reader = new FileReader()
                    const [mime] = file.type.split("/")
                    if (mime === "text") {
                      reader.addEventListener("load", () => {
                        const text = reader.result
                        const value = toValue(text)
                        setImportMD(value)
                      })
                      reader.readAsText(file)
                    }
                  }}
                />
                <Flex
                  justifyContent="center"
                  alignItems="center"
                  py={2}
                  px={3}
                  bg={isNil(importMD) ? "#999" : "#5386E4"}
                  color="white"
                  fontSize="12px"
                  height="34px"
                  onClick={async () => {
                    if (!isNil(importMD)) {
                      setValue(
                        await fn.parseImportMD({ importMD, user: $.user })
                      )
                    }
                  }}
                  sx={{ cursor: "pointer", ":hover": { opacity: 0.75 } }}
                >
                  {$.lang.importMD}
                </Flex>
              </Flex>
              {isNil(importMD) ? null : (
                <Box
                  width={1}
                  p="16px"
                  className="markdown-body"
                  sx={{ overflow: "auto" }}
                >
                  <Preview
                    $={$}
                    setValue={() => {}}
                    value={importMD}
                    setSavable={() => {}}
                  />
                </Box>
              )}
            </Box>
          ) : (
            <Box
              width={[1, null, 1 / 2]}
              display={["none", null, "block"]}
              p="16px"
              className="markdown-body"
              height={isNil(height) ? null : height + "px"}
              sx={{ overflow: "auto" }}
            >
              <Preview
                subtab={subtab}
                scripts={__toc.scripts}
                $={$}
                popNote={fn.popNote}
                setValue={setValue}
                value={value}
                height={height}
                setSavable={setSavable}
              />
            </Box>
          )}
        </Flex>
        {btns}
      </Flex>
    )
  },
  [
    "image_map",
    "my_epics",
    "epic_map",
    "blog_user_map",
    "hit_users",
    "hit_users2",
    "gallery",
    "next_gallery",
    "user",
    "isFB",
    "uploading_image",
    "blog_article",
    "data_storage",
    "lang",
    "topics",
    "blog_data",
    "posting_alis",
    "covers",
  ]
)
