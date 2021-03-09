export { initialize } from "lib/offline"
import { serialize } from "lib/editor"
import turndown from "turndown"
const identicon = require("identicon")
const { v4: uuid } = require("uuid")
import moment from "moment"
require("moment-timezone")
import { toPng, toJpeg, toBlob, toPixelData, toSvg } from "html-to-image"
import { sha256 } from "js-sha256"
import { saveAs } from "file-saver"
const jsondiffpatch = require("jsondiffpatch").create({
  textDiff: {
    minLength: 1,
  },
})
import cheerio from "cheerio"
const resizeImage = require("resize-image")
import langs from "../lib/langs"
import fbls from "firestore-offline"
import { checkURL, toMarked, useScript } from "lib/utils"
import sweet from "firestore-sweet"
import lf from "localforage"

import {
  reduce,
  take,
  invertObj,
  propOr,
  hasPath,
  assoc,
  last,
  sum,
  difference,
  sortBy,
  identity,
  mergeLeft,
  mergeRight,
  range,
  uniq,
  values,
  uniqBy,
  is,
  addIndex,
  concat,
  splitEvery,
  includes,
  pluck,
  map,
  pick,
  filter,
  compose,
  o,
  clone,
  findIndex,
  propEq,
  append,
  prepend,
  assocPath,
  isNil,
  prop,
  indexBy,
  pickBy,
  isEmpty,
  without,
} from "ramda"

import shortid from "shortid"

export const setLang = async ({
  val: { lang, user },
  set,
  get,
  global: { db },
}) => {
  await lf.setItem("lang", lang)
  if (!isNil(user)) {
    await db.update({ lang }, "users", user.uid)
    set(mergeLeft({ lang }, get("user")), "user")
  }
  set(langs[lang], "lang")
}

export const setUserLang = async ({ val: { user }, set, global: { db } }) => {
  set(!isNil(langs[user.lang]) ? langs[user.lang] : langs["en"], "lang")
}

async function get64(url) {
  return new Promise((res, rej) => {
    try {
      var img = new Image()
      img.onload = function () {
        var data = resizeImage.resize(img, 50, 50)
        res(data)
      }
      img.onerror = function () {
        res(null)
      }
      img.crossOrigin = "anonymous"
      img.src = url
    } catch (e) {
      res(null)
    }
  })
}

function _toBlob(base64) {
  try {
    var bin = atob(base64.replace(/^.*,/, ""))
    var buffer = new Uint8Array(bin.length)
    for (var i = 0; i < bin.length; i++) {
      buffer[i] = bin.charCodeAt(i)
    }
    // Blobを作成
    try {
      var blob = new Blob([buffer.buffer], {
        type: "image/png",
      })
    } catch (e) {
      return false
    }
    return blob
  } catch (e) {
    return null
  }
}
const toDataURL = url =>
  fetch(url)
    .then(response => response.blob())
    .then(
      blob =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
    )

const getCover = async ({ url }) =>
  new Promise((res, rej) => {
    try {
      if (!isNil(url)) {
        var img = new Image()
        img.onload = async () => {
          const data2 = /^data\:/.test(url) ? url : await toDataURL(url)
          const width = Math.min(600, img.width)
          const height = img.height * (width / img.width)
          const data = resizeImage.resize(img, width)
          res({ resized: data, original: data2 })
        }
        img.onerror = async () => {
          res(null)
        }
        img.crossOrigin = "anonymous"
        img.src = url
      } else {
        res(null)
      }
    } catch (e) {
      res(null)
    }
  })

const _resizeImage = async ({ url, size = 700 }) =>
  new Promise((res, rej) => {
    try {
      if (!isNil(url)) {
        var img = new Image()
        img.onload = async () => {
          const width = Math.min(size, img.width)
          const height = img.height * (width / img.width)
          const data = resizeImage.resize(img, width)
          res(data)
        }
        img.onerror = async () => {
          res(null)
        }
        img.crossOrigin = "anonymous"
        img.src = url
      } else {
        res(null)
      }
    } catch (e) {
      res(null)
    }
  })

const getCover2 = async ({ url }) =>
  new Promise(async (res, rej) => {
    try {
      if (!isNil(url)) res(await toDataURL(url))
    } catch (e) {
      res(null)
    }
  })

export const getCovers = async ({ val: { html }, set, get }) => {
  let covers = []
  const $ = cheerio.load(html)
  $("img").each(function () {
    covers.push({ src: $(this).attr("src") })
  })
  const image_map = get("image_map")
  let covers2 = []
  for (const v of covers) {
    try {
      const imageID = v.src.split(",")[1]
      if (!isNil(image_map[imageID])) {
        v.src = image_map[imageID].url
      }
      let cover64 = await getCover({ url: v.src })
      v.hash = sha256(cover64.original)
      covers2.push(v)
    } catch (e) {
      console.log(e)
    }
  }
  covers2 = uniqBy(prop("hash"), covers2)
  set(covers2, "covers")
}

const setCover = async ({
  get,
  val: { _id, cover, article, user },
  conf,
  global: { fb },
}) => {
  const node = document.getElementById("cover")
  const default_cover = await toPng(node, { pixelRatio: 1 })
  const default_cover_hash = sha256(default_cover)
  let _cover = !isNil(cover) ? cover.src : isNil(article) ? null : article.cover
  let cover64 = await getCover({ url: _cover })
  let cover_hash = isNil(cover64) ? null : sha256(cover64.original)
  let no_cover = findIndex(propEq("hash", cover_hash))(get("covers")) === -1
  if (isNil(cover64) || (!isNil(article) && article.no_cover && no_cover)) {
    cover64 = { resized: default_cover, original: default_cover }
    cover_hash = sha256(cover64.original)
  }
  let new_cover = null
  if ((isNil(article) || article.hash !== cover_hash) && !isNil(cover_hash)) {
    if (get("data_storage") === "localforage") {
      new_cover = cover64.resized
    }
  }
  return { no_cover, cover_hash, new_cover }
}

