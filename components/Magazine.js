import { Fragment, useEffect, useState } from "react"
import { Input, Select, Textarea, Checkbox } from "@rebass/forms"
import { Droppable, Draggable, DragDropContext } from "react-beautiful-dnd"
import { _checkHeight } from "lib/utils"
import ModHead from "components/ModHead"
import Link from "next/link"
import useEventListener from "@use-it/event-listener"
import { bind } from "nd"
import Loading from "components/Loading"
import moment from "moment"
import {
  concat,
  assoc,
  filter,
  addIndex,
  compose,
  indexBy,
  prop,
  isNil,
  map,
  includes,
  uniq,
  without,
  append,
  clone,
  keys,
} from "ramda"
import { Flex, Box, Image } from "rebass"
import NavCustomized from "components/NavCustomized"
import Articles from "components/Articles"

export default bind(
  ({ $, set, init, conf, router, _magazine }) => {
    const fn = init([
      "getUserMap",
      "searchUserWithKey",
      "saveMagazineArticles",
      "getMyAllArticles",
      "getTopics",
      "createMagazine",
      "deleteMagazine",
      "getMagazine",
      "getAllMagazineArticles",
      "getMagazineArticles",
    ])
    const [height, setHeight] = useState(null)
    const [initMagazine, setInitMagazine] = useState(null)
    const checkHeight = () => {
      _checkHeight({
        setHeight,
        ids: ["nav"],
        _default: 170,
      })
    }
    useEventListener("resize", () => checkHeight())
    useEffect(() => {
      checkHeight()
    })
    const [magazine, setMagazine] = useState(_magazine || null)
    const [edit, setEdit] = useState(null)
    const [title, setTitle] = useState("")
    const [access, setAccess] = useState(false)
    const [desc, setDesc] = useState("")
    const [image, setImage] = useState(null)
    const [noMagazine, setNoMagazine] = useState(false)
    const [unlisted, setUnlisted] = useState(false)
    const [tab, setTab] = useState("add")
    const [magazine_articles, setMagazineArticles] = useState([])
    const [uploadedArtwork, setUploadedArtwork] = useState(null)
    const [uploadedArtworkURL, setUploadedArtworkURL] = useState(null)
    const [ext, setExt] = useState(null)
    const [searchKey, setSearchKey] = useState("")
    const [searchKey2, setSearchKey2] = useState("")
    const [members, setMembers] = useState([])
    const [authors, setAuthors] = useState([])
    const topics = compose(indexBy(prop("key")))($.topics)
    const articles = $.articles
    let magazine_authors = []
    let author_map = {}
    if (!isNil(magazine)) {
      magazine_authors = magazine.authors
      author_map = magazine.authors_data || {}
    }
    const onDragEnd = (v, v2) => {
      if (isNil(v.destination)) return
      const src = v.source.index
      const dest = v.destination.index
      if (src === dest) return
      let arts = clone(magazine_articles)
      let art = clone(magazine_articles[src])
      arts.splice(src, 1)
      arts.splice(dest, 0, art)
      setMagazineArticles(arts)
    }
    const grid = 8
    const getItemStyle = (isDragging, draggableStyle) => {
      const { transform } = draggableStyle
      let activeTransform = {}
      if (transform) {
        activeTransform = {
          transform: `translate(0, ${transform.substring(
            transform.indexOf(",") + 1,
            transform.indexOf(")")
          )})`,
        }
      }
      return {
        ...draggableStyle,
        ...activeTransform,
      }
    }
    useEffect(() => {
      if (edit === "settings") {
        fn.getUserMap({ uids: concat(authors, members) })
      }
    }, [edit])
    useEffect(() => {
      ;(async () => {
        if ($.isFB) {
          if (isNil(router.query.id)) {
            setEdit("settings")
          } else {
            const mg = await fn.getMagazine({ id: router.query.id })
            setMagazine(mg)
            if (!isNil(mg)) {
              await fn.getMagazineArticles({ magazine: mg })
              setInitMagazine(true)
            }
          }
        }
      })()
    }, [router, $.isFB])
    useEffect(() => {
      if (
        !isNil(magazine) &&
        $.user_init &&
        magazine.access !== "public" &&
        (isNil($.user) ||
          (magazine.uid !== $.user.uid &&
            !includes($.user.uid, magazine.members)))
      ) {
        setNoMagazine(true)
      }
    }, [magazine, $.user_init])
    useEffect(() => {
      if ($.isFB) {
        fn.getTopics()
      }
    }, [$.isFB])
    useEffect(() => {
      if (!isNil(magazine) && !isNil(magazine.title)) {
        setAccess(magazine.access)
        setImage(magazine.image)
        setTitle(magazine.title)
        setDesc(magazine.desc)
        setUnlisted(magazine.unlisted || false)
        setMagazineArticles(magazine.articles || [])
        setAuthors(
          !isNil(magazine.authors)
            ? magazine.authors
            : isNil($.user)
            ? []
            : [$.user.uid]
        )
        setMembers(!isNil(magazine.members) ? magazine.members : [])
      } else {
        setAccess("private")
        setImage(null)
        setUnlisted(false)
        setTitle("")
        setDesc("")
        setUploadedArtwork(null)
        setUploadedArtworkURL(null)
        setAuthors(isNil($.user) ? [] : [$.user.uid])
        setMembers(isNil($.user) ? [] : [$.user.uid])
        setUploadedArtworkURL(null)
        setExt(null)
        setMagazineArticles([])
      }
    }, [magazine, $.user])
    useEffect(() => {
      if (edit === "articles" && !isNil($.user)) {
        fn.getMyAllArticles({ uid: $.user.uid })
        fn.getAllMagazineArticles({ magazine })
      }
    }, [$.isFB, edit, $.user])
    const img =
      edit === "settings" && !isNil(uploadedArtworkURL)
        ? uploadedArtworkURL
        : image
    const tabs = (
      <Box
        width={1}
        pb={2}
        justifyContent="center"
        display={["flex", null, null, "none"]}
      >
        {map(v => {
          return (
            <Box
              onClick={() => setTab(v.key)}
              mx={2}
              sx={{
                cursor: "pointer",
                ":hover": { opacity: 0.75 },
                borderRadius: "3px",
              }}
              px={4}
              py={2}
              bg={tab === v.key ? "#5386E4" : "#999"}
              color={tab === v.key ? "white" : "#111"}
            >
              {v.name}
            </Box>
          )
        })([
          { key: "reorder", name: $.lang.reorder },
          { key: "add", name: $.lang.manage_articles },
        ])}
      </Box>
    )
    return (
      <Fragment>
        {isNil(magazine) || isNil(magazine.title) ? null : (
          <ModHead
            title={magazine.title}
            description={magazine.desc}
            image={magazine.image}
          />
        )}
        <NavCustomized>
          {noMagazine ? (
            <Flex
              width={1}
              height="100%"
              justifyContent="center"
              alignItems="center"
            >
              {$.lang.no_magazine}
            </Flex>
          ) : isNil(magazine) && isNil($.user) ? (
            <Flex
              sx={{ position: "absolute", zIndex: 1000 }}
              width={1}
              height="100%"
              bg="rgba(0, 0, 0, 0.75)"
            >
              <Loading
                text={$.lang.loading_article}
                color="white"
                textColor="white"
              />
            </Flex>
          ) : (
            <Fragment>
              {edit === "articles" ? null : (
                <Fragment>
                  <Flex
                    justifyContent="center"
                    height={["200px", "250px", "300px", "400px"]}
                    width={1}
                    sx={{
                      position: "relative",
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                      backgroundImage: `url(${img})`,
                    }}
                  >
                    <Box
                      height="100%"
                      width={1}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        backgroundColor: "rgba(0,0,0,.7)",
                        zIndex: 1,
                      }}
                    />
                    <Box
                      height="100%"
                      sx={{
                        zIndex: 3,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                        backgroundImage: `url(${img})`,
                      }}
                    >
                      <Image
                        height="100%"
                        src={img}
                        sx={{ zIndex: 2, visibility: "hidden" }}
                      />
                    </Box>
                  </Flex>
                  <Flex width={1} justifyContent="center" py={3} px={4}>
                    <Box maxWidth="750px" width={edit === "settings" ? 1 : ""}>
                      {edit === "settings" || isNil(magazine) ? (
                        <Box width={1}>
                          <Flex my={3} alignItems="center">
                            <Box mr={3} width="100px" textAlign="right">
                              {$.lang.cover_image}
                            </Box>
                            <Input
                              flex={1}
                              bg="white"
                              id="image_upload"
                              flex={1}
                              accept="image/*"
                              type="file"
                              p={1}
                              onChange={async e => {
                                const file = e.target.files[0]
                                if (!isNil(file)) {
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
                                  const url = URL.createObjectURL(
                                    e.target.files[0]
                                  )
                                  if (
                                    !isNil(e.target) &&
                                    !isNil(e.target.files[0])
                                  ) {
                                    setExt(e.target.files[0].type.split("/")[1])
                                  }
                                }
                              }}
                            />
                          </Flex>
                          <Flex my={3} alignItems="center">
                            <Box mr={3} width="100px" textAlign="right">
                              {$.lang.title}
                            </Box>
                            <Input
                              flex={1}
                              bg="white"
                              placeholder={$.lang.title100}
                              value={title}
                              onChange={e =>
                                setTitle(e.target.value.slice(0, 100))
                              }
                            />
                          </Flex>
                          <Flex my={3} alignItems="center">
                            <Box mr={3} width="100px" textAlign="right">
                              {$.lang.access}
                            </Box>
                            <Flex
                              alignItems="center"
                              sx={{ cursor: "pointer" }}
                            >
                              <Flex
                                mr={4}
                                alignItems="center"
                                onClick={() => setAccess("public")}
                              >
                                <Checkbox
                                  mr={2}
                                  checked={access === "public" ? "checked" : ""}
                                />
                                {$.lang.publish}
                              </Flex>
                              <Flex
                                mr={4}
                                alignItems="center"
                                onClick={() => setAccess("restricted")}
                              >
                                <Checkbox
                                  mr={2}
                                  checked={
                                    access === "restricted" ? "checked" : ""
                                  }
                                />
                                {$.lang.restricted_articles}
                              </Flex>
                              <Flex
                                alignItems="center"
                                onClick={() => setAccess("private")}
                              >
                                <Checkbox
                                  mr={2}
                                  checked={
                                    access === "private" ? "checked" : ""
                                  }
                                />
                                {$.lang.private_magazines}
                              </Flex>
                            </Flex>
                          </Flex>
                          {access === "restricted" ? (
                            <Fragment>
                              <Flex my={3} alignItems="center">
                                <Box mr={3} width="100px" textAlign="right">
                                  {$.lang.who_can_view}
                                </Box>
                                {$.data_storage === "localforage" ? (
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
                                ) : (
                                  <Flex alignItems="center">
                                    <Input
                                      value={searchKey2}
                                      placeholder={$.lang.username}
                                      width="150px"
                                      onChange={e =>
                                        setSearchKey2(e.target.value)
                                      }
                                      sx={{
                                        borderRadius: "3px 0 0 3px",
                                      }}
                                    />
                                    <Box
                                      onClick={() => {
                                        fn.searchUserWithKey({
                                          key: searchKey2,
                                        })
                                      }}
                                      p={2}
                                      color="white"
                                      bg="#5386E4"
                                      sx={{
                                        border: "1px solid #5386E4",
                                        borderRadius: "0 3px 3px 0",
                                        cursor: "pointer",
                                        ":hover": { opacity: 0.75 },
                                      }}
                                    >
                                      {$.lang.search}
                                    </Box>
                                  </Flex>
                                )}
                              </Flex>
                              <Flex alignItems="center">
                                <Box
                                  mr={3}
                                  width="100px"
                                  textAlign="right"
                                ></Box>
                                <Flex flexWrap="wrap" width={1}>
                                  {map(v => {
                                    const user = $.blog_user_map[v]
                                    return isNil(user) ? null : (
                                      <Box
                                        my={2}
                                        mx={3}
                                        sx={{
                                          cursor: "pointer",
                                          opacity: includes(v, members)
                                            ? 1
                                            : 0.5,
                                        }}
                                        title={user.name}
                                        width="50px"
                                        fontSize="10px"
                                        onClick={() => {
                                          if (includes(v, members)) {
                                            if (includes(v, authors)) {
                                              alert(
                                                $.lang.cannot_remove_coauthor
                                              )
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
                              </Flex>
                            </Fragment>
                          ) : null}
                          {access === "public" ? (
                            <Flex my={3} alignItems="center">
                              <Box mr={3} width="100px" textAlign="right">
                                {$.lang.unlisted_articles}
                              </Box>
                              <Flex
                                alignItems="center"
                                sx={{ cursor: "pointer" }}
                                onClick={() => setUnlisted(!unlisted)}
                              >
                                <Checkbox
                                  mr={2}
                                  checked={unlisted ? "checked" : ""}
                                />
                                {$.lang.unlisted_in_list}
                              </Flex>
                            </Flex>
                          ) : null}
                          <Flex my={3} alignItems="center">
                            <Box mr={3} width="100px" textAlign="right">
                              {$.lang.coauthoring}
                            </Box>
                            {$.data_storage === "localforage" ? (
                              <Box
                                onClick={() => {
                                  fn.searchUserWithKey({
                                    key: searchKey,
                                    state_name: "hit_users",
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
                            ) : (
                              <Flex alignItems="center">
                                <Input
                                  value={searchKey}
                                  placeholder={$.lang.username}
                                  width="150px"
                                  onChange={e => setSearchKey(e.target.value)}
                                  sx={{
                                    borderRadius: "3px 0 0 3px",
                                  }}
                                />
                                <Box
                                  onClick={() => {
                                    fn.searchUserWithKey({ key: searchKey })
                                  }}
                                  p={2}
                                  color="white"
                                  bg="#5386E4"
                                  sx={{
                                    border: "1px solid #5386E4",
                                    borderRadius: "0 3px 3px 0",
                                    cursor: "pointer",
                                    ":hover": { opacity: 0.75 },
                                  }}
                                >
                                  {$.lang.search}
                                </Box>
                              </Flex>
                            )}
                          </Flex>
                          <Flex alignItems="center">
                            <Box mr={3} width="100px" textAlign="right"></Box>
                            <Flex flexWrap="wrap" width={1}>
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
                          </Flex>
                          <Flex my={3} alignItems="center">
                            <Box mr={3} width="100px" textAlign="right">
                              {$.lang.about}
                            </Box>
                            <Textarea
                              flex={1}
                              bg="white"
                              placeholder={$.lang.intro300}
                              value={desc}
                              height="120px"
                              onChange={e =>
                                setDesc(e.target.value.slice(0, 300))
                              }
                            />
                          </Flex>
                        </Box>
                      ) : (
                        <Fragment>
                          <Flex alignItems="center" my={3}>
                            <Box
                              fontWeight="bold"
                              fontSize="30px"
                              flex={1}
                              color="#5386E4"
                            >
                              {title}
                            </Box>
                            {magazine.access === "private" ? (
                              <Box
                                bg="#5386E4"
                                color="white"
                                fontWeight="normal"
                                fontSize="12px"
                                width="60px"
                                textAlign="center"
                                ml={3}
                                px={2}
                                py={1}
                                sx={{ borderRadius: "3px" }}
                              >
                                {$.lang.private_magazines}
                              </Box>
                            ) : magazine.access === "restricted" ? (
                              <Box
                                bg="#5386E4"
                                color="white"
                                fontWeight="normal"
                                fontSize="12px"
                                width="80px"
                                textAlign="center"
                                ml={3}
                                px={2}
                                py={1}
                                sx={{ borderRadius: "3px" }}
                              >
                                {$.lang.restricted_articles}
                              </Box>
                            ) : null}
                          </Flex>
                          <Box lineHeight="150%" mb={3}>
                            {desc}
                          </Box>
                          <Flex
                            alignItems="center"
                            width={1}
                            pb={2}
                            px={3}
                            height="60px"
                            alignSelf="flex-end"
                          >
                            {map(a => {
                              const author = author_map[a]
                              return isNil(author) ? null : (
                                <Image
                                  mr={1}
                                  width="40px"
                                  src={author.image}
                                  title={author.name}
                                  height="40px"
                                  sx={{ borderRadius: "50%" }}
                                />
                              )
                            })(authors)}
                            <Flex
                              lineHeight="150%"
                              flex={1}
                              fontSize="12px"
                              flexWrap="wrap"
                              ml={2}
                              color="#333"
                            >
                              <Box width={1}>
                                {addIndex(map)((a, i) => {
                                  const author = author_map[a]
                                  return isNil(author) ? null : (
                                    <Link
                                      href={
                                        $.data_storage === "localforage"
                                          ? `/user?id=${author.uid}`
                                          : `/users/${author.uid}`
                                      }
                                    >
                                      <Box
                                        as="span"
                                        sx={{
                                          cursor: "pointer",
                                          ":hover": { opacity: 0.75 },
                                        }}
                                      >
                                        {(i !== 0 ? ", " : "") + author.name}
                                      </Box>
                                    </Link>
                                  )
                                })(authors)}
                              </Box>
                              <Box width={1}>
                                {moment(magazine.created_at).fromNow()}
                              </Box>
                            </Flex>
                          </Flex>
                        </Fragment>
                      )}
                    </Box>
                  </Flex>
                </Fragment>
              )}
              {edit === "articles" ? (
                <Flex width={1}>
                  <Box
                    flex={1}
                    pb={4}
                    px={3}
                    pt={3}
                    height={height + "px"}
                    sx={{ direction: "rtl", overflow: "auto" }}
                    display={[
                      tab === "reorder" ? "block" : "none",
                      null,
                      null,
                      "block",
                    ]}
                  >
                    <Box width={1} sx={{ direction: "ltr" }}>
                      {tabs}
                      <Box
                        display={["none", null, null, "flex"]}
                        justifyContent="center"
                        p={2}
                      >
                        {$.lang.reorder}
                      </Box>
                      <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId={magazine.id} type="PERSON">
                          {(provided, snapshot) => (
                            <Box
                              ref={provided.innerRef}
                              style={{
                                backgroundColor: snapshot.isDraggingOver
                                  ? "gray"
                                  : "white",
                              }}
                              {...provided.droppableProps}
                            >
                              {compose(
                                addIndex(map)((id, i) => {
                                  const v = $.article_map[id]
                                  return (
                                    <Draggable
                                      draggableId={v.id}
                                      key={v.id}
                                      index={i}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          style={getItemStyle(
                                            snapshot.isDragging,
                                            provided.draggableProps.style
                                          )}
                                        >
                                          <Flex
                                            alignItems="center"
                                            px={3}
                                            bg={i % 2 === 0 ? "#ddd" : "#eee"}
                                            m={2}
                                            sx={{ borderRadius: "3px" }}
                                          >
                                            <Box
                                              onClick={() => {
                                                if (v.uid !== $.user.uid) {
                                                  alert(
                                                    $.lang.cannot_remove_others
                                                  )
                                                } else if (
                                                  includes(
                                                    v.id,
                                                    magazine_articles
                                                  )
                                                ) {
                                                  setMagazineArticles(
                                                    without(
                                                      v.id,
                                                      magazine_articles
                                                    )
                                                  )
                                                } else {
                                                  setMagazineArticles(
                                                    append(
                                                      v.id,
                                                      magazine_articles
                                                    )
                                                  )
                                                }
                                              }}
                                              sx={{ cursor: "pointer" }}
                                            >
                                              <Checkbox
                                                mr={3}
                                                checked={
                                                  includes(
                                                    v.id,
                                                    magazine_articles
                                                  )
                                                    ? "checked"
                                                    : ""
                                                }
                                              />
                                            </Box>
                                            <Box py={3} flex={1}>
                                              {v.title}
                                            </Box>
                                            <Box
                                              fontSize="12px"
                                              bg={
                                                v.public === false
                                                  ? "#BF731C"
                                                  : v.restricted
                                                  ? "#5386E4"
                                                  : "#008080"
                                              }
                                              color="white"
                                              py={1}
                                              px={2}
                                              sx={{ borderRadius: "3px" }}
                                            >
                                              {v.public === false
                                                ? $.lang.private_magazines
                                                : v.restricted
                                                ? $.lang.restricted_articles
                                                : $.lang.published}
                                            </Box>

                                            <Box width="35px" ml={3}>
                                              <Image
                                                sx={{ borderRadius: "50%" }}
                                                title={v.user.name}
                                                src={v.user.image}
                                                size="35px"
                                              />
                                            </Box>
                                          </Flex>
                                        </div>
                                      )}
                                    </Draggable>
                                  )
                                }),
                                filter(v => !isNil($.article_map[v]))
                              )(magazine_articles || [])}
                              {provided.placeholder}
                            </Box>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </Box>
                  </Box>
                  <Box
                    display={["none", null, null, "block"]}
                    width="50px"
                    textAlign="center"
                    height={height + "px"}
                    sx={{ overflow: "auto" }}
                  >
                    <Box
                      display="inline-block"
                      sx={{ position: "sticky", top: "12px" }}
                      textAlign="center"
                    >
                      <Flex
                        size="40px"
                        bg="#eee"
                        sx={{ borderRadius: "50%" }}
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Box as="i" className="fas fa-chevron-left" />
                      </Flex>
                    </Box>
                  </Box>
                  <Box
                    display={[
                      tab === "add" ? "block" : "none",
                      null,
                      null,
                      "block",
                    ]}
                    flex={1}
                    pb={4}
                    px={3}
                    pt={3}
                    height={height + "px"}
                    sx={{ overflow: "auto" }}
                  >
                    {tabs}
                    <Box
                      display={["none", null, null, "flex"]}
                      justifyContent="center"
                      p={2}
                    >
                      {$.lang.manage_article}
                    </Box>
                    <Box>
                      {addIndex(map)((v, i) => {
                        return (
                          <Flex
                            alignItems="center"
                            px={3}
                            bg={i % 2 === 0 ? "#ddd" : "#eee"}
                            m={2}
                            sx={{ borderRadius: "3px" }}
                          >
                            <Box
                              sx={{ cursor: "pointer" }}
                              as="span"
                              onClick={() => {
                                if (includes(v.id, magazine_articles)) {
                                  setMagazineArticles(
                                    without(v.id, magazine_articles)
                                  )
                                } else {
                                  setMagazineArticles(
                                    append(v.id, magazine_articles)
                                  )
                                }
                              }}
                            >
                              <Checkbox
                                mr={3}
                                checked={
                                  includes(v.id, magazine_articles)
                                    ? "checked"
                                    : ""
                                }
                              />
                            </Box>

                            <Box flex={1} lineHeight="150%" py={2}>
                              {v.title}
                            </Box>
                            <Box
                              fontSize="12px"
                              bg={
                                v.public === false
                                  ? "#BF731C"
                                  : v.restricted
                                  ? "#5386E4"
                                  : "#008080"
                              }
                              color="white"
                              py={1}
                              px={2}
                              sx={{ borderRadius: "3px" }}
                            >
                              {v.public === false
                                ? $.lang.private_magazines
                                : v.restricted
                                ? $.lang.restricted_articles
                                : $.lang.published}
                            </Box>
                            <Box width="35px" ml={3}>
                              <Image
                                sx={{ borderRadius: "50%" }}
                                title={v.user.name}
                                src={v.user.image}
                                size="35px"
                              />
                            </Box>
                          </Flex>
                        )
                      })(articles || [])}
                    </Box>
                    {$.next_articles !== true ? null : (
                      <Flex
                        mt={3}
                        width={1}
                        justifyContent="center"
                        mb={3}
                        px={3}
                        color="#111"
                      >
                        <Flex
                          title="Load More..."
                          bg="#ccc"
                          color="#555"
                          py={1}
                          px={2}
                          alignItems="center"
                          justifyContent="center"
                          sx={{
                            minWidth: "250px",
                            textDecoration: "none",
                            cursor: "pointer",
                            ":hover": { opacity: 0.75 },
                            borderRadius: "5px",
                          }}
                          onClick={() => {
                            fn.getMyAllArticles({
                              uid: $.user.uid,
                              next: true,
                            })
                          }}
                        >
                          <Box
                            as="i"
                            fontSize="30px"
                            className="fas fa-angle-down"
                          />
                        </Flex>
                      </Flex>
                    )}
                  </Box>
                </Flex>
              ) : null}
            </Fragment>
          )}
          {noMagazine ? null : !isNil(edit) ? (
            <Flex sx={{ position: "fixed", right: 3, bottom: 3, zIndex: 1000 }}>
              <Flex
                fontSize="10px"
                size="75px"
                bg="#008080"
                color="white"
                mx={2}
                sx={{
                  cursor: "pointer",
                  ":hover": { opacity: 0.75 },
                  borderRadius: "50%",
                  boxShadow:
                    "rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px",
                }}
                justifyContent="center"
                alignItems="center"
                flexDirection="column"
                onClick={async () => {
                  if (edit === "articles") {
                    await fn.saveMagazineArticles({
                      magazine,
                      articles: magazine_articles,
                      user: $.usre,
                    })
                    setMagazine(assoc("articles", magazine_articles, magazine))
                    setEdit(null)
                  } else {
                    if (/^\s*$/.test(title)) {
                      alert($.lang.enter_title)
                      return
                    } else {
                      const new_magazine = await fn.createMagazine({
                        members,
                        authors,
                        unlisted,
                        id: isNil(magazine) ? null : magazine.id,
                        user: $.user,
                        title,
                        image: uploadedArtworkURL,
                        desc,
                        access,
                        ext,
                        magazine,
                      })
                      setMagazine(new_magazine)
                      setEdit(null)
                      router.replace(
                        $.data_storage === "localforage"
                          ? `/magazine?id=${new_magazine.id}`
                          : `/magazines/${new_magazine.id}`,
                        undefined,
                        {
                          shallow: true,
                        }
                      )
                    }
                  }
                }}
              >
                <Box fontSize="20px">
                  <Box as="i" className="fas fa-save" mb={1} />
                </Box>
                <Box mt={1}>{$.lang.save}</Box>
              </Flex>
              {isNil(magazine) ? null : (
                <Flex
                  fontSize="10px"
                  size="75px"
                  bg="#BF731C"
                  color="white"
                  mx={2}
                  sx={{
                    cursor: "pointer",
                    ":hover": { opacity: 0.75 },
                    borderRadius: "50%",
                    boxShadow:
                      "rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px",
                  }}
                  justifyContent="center"
                  alignItems="center"
                  flexDirection="column"
                  onClick={() => setEdit(null)}
                >
                  <Box fontSize="20px">
                    <Box as="i" className="fas fa-ban" mb={1} />
                  </Box>
                  <Box mt={1}>{$.lang.cancel}</Box>
                </Flex>
              )}
            </Flex>
          ) : !isNil(magazine) && !isNil($.user) ? (
            <Fragment>
              {!(
                includes(magazine.members)($.user.uid) ||
                $.user.uid === magazine.uid
              ) ? null : (
                <Flex
                  sx={{ position: "fixed", right: 3, bottom: 3, zIndex: 1000 }}
                >
                  <Flex
                    fontSize="10px"
                    size="75px"
                    bg="#5386E4"
                    color="white"
                    mx={2}
                    sx={{
                      cursor: "pointer",
                      ":hover": { opacity: 0.75 },
                      borderRadius: "50%",
                      boxShadow:
                        "rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px",
                    }}
                    justifyContent="center"
                    alignItems="center"
                    flexDirection="column"
                    onClick={() => setEdit("articles")}
                  >
                    <Box fontSize="20px">
                      <Box as="i" className="fas fa-list" mb={1} />
                    </Box>
                    <Box mt={1}>{$.lang.manage_articles}</Box>
                  </Flex>
                  {isNil(magazine) || magazine.uid === $.user.uid ? (
                    <Fragment>
                      <Flex
                        fontSize="10px"
                        size="75px"
                        bg="#5386E4"
                        color="white"
                        mx={2}
                        sx={{
                          cursor: "pointer",
                          ":hover": { opacity: 0.75 },
                          borderRadius: "50%",
                          boxShadow:
                            "rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px",
                        }}
                        justifyContent="center"
                        alignItems="center"
                        flexDirection="column"
                        onClick={() => setEdit("settings")}
                      >
                        <Box fontSize="20px">
                          <Box as="i" className="fas fa-cogs" mb={1} />
                        </Box>
                        <Box mt={1}>{$.lang.change_settings}</Box>
                      </Flex>
                      {isNil(magazine) ? null : (
                        <Flex
                          fontSize="10px"
                          size="75px"
                          bg="#F44E3B"
                          color="white"
                          mx={2}
                          sx={{
                            cursor: "pointer",
                            ":hover": { opacity: 0.75 },
                            borderRadius: "50%",
                            boxShadow:
                              "rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px",
                          }}
                          justifyContent="center"
                          alignItems="center"
                          flexDirection="column"
                          onClick={async () => {
                            if (confirm($.lang.delete_magazine)) {
                              await fn.deleteMagazine({
                                magazine: magazine,
                              })
                              setEdit(null)
                              setMagazine(null)
                              router.replace(`/magazines/edit`, undefined, {
                                shallow: true,
                              })
                            }
                          }}
                        >
                          <Box fontSize="20px">
                            <Box as="i" className="fas fa-trash" mb={1} />
                          </Box>
                          <Box mt={1}>{$.lang.delete}</Box>
                        </Flex>
                      )}
                    </Fragment>
                  ) : null}
                </Flex>
              )}
            </Fragment>
          ) : $.posting_article ? (
            <Flex
              sx={{ position: "absolute", zIndex: 1000 }}
              width={1}
              height="100%"
              bg="rgba(0, 0, 0, 0.75)"
            >
              <Loading text={$.lang.saving} color="white" textColor="white" />
            </Flex>
          ) : null}
          {noMagazine ? null : isNil(edit) && !isNil(magazine) ? (
            <Box pb={isNil($.user) ? null : "80px"} bg="#eee">
              <Articles
                nextFunc={() => {
                  fn.getMagazineArticles({ magazine, next: true })
                }}
                topics={topics}
                isPrivate={false}
                noSort={true}
                articles={compose(
                  map(v => $.article_map[v]),
                  filter(v => !isNil($.article_map[v]))
                )(magazine_articles || [])}
                next={$.next_magazine_articles}
              />
            </Box>
          ) : null}
          {$.posting_article ? (
            <Flex
              sx={{ position: "absolute", zIndex: 1000 }}
              width={1}
              height="100%"
              bg="rgba(0, 0, 0, 0.75)"
            >
              <Loading text={$.lang.saving} color="white" textColor="white" />
            </Flex>
          ) : null}
        </NavCustomized>
      </Fragment>
    )
  },
  [
    "user",
    "lang",
    "isFB",
    "next_articles",
    "articles",
    "topics",
    "posting_article",
    "article_map",
    "next_magazine_articles",
    "user_init",
    "hit_users",
    "hit_users2",
    "blog_user_map",
    "data_storage",
  ]
)
