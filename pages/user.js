var linkify = require("linkifyjs")
import ModHead from "components/ModHead"
require("linkifyjs/plugins/hashtag")(linkify)
var linkifyHtml = require("linkifyjs/html")
import escapeHtml from "escape-html"
import { Fragment, useEffect, useState } from "react"
import Loading from "components/Loading"
import { bind } from "nd"
import { addIndex, isNil, map, compose, mergeLeft, indexBy, prop } from "ramda"
import { Flex, Box, Image } from "rebass"
import NavCustomized from "components/NavCustomized"
import Articles from "components/Articles"
import Magazines from "components/Magazines"
import { Input, Textarea } from "@rebass/forms"

export default bind(
  ({ $, set, init, conf, router, _user }) => {
    const fn = init([
      "updateUserInfo",
      "getArticles",
      "getMyMagazines",
      "getPrivateArticles",
      "getUnlistedArticles",
      "getRestrictedArticles",
      "getWriter",
      "getTopics",
    ])
    const [subtab, setSubTab] = useState("articles")

    const [tab, setTab] = useState("public")
    const [init_article, setInitArticle] = useState(false)
    const [init_magazine, setInitMagazine] = useState(false)
    const [writer, setWriter] = useState(_user || $.writer || null)
    useEffect(() => {
      console.log(router)
    }, [router])
    useEffect(() => {
      ;(async () => {
        if ($.isFB && !isNil(router.query.id)) {
          fn.getTopics()
          fn.getWriter({ uid: router.query.id })
        }
      })()
    }, [router, $.isFB])
    useEffect(() => {
      if (!isNil(writer) && $.isFB) {
        if (subtab === "articles") {
          if (!init_article) {
            setInitArticle(true)
            fn.getArticles({ uid: router.query.id })
          }
        } else {
          if (!init_magazine) {
            setInitMagazine(true)
            fn.getMyMagazines({ uid: router.query.id })
          }
        }
      }
    }, [$.isFB, writer, subtab])
    const topics = compose(
      mergeLeft({
        undefined: {
          key: null,
          name: $.lang.all,
          bar: $.lang.unsorted,
          color: "#222",
          src: "/static/images/icon-128x128.png",
        },
      }),
      indexBy(prop("key"))
    )($.topics)
    const [user, setUser] = useState($.user || null)
    const side_selected = tab
    const articles = $.articles
    const [title, setTitle] = useState("")
    const [edit, setEdit] = useState(null)
    const [image, setImage] = useState(null)
    const [icon, setIcon] = useState(null)
    const [profile_image, setProfileImage] = useState(null)
    const [desc, setDesc] = useState("")
    const [uploadedArtwork, setUploadedArtwork] = useState(null)
    const [uploadedArtworkURL, setUploadedArtworkURL] = useState(null)
    const [uploadedIcon, setUploadedIcon] = useState(null)
    const [uploadedIconURL, setUploadedIconURL] = useState(null)
    const [ext, setExt] = useState(null)
    const [date, setDate] = useState(Date.now())
    const [ext_icon, setExtIcon] = useState(null)
    useEffect(() => {
      if (!isNil(writer)) {
        setImage(writer.cover)
        setIcon(writer.image)
        setTitle(writer.name)
        setDesc(writer.about || "")
        setWriter(writer)
        setDate(Date.now())
      } else {
        setImage(null)
        setIcon(null)
        setTitle("")
        setDesc("")
        setUploadedArtwork(null)
        setUploadedArtworkURL(null)
        setUploadedIcon(null)
        setUploadedIconURL(null)
        setExt(null)
        setExtIcon(null)
        setWriter(null)
      }
    }, [writer])
    useEffect(() => {
      setWriter($.writer)
    }, [$.writer])

    const img =
      edit === "settings" && !isNil(uploadedArtworkURL)
        ? uploadedArtworkURL
        : image

    let links = []
    if (!isNil(writer)) {
      for (let k in writer.links || {}) {
        const v = writer.links[k]
        links.push(
          <Box
            as="a"
            target="_blank"
            href={
              k === "twitter"
                ? `https://twitter.com/${v.username}`
                : k === "alis"
                ? `https://alis.to/users/${v.username}`
                : k === "github"
                ? "https://github.com/${v.username}"
                : null
            }
          >
            <Box mr={2} fontSize="25px">
              {k === "github" ? (
                <Box
                  color="#3C2B00"
                  title={v.username}
                  as="i"
                  className="fab fa-github"
                  sx={{ cursor: "pointer", ":hover": { opacity: 0.75 } }}
                />
              ) : k === "twitter" ? (
                <Box
                  color="#1DA1F2"
                  title={v.username}
                  as="i"
                  className="fab fa-twitter"
                  sx={{ cursor: "pointer", ":hover": { opacity: 0.75 } }}
                />
              ) : k === "alis" ? (
                <Image
                  mt={1}
                  size="27px"
                  src="/static/images/alis.png"
                  sx={{ cursor: "pointer", ":hover": { opacity: 0.75 } }}
                />
              ) : null}
            </Box>
          </Box>
        )
      }
    }
    const __writer = writer || _user
    return (
      <Fragment>
        {isNil(__writer) || isNil(__writer.name) ? null : (
          <ModHead
            title={__writer.name}
            description={__writer.about || ""}
            image={__writer.cover || null}
          />
        )}
        <NavCustomized
          chosen={tab}
          side_selected={
            !isNil($.user) && router.query.id === $.user.uid
              ? "your_page"
              : null
          }
        >
          {(isNil(articles) && subtab === "articles") ||
          (isNil($.magazines) && subtab === "magazines") ||
          isNil(writer) ||
          isNil(writer.links) ? (
            <Box flex={1} width={1} flexWrap="wrap" bg="#eee" pb={2}>
              <Loading text={$.lang.loading_article} />
            </Box>
          ) : (
            <Fragment>
              {isNil(img) && isNil(edit) ? null : (
                <Flex
                  justifyContent="center"
                  height={["200px", "250px", "300px", "400px"]}
                  width={1}
                  sx={{
                    position: "relative",
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                    backgroundImage: `url(${
                      img +
                      (isNil(img) || /^data/.test(img) ? "" : "&date=" + date)
                    })`,
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
              )}
              <Flex width={1} justifyContent="center" py={3} px={4}>
                <Box maxWidth="750px" width={edit === "settings" ? 1 : ""}>
                  {edit === "settings" || isNil(writer) ? (
                    <Box width={1}>
                      <Flex alignItems="center">
                        <Flex justifyContent="flex-end" width="100px" mr={3}>
                          <Image
                            mt={3}
                            src={uploadedIconURL || icon || writer.image64}
                            size="80px"
                            sx={{ borderRadius: "50%" }}
                          />
                        </Flex>
                        <Flex my={3} flexDirection="column">
                          <Box mb={3}>{$.lang.icon}</Box>
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
                                setUploadedIcon(e.target.files[0])
                                const reader = new FileReader()
                                const [mime] = file.type.split("/")
                                if (mime === "image") {
                                  reader.addEventListener("load", () => {
                                    const url = reader.result
                                    setUploadedIconURL(url)
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
                                  setExtIcon(
                                    e.target.files[0].type.split("/")[1]
                                  )
                                }
                              }
                            }}
                          />
                        </Flex>
                      </Flex>
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
                              const url = URL.createObjectURL(e.target.files[0])
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
                          {$.lang.name}
                        </Box>
                        <Input
                          flex={1}
                          bg="white"
                          placeholder={$.lang.title100}
                          value={title}
                          onChange={e => setTitle(e.target.value.slice(0, 100))}
                        />
                      </Flex>
                      <Flex my={3} alignItems="center">
                        <Box mr={3} width="100px" textAlign="right">
                          {$.lang.intro}
                        </Box>
                        <Textarea
                          flex={1}
                          bg="white"
                          placeholder={$.lang.intro300}
                          value={desc}
                          height="120px"
                          onChange={e => setDesc(e.target.value.slice(0, 300))}
                        />
                      </Flex>
                    </Box>
                  ) : (
                    <Fragment>
                      <Flex
                        width={1}
                        flexDirection={["column", null, "row"]}
                        alignItems={["center", null, "flex-start"]}
                      >
                        <Box>
                          <Image
                            my={3}
                            mr={[0, null, 4]}
                            src={
                              (writer.image || writer.image64) +
                              (isNil(writer.image) ||
                              !/firebasestorage/.test(writer.image)
                                ? ""
                                : "&date=" + date)
                            }
                            size="100px"
                            sx={{
                              borderRadius: "50%",
                            }}
                          />
                        </Box>
                        <Box flex={1}>
                          <Flex alignItems="center" my={2}>
                            <Box
                              fontWeight="bold"
                              fontSize="30px"
                              flex={1}
                              color="#5386E4"
                            >
                              {writer.name}
                            </Box>
                          </Flex>
                          <Box lineHeight="150%" mb={2}>
                            <Box
                              py={2}
                              dangerouslySetInnerHTML={{
                                __html: linkifyHtml(
                                  escapeHtml(writer.about || ""),
                                  {
                                    target: "_blank",
                                  }
                                ).replace(/\n/g, "<br />"),
                              }}
                            />
                          </Box>
                          <Flex mb={2} alignItems="center">
                            {links}
                          </Flex>
                        </Box>
                      </Flex>
                    </Fragment>
                  )}
                </Box>
              </Flex>
              <Box flex={1} width={1} flexWrap="wrap" bg="#eee">
                {isNil(writer) ? null : (
                  <Flex
                    width={1}
                    justifyContent="center"
                    mt={4}
                    px={3}
                    color="#111"
                  >
                    <Flex
                      sx={{
                        boxShadow:
                          "rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px",
                      }}
                    >
                      {addIndex(map)((v, i) => (
                        <Box
                          onClick={() => setSubTab(v.key)}
                          display="flex"
                          href={
                            !isNil(writer.links.twitter)
                              ? `https://twitter.com/${writer.links.twitter.username}`
                              : !isNil(writer.links.alis)
                              ? `https://alis.to/users/${writer.links.alis.username}`
                              : null
                          }
                          bg={subtab === v.key ? "#5386E4" : "#999"}
                          fontWeight={subtab === v.key ? "bold" : "normal"}
                          color={"white"}
                          py={2}
                          px={4}
                          alignItems="center"
                          sx={{
                            textDecoration: "none",
                            cursor: "pointer",
                            ":hover": { opacity: 0.75 },
                            borderRadius:
                              i === 0 ? "3px 0 0 3px" : "0 3px 3px 0",
                          }}
                        >
                          {v.name}
                        </Box>
                      ))([
                        { key: "articles", name: $.lang.articles },
                        { key: "magazines", name: $.lang._magazines },
                      ])}
                    </Flex>
                  </Flex>
                )}

                {subtab === "articles" ? (
                  <Articles
                    nextFunc={() => {
                      if (tab === "public") {
                        fn.getArticles({ next: true, uid: router.query.id })
                      } else if (tab === "private") {
                        fn.getPrivateArticles({
                          next: true,
                          uid: router.query.id,
                        })
                      } else if (tab === "unlisted") {
                        fn.getUnlistedArticles({
                          next: true,
                          uid: router.query.id,
                        })
                      } else {
                        fn.getRestrictedArticles({
                          next: true,
                          uid: router.query.id,
                        })
                      }
                    }}
                    topics={topics}
                    isPrivate={tab === "private"}
                    articles={articles}
                    next={
                      $[
                        `next_${
                          tab === "private"
                            ? "private_articles"
                            : tab === "restricted"
                            ? "restricted_articles"
                            : tab === "unlisted"
                            ? "unlisted_articles"
                            : "articles"
                        }`
                      ]
                    }
                  />
                ) : (
                  <Magazines
                    nextFunc={() => {
                      fn.getMyMagazines({ next: true, uid: router.query.id })
                    }}
                    topics={topics}
                    magazines={$.magazines || []}
                    next={$.next_magazines}
                  />
                )}
              </Box>
            </Fragment>
          )}
          {!isNil(edit) ? (
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
                  if (/^\s*$/.test(title)) {
                    alert($.lang.enter_name)
                    return
                  } else {
                    const new_writer = await fn.updateUserInfo({
                      id: writer.id,
                      user: $.user,
                      title,
                      image: uploadedArtworkURL,
                      profile_image: uploadedIconURL,
                      desc,
                      ext_icon,
                      ext,
                      writer: writer,
                    })
                    setWriter(new_writer)
                    setEdit(null)
                  }
                }}
              >
                <Box fontSize="20px">
                  <Box as="i" className="fas fa-save" mb={1} />
                </Box>
                <Box mt={1}>{$.lang.save}</Box>
              </Flex>
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
            </Flex>
          ) : !isNil($.user) ? (
            <Fragment>
              {isNil(writer) || !($.user.uid === writer.uid) ? null : (
                <Flex
                  sx={{ position: "fixed", right: 3, bottom: 3, zIndex: 1000 }}
                >
                  {!isNil(writer) &&
                  !isNil($.user) &&
                  writer.uid === $.user.uid ? (
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
              <Loading text="保存中..." color="white" textColor="white" />
            </Flex>
          ) : null}
          {$.posting_article ? (
            <Flex
              sx={{ position: "absolute", zIndex: 1000 }}
              width={1}
              height="100%"
              bg="rgba(0, 0, 0, 0.75)"
            >
              <Loading
                text={$.lang.saving_userdata}
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
    "posting_article",
    "user",
    "lang",
    "isFB",
    "articles",
    "writer",
    "next_articles",
    "data_storage",
    "topics",
    "magazines",
    "next_magazines",
  ]
)