export const updateUserArticles = async ({ val: { user }, global: { db } }) => {
  // get top articles
  let args = [
    "articles",
    ["uid", "==", user.uid],
    ["published", "==", true],
    ["restricted", "==", false],
    ["unlisted", "==", false],
    ["published_at", "desc"],
  ]

  args.push(3)
  const articles = await db.get(...args)
  if (articles.length === 0) {
    await db.update({ last_article: db.del }, "users", user.uid)
  } else {
    await db.update(
      {
        last_article: articles[0].published_at,
        articles: map(pick(["topics", "title", "id", "published_at"]))(
          articles
        ),
      },
      "users",
      user.uid
    )
  }
}

export const postArticle = async ({
  val: {
    epic = null,
    authors = [],
    members,
    restricted,
    unlisted,
    topics = [],
    downloadable,
    user,
    title,
    body,
    cover,
    published = true,
    id,
    article,
    toRemote = false,
  },
  global: { db, _db, fb },
  set,
  get,
  fn,
  conf,
}) => {
  if (get("posting_article")) return
  await set(true, "posting_article")
  let __authors = o(uniq, append(user.uid))(authors)
  const __db = toRemote ? _db : db
  const date = Date.now()
  const _id = id || shortid.generate()
  let no_cover = true
  let cover_hash = null
  let new_cover = null
  try {
    const sc = await fn(setCover)({
      _id,
      cover,
      article,
      user,
    })
    no_cover = sc.no_cover
    cover_hash = sc.cover_hash
    new_cover = sc.new_cover
  } catch (e) {
    console.log(e)
  }
  console.log(cover)
  console.log(new_cover)
  const $ = cheerio.load(`<div id="main">${toMarked(body)}</div>`)
  const overview = $("#main").text().slice(0, 50)
  const user_map = get("blog_user_map")
  let _authors = {}
  for (let v of __authors) {
    const u = v === user.uid ? user : user_map[v]
    if (!isNil(u)) {
      _authors[v] = {
        uid: u.uid,
        name: u.name,
        image: u.image64 || u.image || null,
      }
    }
  }
  let _article = {
    epic,
    authors: __authors,
    members,
    restricted,
    unlisted,
    no_cover,
    topics,
    downloadable,
    id: _id,
    uid: user.uid,
    title: title,
    overview: overview,
    cover: new_cover,
    cover_hash: cover_hash,
    published: published,
    updated_at: date,
    authors_data: _authors,
    user: {
      uid: user.uid,
      name: user.name,
      image: user.image64 || user.image || null,
    },
  }
  if (isNil(id)) _article.created_at = date
  if (published === true && (isNil(id) || isNil(article.published_at))) {
    _article.published_at = date
  } else if (
    published === true &&
    !isNil(article) &&
    article.published &&
    !isNil(article.created_at)
  ) {
    _article.published_at = article.created_at
  }
  let article_content = mergeLeft({ body: body }, _article)
  if (!isNil(article)) article_content = mergeLeft(article_content, article)
  if (isNil(article_content.created_at) && !isNil(id)) {
    article_content.created_at = (await __db.get("articles", id)).created_at
  }
  try {
    await __db.upsert(_article, "articles", _id)
    if (toRemote === false && get("data_storage") === "localforage") {
      await __db.upsert(article_content, "storage_articles", _id)
    }
    if (toRemote) {
      _article.remote_id = _id
      await db.update({ remote_id: _id }, "articles", article.id)
      await db.update({ remote_id: _id }, "storage_articles", article.id)
      set(assoc("remote_id", _id, article), "blog_article")
    } else {
      if (!isNil(article) && !isNil(article.remote_id)) {
        _article.remote_id = article.remote_id
      }
      set(_article, "blog_article")
    }
    fn(popNote)({ text: "Posted!" })
    let history = null
    if (isNil(id)) {
      history = await fn(saveHistory)({ id: _id, title, body, msg: false })
      await lf.removeItem("blog")
    }
    await fn(updateUserArticles)({ user })
    await set(false, "posting_article")
    return { id: _id, history, err: false }
  } catch (e) {
    console.log(e)
    alert("Something went wrong...")
    await set(false, "posting_article")
    return { err: true }
  }
}

export const getArticles = async ({
  val: { uid, next = false },
  global,
  set,
  get,
}) => {
  const { db } = global
  const limit = 6
  let args = [
    "articles",
    ["authors", "array-contains", uid],
    ["published", "==", true],
    ["restricted", "==", false],
    ["unlisted", "==", false],
    ["published_at", "desc"],
  ]

  if (next && !isNil(global.next_articles))
    args.push(["startAfter", global.next_articles])
  args.push(limit)
  const data = await db.getS(...args)
  set(data.length === limit, "next_articles")
  const arts =
    next && !isNil(global.next_articles)
      ? concat(get("articles"), pluck("data", data))
      : pluck("data", data)
  set(arts, "articles")
  set(mergeLeft(indexBy(prop("id"), arts), get("article_map")), "article_map")
  global.next_articles = data.length === limit ? last(data).ss : null
}

export const getMyAllArticles = async ({
  val: { uid, next = false },
  global,
  set,
  get,
}) => {
  const { db } = global
  const limit = 6
  let args = ["articles", ["uid", "==", uid]]
  if (next && !isNil(global.next_articles))
    args.push(["startAfter", global.next_articles])
  args.push(limit)
  const data = await db.getS(...args)
  set(data.length === limit, "next_articles")
  const arts =
    next && !isNil(global.next_articles)
      ? concat(get("articles"), pluck("data", data))
      : pluck("data", data)
  set(arts, "articles")
  set(mergeLeft(indexBy(prop("id"), arts), get("article_map")), "article_map")
  global.next_articles = data.length === limit ? last(data).ss : null
}

export const getAllArticles = async ({
  val: { next = false, topic, user },
  global,
  set,
  get,
}) => {
  const { db } = global
  const limit = 6
  let args = ["articles", ["published", "==", true]]
  if (!isNil(topic)) {
    if (topic === "restricted") {
      args.push(["restricted", "==", true])
      args.push(["members", "array-contains", user.uid])
    } else {
      args.push(["restricted", "==", false])
      args.push(["unlisted", "==", false])
      args.push(["topics", "array-contains", topic])
    }
  } else {
    args.push(["restricted", "==", false])
    args.push(["unlisted", "==", false])
  }
  args.push(["published_at", "desc"])
  if (next && !isNil(global.next_all_articles))
    args.push(["startAfter", global.next_all_articles])
  args.push(limit)
  const data = await db.getS(...args)
  const arts =
    next && !isNil(global.next_all_articles)
      ? concat(get("all_articles"), pluck("data", data))
      : pluck("data", data)
  set(data.length === limit, "next_all_articles")
  set(mergeLeft(indexBy(prop("id"), arts), get("article_map")), "article_map")

  set(arts, "all_articles")
  global.next_all_articles = data.length === limit ? last(data).ss : null
}

