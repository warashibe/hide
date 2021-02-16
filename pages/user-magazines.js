import { Fragment, useEffect, useState } from "react"
import Loading from "components/Loading"
import { bind } from "nd"
import { isNil, map, compose, mergeLeft, indexBy, prop } from "ramda"
import { Flex, Box, Image } from "rebass"

import NavCustomized from "components/NavCustomized"
import Magazines from "components/Magazines"

export default bind(
  ({ $, set, init, conf, router }) => {
    const fn = init([
      "getMyMagazines",
      "getPrivateMagazines",
      "getUnlistedMagazines",
      "getRestrictedMagazines",
      "getWriter",
      "getTopics",
    ])
    useEffect(() => {
      ;(async () => {
        if ($.isFB && !isNil(router.query.id)) {
          fn.getTopics()
          fn.getMyMagazines({ uid: router.query.id })
          fn.getWriter({ uid: router.query.id })
        }
      })()
    }, [router, $.isFB])
    const [tab, setTab] = useState("public")
    const [init_private, setInitPrivate] = useState(false)
    const [init_restricted, setInitRestricted] = useState(false)
    const [init_unlisted, setInitUnlisted] = useState(false)
    let tmenu = []
    let smenu = []
    if (!isNil($.user)) {
      if ($.user.uid === router.query.id) {
        tmenu.push({
          index: 0,
          text: $.lang.public_articles,
          key: "public",
          awesome_icon: "fas fa-rss",
          onClick: () => setTab("public"),
        })
        tmenu.push({
          index: 2,
          text: $.lang.restricted_articles,
          key: "restricted",
          awesome_icon: "fas fa-lock",
          onClick: () => {
            if (!init_restricted) {
              fn.getRestrictedMagazines({ uid: $.user.uid })
              setInitRestricted(true)
            }
            setTab("restricted")
          },
        })
        tmenu.push({
          index: 3,
          text: $.lang.unlisted_articles,
          key: "unlisted",
          awesome_icon: "fas fa-eye-slash",
          onClick: () => {
            if (!init_unlisted) {
              fn.getUnlistedMagazines({ uid: $.user.uid })
              setInitUnlisted(true)
            }
            setTab("unlisted")
          },
        })

        tmenu.push({
          index: 4,
          text: $.lang.private_magazines,
          key: "private",
          awesome_icon: "fas fa-shield-alt",
          onClick: () => {
            if (!init_private) {
              fn.getPrivateMagazines({ uid: $.user.uid })
              setInitPrivate(true)
            }
            setTab("private")
          },
        })
      } else {
        tmenu.push({
          index: 3,
          text: $.lang.blog,
          key: `top-blog`,
          awesome_icon: `fas fa-rss`,
          href: `/blog/${$.user.uid}`,
          target: "_self",
        })
      }

      tmenu.push({
        index: 4,
        text: $.lang.create_magazine,
        key: `top-edit`,
        awesome_icon: `fas fa-edit`,
        href: "/magazines/edit",
        target: "_self",
      })
    }
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

    const side_selected = tab
    const magazines =
      tab === "public"
        ? $.magazines
        : tab === "restricted"
        ? $.restricted_magazines
        : tab === "unlisted"
        ? $.unlisted_magazines
        : $.private_magazines
    return (
      <Fragment>
        <NavCustomized
          {...{ smenu, tmenu }}
          chosen={tab}
          side_selected={
            !isNil($.user) && router.query.id === $.user.uid
              ? "your_magazines"
              : null
          }
        >
          {isNil(magazines) ? (
            <Box flex={1} width={1} flexWrap="wrap" bg="#eee" pb={2}>
              <Loading text={$.lang.loading_article} />
            </Box>
          ) : (
            <Box flex={1} width={1} flexWrap="wrap" bg="#eee">
              {isNil($.writer) ? null : (
                <Flex
                  width={1}
                  justifyContent="center"
                  mt={3}
                  px={3}
                  color="#111"
                >
                  <Box
                    as="a"
                    display="flex"
                    target="_blank"
                    href={
                      !isNil($.writer.links.twitter)
                        ? `https://twitter.com/${$.writer.links.twitter.username}`
                        : !isNil($.writer.links.alis)
                        ? `https://alis.to/users/${$.writer.links.alis.username}`
                        : null
                    }
                    bg="white"
                    color="#5386E4"
                    py={1}
                    px={3}
                    alignItems="center"
                    sx={{
                      textDecoration: "none",
                      cursor: "pointer",
                      ":hover": { opacity: 0.75 },
                      borderRadius: "5px",
                      boxShadow:
                        "rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px",
                    }}
                  >
                    <Image
                      mr={2}
                      width="30px"
                      src={$.writer.image64 || $.writer.image}
                      height="30px"
                      sx={{ borderRadius: "50%" }}
                    />
                    {$.writer.name}
                  </Box>
                </Flex>
              )}
              <Magazines
                nextFunc={() => {
                  if (tab === "public") {
                    fn.getMyMagazines({ next: true, uid: router.query.id })
                  } else if (tab === "private") {
                    fn.getPrivateMagazines({
                      next: true,
                      uid: router.query.id,
                    })
                  } else if (tab === "unlisted") {
                    fn.getUnlistedMagazines({
                      next: true,
                      uid: router.query.id,
                    })
                  } else {
                    fn.getRestrictedMagazines({
                      next: true,
                      uid: router.query.id,
                    })
                  }
                }}
                topics={topics}
                isPrivate={tab === "private"}
                magazines={magazines}
                next={
                  $[
                    `next_${
                      tab === "private"
                        ? "private_magazines"
                        : tab === "restricted"
                        ? "restricted_magazines"
                        : tab === "unlisted"
                        ? "unlisted_magazines"
                        : "magazines"
                    }`
                  ]
                }
              />
            </Box>
          )}
        </NavCustomized>
      </Fragment>
    )
  },
  [
    "user",
    "lang",
    "isFB",
    "magazines",
    "writer",
    "private_magazines",
    "unlisted_magazines",
    "restricted_magazines",
    "next_magazines",
    "next_private_magazines",
    "next_unlisted_magazines",
    "next_restricted_magazines",
    "data_storage",
    "topics",
  ]
)