export const getWriter = async ({ val: { uid }, global: { db }, set }) => {
  set(await db.get("users", uid), "writer")
}

export const getPrivateArticles = async ({
  val: { uid, next = false },
  global,
  set,
  get,
}) => {
  const { db } = global
  const limit = 6
  let args = [
    "articles",
    ["uid", "==", uid],
    ["published", "==", false],
    ["created_at", "desc"],
  ]

  if (next && !isNil(global.next_private_articles))
    args.push(["startAfter", global.next_private_articles])
  args.push(limit)
  const data = await db.getS(...args)
  set(data.length === limit, "next_private_articles")
  set(
    next && !isNil(global.next_private_articles)
      ? concat(get("private_articles"), pluck("data", data))
      : pluck("data", data),
    "private_articles"
  )
  global.next_private_articles = data.length === limit ? last(data).ss : null
}

export const getUnlistedArticles = async ({
  val: { uid, next = false },
  global,
  set,
  get,
}) => {
  const { db } = global
  const limit = 6
  let args = [
    "articles",
    ["uid", "==", uid],
    ["unlisted", "==", true],
    ["published_at", "desc"],
  ]

  if (next && !isNil(global.next_unlisted_articles))
    args.push(["startAfter", global.next_unlisted_articles])
  args.push(limit)
  const data = await db.getS(...args)
  set(data.length === limit, "next_unlisted_articles")
  set(
    next && !isNil(global.next_unlisted_articles)
      ? concat(get("unlisted_articles"), pluck("data", data))
      : pluck("data", data),
    "unlisted_articles"
  )
  global.next_unlisted_articles = data.length === limit ? last(data).ss : null
}

export const getRestrictedArticles = async ({
  val: { uid, next = false },
  global,
  set,
  get,
}) => {
  const { db } = global
  const limit = 6
  let args = [
    "articles",
    ["uid", "==", uid],
    ["published", "==", true],
    ["restricted", "==", true],
    ["published_at", "desc"],
  ]

  if (next && !isNil(global.next_restricted_articles))
    args.push(["startAfter", global.next_restricted_articles])
  args.push(limit)
  const data = await db.getS(...args)
  set(data.length === limit, "next_restricted_articles")
  set(
    next && !isNil(global.next_restricted_articles)
      ? concat(get("restricted_articles"), pluck("data", data))
      : pluck("data", data),
    "restricted_articles"
  )
  global.next_restricted_articles = data.length === limit ? last(data).ss : null
}

export const getLocalArticle = async ({
  val: { id, user, ignorePublished = false },
  global: { db },
  set,
  get,
  conf,
  fn,
}) => {
  const article = await db.get("storage_articles", id)
  let _article = null
  if (!isNil(article) && (ignorePublished || article.published === true)) {
    if (isNil(user) || user.uid === article.uid) {
      _article = article
    } else {
      return false
    }
  }
  if (ignorePublished) {
    await set(_article, "blog_data")
    set(_article, "blog_article")
  }
  fn(getComments)({ id })
  return _article
}

export const deleteArticle = async ({
  val: { id, user },
  global: { db, fb },
  set,
  get,
  fn,
}) => {
  if (get("posting_article")) return
  await set(true, "posting_article")
  await db.delete("articles", id)
  if (get("data_storage") === "localforage") {
    await db.delete("storage_articles", id)
  } else {
    const ref = fb.storage.ref().child(`articles/${id}.json`)
    await ref.delete()
  }
  await fn(updateUserArticles)({ user })
  await set(false, "posting_article")
  return true
}

const getLast = obj => {
  let init = { title: "", body: "" }
  for (const v of obj) {
    init = jsondiffpatch.patch(init, v.delta)
  }
  return init
}

export const getHistory = async ({ val: { id }, global, set }) => {
  const name = isNil(id) ? "blog" : `blog-${id}`
  const obj = (await lf.getItem(name)) || []
  return { diff: obj, current: getLast(obj) }
}

export const saveHistory = async ({
  val: { id, title, body, msg = true },
  global: { db },
  set,
  fn,
}) => {
  const name = isNil(id) ? "blog" : `blog-${id}`
  let obj =
    msg === false
      ? (await lf.getItem("blog")) || []
      : (await lf.getItem(name)) || []
  let last_val = getLast(obj)
  if (last_val.title !== title || last_val.body !== body || msg === false) {
    if (last_val.title !== title || last_val.body !== body) {
      const delta = jsondiffpatch.diff(last_val, {
        title,
        body,
      })
      obj.push({ date: Date.now(), delta })
    }
    await lf.setItem(name, obj)
    if (msg) {
      fn(popNote)({ text: "ローカル保存しました！" })
    }
  } else {
    if (msg) {
      fn(popNote)({ text: "保存は不要です" })
    }
  }
  return obj
}

let to_popNote = null
export const popNote = ({ val: { text, sec = 5 }, set }) => {
  try {
    to_popNote()
  } catch (e) {}
  set({ text }, `blog_note`)
  to_popNote = setTimeout(() => {
    set(null, "blog_note")
  }, sec * 1000)
}

export const loadHistory = ({
  val: { history, index },
  global: { db },
  set,
}) => {
  let obj = history.slice(0, index + 1)
  return getLast(obj)
}

export const clearHistory = async ({ val: { id }, global: { db }, set }) => {
  const name = isNil(id) ? "blog" : `blog-${id}`
  await lf.removeItem(name)
}

const toValue = text =>
  map(v => ({ type: "paragraph", children: [{ text: v }] }))(text.split("\n"))

export const downloadMD = async ({
  fn,
  get,
  set,
  global: { db, _db },
  val: { article },
}) => {
  let body = article.body
  const fileName = `${article.title}.md`
  const fileType = "text/markdown"
  if (get("data_storage") === "localforage") {
    const turndownService = new turndown({
      strongDelimiter: "**",
      emDelimiter: "*",
      headingStyle: "atx",
    })

    const image_map = get("image_map")
    let __html = toMarked(article.body || "")
    const $ = cheerio.load(`<div id="outerHTML">${__html}</div>`)
    $("img").each(function () {
      const src = $(this).attr("src")
      if (!isNil(src)) {
        const imageID = src.split(",")[1]
        if (!isNil(image_map[imageID])) {
          $(this).attr("src", image_map[imageID].url)
        }
      }
    })
    __html = $("#outerHTML").html()
    body = turndownService.turndown(__html)
  }
  const blob = new Blob([body], {
    type: fileType,
  })
  saveAs(blob, fileName)
}

export const getDLJson = async set => {
  const last_updated = (await lf.getItem("last_updated")) || 0
  let local_data_id = (await lf.getItem("local_data_id")) || null
  if (isNil(local_data_id)) {
    local_data_id = shortid.generate()
    await lf.setItem("local_data_id", local_data_id)
    await set(local_data_id, "local_data_id")
  }
  const local_backup = (await lf.getItem("backup")) || null
  const data = await lf.getItem("hideaki_data")
  return {
    data,
    last_updated,
    id: local_data_id,
    backup: local_backup,
  }
}

export const downloadJson = async ({
  fn,
  get,
  set,
  global: { db, _db },
  val: { data },
}) => {
  let json = isNil(data) ? await getDLJson(set) : data
  json.downloaded_at = Date.now()
  const fileType = "application/json"
  const fileName = `hide_${json.id}_${json.date}.json`
  const blob = new Blob([JSON.stringify(json)], {
    type: fileType,
  })
  saveAs(blob, fileName)
}

export const importJson = async ({
  fn,
  get,
  set,
  global: { db, _db },
  val: { json },
}) => {
  await lf.setItem("last_updated", json.last_updated || 0)
  await lf.setItem("local_data_id", json.id || null)
  await lf.setItem("backup", json.backup || null)
  await lf.setItem("hideaki_data", json.data)
  await set(json.id || null, "local_data_id")
  window.location.reload()
  return
}

export const addComment = async ({
  val: {
    user,
    article,
    comment,
    parent,
    id,
    origin,
    parent_content,
    reply_content,
  },
  global: { fb, _db, db },
  set,
  get,
}) => {
  const _id = id || shortid.generate()
  const date = Date.now()
  let _comment = {}
  let path = clone(isNil(parent_content) ? [] : parent_content.path || [])
  let members = clone(isNil(parent_content) ? [] : parent_content.members || [])
  members.push(article.uid)
  if (!isNil(parent)) {
    path.push(parent)
  }
  members.push(user.uid)
  members = uniq(members)
  if (!isNil(reply_content)) {
    members = uniq(concat(reply_content.members || [], members))
  }
  members = uniq(members)
  if (isNil(id)) {
    _comment = {
      reply_to: isNil(reply_content) ? null : reply_content.id,
      members,
      path,
      state: "active",
      uid: user.uid,
      id: _id,
      comment,
      article: article.id,
      parent: parent || null,
      edit: isNil(id) ? false : date,
      date,
    }
  } else {
    _comment = {
      comment,
      edit: isNil(id) ? false : date,
    }
  }
  if (isNil(parent)) {
    _comment.origin = _id
    if (isNil(id)) {
      _comment.thread_update = date
    }
  } else {
    _comment.origin = origin
  }
  let inc = 0
  let tinc = 0
  let tinc2 = 0
  let full = null
  await db.upsert(_comment, "comments", _id)
  if (isNil(id)) {
    if (!isNil(parent)) {
      if (parent !== origin) {
        inc = 1
        tinc2 = 1
        await db.update({ reply: db.inc(1) }, "comments", parent)
        await db.update({ total_reply: db.inc(1) }, "comments", origin)
      } else {
        inc = 1
        tinc = 1
        await db.update(
          { total_reply: db.inc(1), reply: db.inc(1) },
          "comments",
          parent
        )
      }
    }
    if (!isNil(origin)) {
      await db.update({ thread_update: date }, "comments", origin)
    }
    const new_comments = map(v => {
      let _v = clone(v)
      if (isNil(_v.reply)) {
        _v.reply = 0
      }
      if (isNil(_v.total_reply)) {
        _v.total_reply = 0
      }

      if (v.id === parent) {
        _v.reply += inc
        _v.total_reply += tinc
      }
      if (v.id === origin) {
        _v.total_reply += tinc2
      }
      return _v
    })(get("comments"))
    full = _comment
    set(prepend(_comment, new_comments), "comments")
  } else {
    let new_comments = map(v => {
      let _v = clone(v)
      if (v.id === parent) {
        _v.reply += inc
        _v.total_reply += tinc
      } else if (v.id === origin) {
        _v.total_reply += tinc2
      }
      if (v.id !== id) {
        return _v
      } else {
        return mergeLeft(_comment, _v)
      }
    })(get("comments"))
    set(new_comments, "comments")
  }
  if (isNil(id)) {
    const unread = without(user.uid, members)
    const nid = shortid.generate()
    const note = {
      reply_to: _comment.reply_to || null,
      id: nid,
      members,
      unread,
      type: "comment",
      comment_id: _id,
      date,
    }
    await db.set(note, "notifications", nid)
    set(prepend(note, get("notifications")), "notifications")
    set(prepend(note, get("nnread")), "unread")
  }
  const cmap = get("_comment_map") || {}
  set(mergeLeft(_comment, cmap[_id] || {}), ["_comment_map", _id])
  set(mergeLeft({ [user.uid]: user }, get("blog_user_map")), "blog_user_map")
}

export const deleteComment = async ({
  val: { comment },
  global: { fb, _db, db },
  set,
  get,
}) => {
  await db.update({ state: "deleted", comment: null }, "comments", comment.id)
  if (!isNil(comment.parent)) {
    await db.update({ reply: db.inc(-1) }, "comments", comment.parent)
  }
  if (!isNil(comment.origin)) {
    await db.update({ total_reply: db.inc(-1) }, "comments", comment.origin)
  }
  const notes = await db.get("notifications", ["comment_id", "==", comment.id])
  for (let v of notes) {
    await db.delete("notifications", v.id)
  }
  set(
    map(v => {
      if (v.id !== comment.id) {
        return v
      } else {
        return assoc("state", "deleted")(v)
      }
    })(get("comments")),
    "comments"
  )
  set(
    map(v => {
      if (v.id !== comment.id) {
        return v
      } else {
        return assoc("state", "deleted")(v)
      }
    })(get("_comment_map")),
    "_comment_map"
  )
}

export const getComments = async ({
  val: { id, next },
  global,
  set,
  fn,
  get,
}) => {
  const { db } = global
  const limit = 5
  let args = ["comments", ["article", "==", id], ["thread_update", "desc"]]

  if (next && !isNil(global.next_comments))
    args.push(["startAfter", global.next_comments])
  args.push(limit)
  const data = await db.getS(...args)
  set(data.length === limit, "next_comments")
  const _comments =
    next && !isNil(global.next_comments)
      ? concat(get("comments"), pluck("data", data))
      : pluck("data", data)
  set(_comments, "comments")
  set(
    mergeLeft(indexBy(prop("id"), _comments), get("_comment_map")),
    "_comment_map"
  )
  global.next_comments = data.length === limit ? last(data).ss : null
  fn(getUserMap)({
    uids: compose(uniq, pluck("uid"), pluck("data"))(data),
  })
}

export const getReply = async ({
  val: { comment },
  global: { fb, _db, db },
  set,
  get,
  fn,
}) => {
  const cm = await db.get("comments", ["parent", "==", comment.id])
  const _comments = uniqBy(prop("id"), concat(cm, get("comments")))
  set(
    mergeLeft(indexBy(prop("id"), _comments), get("_comment_map")),
    "_comment_map"
  )
  set(_comments, "comments")
  fn(getUserMap)({
    uids: compose(uniq, pluck("uid"))(cm),
  })
}

export const getUserMap = async ({
  get,
  val: { uids, state_name = "blog_user_map" },
  global: { db },
  set,
}) => {
  let umap = get(state_name)
  const _uids = filter(v => {
    return isNil(umap[v])
  })(uids || [])
  if (_uids.length !== 0) {
    const ls = splitEvery(10, _uids)
    for (const v of ls) {
      umap = mergeLeft(
        indexBy(prop("uid"), await db.get("users", ["uid", "in", v]), umap)
      )
      await set(umap, state_name)
    }
  }
}

export const getTopics = async ({ get, val: {}, global: { db }, set }) => {
  set(await db.get("topics"), "topics")
}

export const addTopic = async ({
  get,
  val: { topic, topic_key, image, ext, edit, color },
  global: { db, fb },
  set,
}) => {
  await db.tx("topics", topic_key, async ({ ref, t, data }) => {
    if (isNil(data) || (!isNil(edit) && edit === data.id)) {
      const id = edit || shortid.generate()
      await t[isNil(edit) ? "set" : "update"](ref, {
        name: topic,
        color,
        id,
        key: topic_key,
        ext,
      })
      if (!isNil(image)) {
        await fb.storage.ref().child(`topics/${id}.${ext}`).put(image)
      }
    } else {
      alert("key is taken")
    }
  })
  set(await db.get("topics"), "topics")
}

const getFileObjectFromDataURL = (dataURL, fileName, fileType) => {
  const blobBin = atob(dataURL.split(",")[1])
  const array = []
  for (let i = 0; i < blobBin.length; i++) {
    array.push(blobBin.charCodeAt(i))
  }
  const blob = new Blob([new Uint8Array(array)], { type: fileType })
  return new File([blob], fileName, { type: fileType })
}

export const getGallery = async ({
  val: { user, next },
  global,
  set,
  fn,
  get,
}) => {
  const { db } = global
  const limit = 4
  let args = ["images", ["uid", "==", user.uid]]

  if (next && !isNil(global.next_gallery))
    args.push(["startAfter", global.next_gallery])
  args.push(limit)
  const data = await db.getS(...args)
  set(data.length === limit, "next_gallery")
  set(
    next && !isNil(global.next_gallery)
      ? concat(get("gallery"), pluck("data", data))
      : pluck("data", data),
    "gallery"
  )
  global.next_gallery = data.length === limit ? last(data).ss : null
  fn(getUserMap)({
    uids: compose(uniq, pluck("uid"), pluck("data"))(data),
  })
}

export const removeFromAuthors = async ({
  val: { user, article },
  global: { db },
  set,
  get,
}) => {
  const authors = without(user.uid, article.authors)
  await db.update({ authors: db.remove(user.uid) }, "articles", article.id)
  return authors
}

export const getArticleConf = async ({
  val: { article },
  global: { db },
  set,
  get,
}) => {
  return await db.get("articles", article.id)
}

export const getBlogMap = async ({
  val: { ids },
  global: { db },
  set,
  get,
}) => {
  const ls = splitEvery(10, ids)
  let umap = get("blog_map") || {}
  for (const v of ls) {
    umap = mergeLeft(
      indexBy(prop("id"), await db.get("articles", ["id", "in", v]), umap)
    )
    await set(umap, "blog_map")
  }
}

export const getBlogEpic = async ({
  val: { epic },
  global: { db },
  set,
  get,
  fn,
}) => {
  const _epic = await db.get("lists", epic)
  if (!isNil(_epic)) {
    await set(mergeLeft({ [epic]: _epic }, get("epic_map")), "epic_map")
    const todos = await db.get(
      "todos",
      ["list", "==", epic],
      ["access", "==", "public"]
    )
    set(sortBy(prop("index"))(todos), "blog_todos")
    await set(indexBy(prop("id"))(todos), "blog_todo_map")
    let arts = []
    for (let v of todos || []) {
      for (let b of v.articles || []) {
        arts.push(b)
      }
    }
    await fn(getBlogMap)({ ids: arts })
  }
}

export const getPersonalBlogEpic = async ({
  val: { epic, user },
  global: { db },
  set,
  get,
  fn,
}) => {
  const epics = await db.get(
    "lists",
    ["uid", "==", user.uid],
    ["template", "==", epic]
  )
  if (!isNil(epics[0])) {
    set(epics[0], "personal_blog_epic")
    const todos = await db.get("todos", ["list", "==", epics[0].id])
    set(sortBy(prop("index"))(todos), "personal_blog_todos")
    await set(indexBy(prop("template"))(todos), "personal_blog_todo_map")
  }
}

export const getBloggers = async ({
  val: { next = false },
  global,
  set,
  get,
}) => {
  const { db } = global
  const limit = 6
  let args = ["users", ["last_article", "desc"]]
  if (next && !isNil(global.next_bloggers))
    args.push(["startAfter", global.next_bloggers])
  args.push(limit)
  const data = await db.getS(...args)
  set(data.length === limit, "next_bloggers")
  set(
    next && !isNil(global.next_bloggers)
      ? concat(get("bloggers"), pluck("data", data))
      : pluck("data", data),
    "bloggers"
  )
  global.next_bloggers = data.length === limit ? last(data).ss : null
}

export const getNotifications = async ({
  val: { next = false, user, unread = false },
  global,
  set,
  get,
  fn,
}) => {
  const key = unread ? "unread" : "notifications"
  const { db } = global
  const limit = 5
  let args = [
    "notifications",
    [unread ? "unread" : "members", "array-contains", user.uid],
    ["date", "desc"],
  ]
  if (next && !isNil(global[`next_${key}`]))
    args.push(["startAfter", global[`next_${key}`]])
  args.push(limit)
  const data = await db.getS(...args)
  if (unread && data.length === 0 && next === false) {
    await set(false, "isNotifications")
  }
  const comments = pluck("data", data)
  set(data.length === limit, `next_${key}`)
  set(
    next && !isNil(global[`next_${key}`])
      ? concat(get(key), comments)
      : comments,
    key
  )
  global[`next_${key}`] = data.length === limit ? last(data).ss : null
  await fn(getCommentMap)({ ids: o(pluck("comment_id"), pluck("data"))(data) })
  const _unread = o(
    map(v => {
      return ["update", { unread: db.remove(user.uid) }, "notifications", v.id]
    }),
    filter(v => {
      return includes(user.uid)(v.unread || [])
    })
  )(comments)
  await db.batch(_unread)
  return data.length !== 0
}

export const checkNotifications = async ({
  val: { next = false, user },
  global,
  set,
  get,
  fn,
}) => {
  const { db } = global
  let args = ["notifications", ["unread", "array-contains", user.uid], 1]
  const data = await db.get(...args)
  set(data.length !== 0, "isNotifications")
}

export const getCommentMap = async ({ val: { ids }, global, set, get, fn }) => {
  const { db } = global
  const ex = get("_comment_map")
  const _ids = o(
    filter(v => isNil(ex[v])),
    uniq
  )(ids)
  if (_ids.length !== 0) {
    const new_map = mergeRight(ex)(
      indexBy(prop("id"))(await db.get("comments", ["id", "in", _ids]))
    )
    set(new_map, "_comment_map")
    const aids = o(pluck("article"), values)(new_map)
    await fn(getArtMap)({ ids: aids })
    fn(getUserMap)({
      uids: compose(uniq, pluck("uid"), values)(new_map),
    })
  }
}

export const getArtMap = async ({ val: { ids }, global, set, get, fn }) => {
  const { db } = global
  const ex = get("_article_map")
  const _ids = o(
    filter(v => isNil(ex[v])),
    uniq
  )(ids)
  if (_ids.length !== 0) {
    const new_map = mergeRight(ex)(
      indexBy(prop("id"))(await db.get("articles", ["id", "in", _ids]))
    )
    set(new_map, "_article_map")
  }
}

export const getReplyTo = async ({
  val: { id },
  global: { db },
  set,
  get,
  fn,
}) => {
  const comment =
    !isNil(id) && isNil(get("_comment_map")[id])
      ? await db.get("comments", id)
      : get("_comment_map")[id]
  if (!isNil(comment)) {
    set(comment, ["_comment_map", comment.id])
  }
}

export const createMagazine = async ({
  get,
  set,
  val: {
    user,
    image,
    title,
    desc,
    access,
    id,
    magazine,
    ext,
    members,
    authors,
    unlisted,
  },
  conf,
  fn,
  global: { fb, db },
}) => {
  if (get("posting_article")) return
  await set(true, "posting_article")
  const _id = id || shortid.generate()
  let url = null
  let __authors = o(uniq, append(user.uid))(authors)
  const user_map = get("blog_user_map")
  let _authors = {}
  for (let v of __authors) {
    const u = v === user.uid ? user : user_map[v]
    if (!isNil(u)) {
      _authors[v] = {
        uid: u.uid,
        name: u.name,
        image: u.image64 || u.image || null,
      }
    }
  }

  let data = {
    unlisted: access !== "public" ? false : unlisted,
    members,
    authors_data: _authors,
    authors: __authors,
    uid: user.uid,
    title,
    desc,
    access,
    id: _id,
    user: {
      uid: user.uid,
      name: user.name,
      image: user.image64 || user.image || null,
    },
  }
  if (!isNil(image)) {
    try {
      const _64 = await _resizeImage({ url: image })
      if (get("data_storage") === "localforage") {
        url = _64
      }
    } catch (e) {
      console.log(e)
    }
  }
  if (!isNil(url)) {
    data.image = url
  }
  if (isNil(id)) {
    data.created_at = Date.now()
    data.updated_at = 0
    data.articles = []
  }
  if (!isNil(magazine)) {
    data = mergeLeft(data, magazine)
  }
  await db.upsert(data, "magazines", _id)
  await set(false, "posting_article")
  return data
}

export const saveMagazineArticles = async ({
  get,
  set,
  val: { user, magazine, articles },
  conf,
  fn,
  global: { fb, db },
}) => {
  if (get("posting_article")) return
  await set(true, "posting_article")
  let data = {
    articles,
  }
  const amap = get("article_map")
  const _articles = compose(
    sortBy(v => v.published_at * -1),
    map(v => {
      const art = amap[v]
      return pick(["topics", "title", "id", "published_at", "created_at"])(art)
    }),
    filter(v => !isNil(amap[v]))
  )(articles)
  data.recent_articles = take(3, _articles)
  if (data.recent_articles.length === 0) {
    delete data.updated_at
  } else {
    data.updated_at =
      data.recent_articles[0].published_at ||
      data.recent_articles[0].created_at ||
      0
  }
  let topics = {}
  for (let v of compose(reduce(concat, []), pluck("topics"))(_articles)) {
    if (isNil(topics[v])) {
      topics[v] = { key: v, count: 0 }
    }
    topics[v].count += 1
  }
  let _topics = compose(
    take(3),
    pluck("key"),
    sortBy(v => v.count * -1),
    values
  )(topics)
  data.topics = _topics
  data = mergeLeft(data, magazine)
  let data2 = clone(data)
  if (data.recent_articles.length === 0) {
    data2.updated_at = db.del
  }
  await db.upsert(data2, "magazines", magazine.id)
  await set(false, "posting_article")
  return data
}

export const getMagazine = async ({
  val: { id },
  global: { db },
  set,
  get,
}) => {
  return await db.get("magazines", id)
}

export const deleteMagazine = async ({
  val: { magazine },
  global: { db },
  set,
  get,
}) => {
  await set(true, "posting_article")
  await db.delete("magazines", magazine.id)
  set(null, "magazine")
  await set(false, "posting_article")
}

export const getMagazineArticles = async ({
  val: { magazine, next = false },
  global,
  set,
  get,
}) => {
  const { db } = global
  const limit = 10
  const ls = splitEvery(limit, magazine.articles || [])
  const index =
    next && !isNil(global.next_magazine_articles)
      ? global.next_magazine_articles
      : 0
  if (!isNil(ls[index]) && ls[index].length !== 0) {
    let args = ["articles", ["id", "in", ls[index]]]
    const data = await db.getS(...args)
    set(ls.length > index + 1, "next_magazine_articles")
    const arts = pluck("data", data)
    await set(
      mergeLeft(indexBy(prop("id"), arts), get("article_map")),
      "article_map"
    )
    global.next_magazine_articles = ls.length > index + 1 ? index + 1 : null
  }
}

export const getAllMagazineArticles = async ({
  val: { magazine },
  global,
  set,
  get,
}) => {
  const ls = splitEvery(10, magazine.articles || [])
  for (let ids of ls) {
    if (ids.length !== 0) {
      const arts = await global.db.get("articles", ["id", "in", ids])
      await set(
        mergeLeft(indexBy(prop("id"), arts), get("article_map")),
        "article_map"
      )
    }
  }
  await set(false, "next_magazine_articles")
  global.next_magazine_articles = null
}

export const getAllMagazines = async ({
  val: { next = false, topic, user },
  global,
  set,
  get,
}) => {
  const { db } = global
  const limit = 6
  let args = ["magazines"]
  if (!isNil(topic)) {
    if (topic === "restricted") {
      args.push(["access", "==", "restricted"])
      args.push(["members", "array-contains", user.uid])
    } else {
      args.push(["access", "==", "public"])
      args.push(["unlisted", "==", false])
      args.push(["topics", "array-contains", topic])
    }
  } else {
    args.push(["access", "==", "public"])
    args.push(["unlisted", "==", false])
  }
  args.push(["updated_at", "desc"])
  if (next && !isNil(global.next_all_articles))
    args.push(["startAfter", global.next_all_articles])
  args.push(limit)
  const data = await db.getS(...args)
  const arts =
    next && !isNil(global.next_all_articles)
      ? concat(get("all_magazines"), pluck("data", data))
      : pluck("data", data)
  set(data.length === limit, "next_all_magazines")
  set(arts, "all_magazines")
  global.next_all_articles = data.length === limit ? last(data).ss : null
}

export const getMyMagazines = async ({
  val: { uid, next = false },
  global,
  set,
  get,
}) => {
  const { db } = global
  const limit = 6
  let args = [
    "magazines",
    ["authors", "array-contains", uid],
    ["access", "==", "public"],
    ["unlisted", "==", false],
    ["updated_at", "desc"],
  ]

  if (next && !isNil(global.next_magazines))
    args.push(["startAfter", global.next_magazines])
  args.push(limit)
  const data = await db.getS(...args)
  set(data.length === limit, "next_magazines")
  const arts =
    next && !isNil(global.next_magazines)
      ? concat(get("magazines"), pluck("data", data))
      : pluck("data", data)
  set(arts, "magazines")
  set(mergeLeft(indexBy(prop("id"), arts), get("article_map")), "article_map")
  global.next_magazines = data.length === limit ? last(data).ss : null
}

export const getPrivateMagazines = async ({
  val: { uid, next = false },
  global,
  set,
  get,
}) => {
  const { db } = global
  const limit = 6
  let args = [
    "magazines",
    ["authors", "array-contains", uid],
    ["access", "==", "private"],
    ["updated_at", "desc"],
  ]

  if (next && !isNil(global.next_private_magazines))
    args.push(["startAfter", global.next_private_magazines])
  args.push(limit)
  const data = await db.getS(...args)
  set(data.length === limit, "next_private_magazines")
  set(
    next && !isNil(global.next_private_magazines)
      ? concat(get("private_magazines"), pluck("data", data))
      : pluck("data", data),
    "private_magazines"
  )
  global.next_private_magazines = data.length === limit ? last(data).ss : null
}

export const getUnlistedMagazines = async ({
  val: { uid, next = false },
  global,
  set,
  get,
}) => {
  const { db } = global
  const limit = 6
  let args = [
    "magazines",
    ["authors", "array-contains", uid],
    ["unlisted", "==", true],
    ["updated_at", "desc"],
  ]

  if (next && !isNil(global.next_unlisted_magazines))
    args.push(["startAfter", global.next_unlisted_magazines])
  args.push(limit)
  const data = await db.getS(...args)
  set(data.length === limit, "next_unlisted_magazines")
  set(
    next && !isNil(global.next_unlisted_magazines)
      ? concat(get("unlisted_magazines"), pluck("data", data))
      : pluck("data", data),
    "unlisted_magazines"
  )
  global.next_unlisted_magazines = data.length === limit ? last(data).ss : null
}

export const getRestrictedMagazines = async ({
  val: { uid, next = false },
  global,
  set,
  get,
}) => {
  const { db } = global
  const limit = 6
  let args = [
    "magazines",
    ["authors", "array-contains", uid],
    ["access", "==", "restricted"],
    ["updated_at", "desc"],
  ]

  if (next && !isNil(global.next_restricted_magazines))
    args.push(["startAfter", global.next_restricted_magazines])
  args.push(limit)
  const data = await db.getS(...args)
  set(data.length === limit, "next_restricted_magazines")
  set(
    next && !isNil(global.next_restricted_magazines)
      ? concat(get("restricted_magazines"), pluck("data", data))
      : pluck("data", data),
    "restricted_magazines"
  )
  global.next_restricted_magazines =
    data.length === limit ? last(data).ss : null
}

export const updateUserInfo = async ({
  get,
  set,
  val: { user, image, title, desc, id, writer, ext, profile_image, ext_icon },
  conf,
  fn,
  global: { fb, db },
}) => {
  if (get("posting_article")) return
  await set(true, "posting_article")
  let url = null
  let icon_url = null
  let icon_64 = null
  let data = {
    name: title,
    about: desc,
  }
  if (!isNil(image)) {
    try {
      const _64 = await _resizeImage({ url: image })
      if (get("data_storage") === "localforage") {
        data.cover = _64
      }
    } catch (e) {
      console.log(e)
    }
  }
  if (!isNil(profile_image)) {
    try {
      const _64 = await _resizeImage({ url: profile_image })
      icon_64 = await get64(profile_image)
      if (get("data_storage") === "localforage") {
        data.image64 = icon_64
        data.image = null
      }
    } catch (e) {
      console.log(e)
    }
  }

  if (!isNil(url)) data.cover = url

  if (!isNil(icon_url)) {
    data.image = icon_url
    data.image64 = icon_64
  }
  await db.update(data, "users", writer.uid)
  await set(false, "posting_article")
  await set(mergeLeft(data)(get("user")), "user")
  return mergeLeft(data, writer)
}

export const getUsers = async ({ val: {}, global: { db }, set, fn, get }) => {
  await set(await db.get("users"), "users")
}

export const createUser = async ({
  val: { name },
  global: { db },
  set,
  fn,
  get,
}) => {
  const uid = uuid()
  const img = identicon.generateSync({ id: uid, size: 50 })
  const new_user = { links: {}, uid: uid, name: name, image64: img }
  await db.set(new_user, "users", uid)
  await set(append(new_user)(get("users")), "users")
  if (isNil(get("user"))) await fn(switchUser)({ user: new_user })
  return new_user
}

export const switchUser = async ({
  val: { user },
  global: { db },
  set,
  fn,
  get,
}) => {
  const local_user = (await db.get("users", ["uid", "==", user.uid]))[0] || null
  await lf.setItem("user", local_user)
  await set(local_user, "user")
}
let img_listener = null
export const getImages = async ({
  val: { user },
  global: { db },
  set,
  fn,
  get,
}) => {
  if (get("data_storage") === "localforage") {
    try {
      img_listener()
    } catch (e) {}
    img_listener = await db.on("images", async imgs => {
      await set(
        compose(
          map(v => {
            try {
              v.blob_url = URL.createObjectURL(_toBlob(v.url))
              return v
            } catch (e) {
              return null
            }
          }),
          indexBy(prop("id"))
        )(imgs),
        "image_map"
      )
    })
  }
}

export const setPnum$nav = ({ set, val: { op, _bp } }) => {
  let wd = window.innerWidth
  if (_bp != 1 && (op || _bp === 3)) {
    wd -= 250
  } else if (_bp == 2 && !op) {
    wd -= 50
  }
  let pnum = Math.floor((wd - (_bp === 1 ? 100 : _bp === 2 ? 200 : 300)) / 50)
  set(pnum, "pnum$nav")
}

export const searchUserWithKey = async ({
  val: { key, state_name = "hit_users" },
  conf,
  global: { db },
  get,
  set,
  fn,
}) => {
  let hits = []
  hits = await db.get("users")
  await fn(getUserMap)({ uids: pluck("uid", hits) })
  await set(hits, state_name)
  await set(concat(get(state_name), hits), state_name)
}

export const uploadToHideaki = async ({
  val: { user, image, article_id, base64, ext },
  global: { db, _db, fb },
  set,
  get,
  fn,
  conf,
}) => {
  set(true, "uploading_image")
  const _id = shortid.generate()
  const file = image
  const _64 = await _resizeImage({ url: base64 })
  let url = null
  if (get("data_storage") === "localforage") {
    url = _64
  }
  const new_image = {
    id: _id,
    uid: user.uid,
    url,
    ext,
    size: file.size,
    type: "hideaki",
    date: Date.now(),
  }
  await db.set(new_image, "images", _id)
  set(prepend(new_image, get("gallery")), "gallery")
  set(false, "uploading_image")
  if (get("data_storage") === "localforage") await fn(getImages)({ user })

  return new_image
}

export const parseImportMD = async ({
  set,
  fn,
  global: { db },
  val: { importMD, user },
  get,
}) => {
  set(true, "uploading_image")
  let sanitized = toMarked(serialize(importMD))
  let batches = []
  if (get("data_storage") === "localforage") {
    const $ = cheerio.load(`<div id="outerHTML">${sanitized}</div>`)
    $("img").each(function () {
      const src = $(this).attr("src")
      if (!isNil(src) && /^data\:/.test(src)) {
        const _id = shortid.generate()
        const ext = src.split(";")[0].split("/")[1]
        const new_image = {
          id: _id,
          uid: user.uid,
          url: src,
          ext,
          size: src.length,
          type: "hideaki",
          date: Date.now(),
        }
        batches.push({ id: _id, ext, new_image, src })
        $(this).attr("src", `data:image/${ext};local,${_id}`)
      }
    })
    sanitized = $("#outerHTML").html()
    for (let v of batches) {
      const _64 = await _resizeImage({ url: v.src })
      await db.set(v.new_image, "images", v.id)
      await set(prepend(v.new_image, get("gallery")), "gallery")
    }
  }
  if (get("data_storage") === "localforage") await fn(getImages)({ user })
  set(false, "uploading_image")
  const turndownService = new turndown({
    strongDelimiter: "**",
    emDelimiter: "*",
    headingStyle: "atx",
  })
  return toValue(turndownService.turndown(sanitized))
}
