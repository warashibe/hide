import { Fragment, useEffect, useState } from "react"
import { bind } from "nd"
import { mergeLeft, sortBy, isNil, map, uniq, append, o } from "ramda"
import { Flex, Box, Image } from "rebass"
import { getContrastYIQ } from "lib/utils"
import Link from "next/link"
import moment from "moment"
require("moment-timezone")
moment.locale("ja")

export default bind(
  ({
    $,
    articles,
    isPrivate,
    next,
    topics,
    router,
    noSort,
    nextFunc,
    width = [1 / 4, null, 1 / 2, null, 1 / 3, null, 1 / 4],
  }) => {
    return (
      <Fragment>
        <Flex p={3} flexWrap="wrap" width={1}>
          {articles.length == 0 ? (
            <Box p={2} textAlign="center" width={1}>
              {$.lang.no_article}
            </Box>
          ) : (
            map(v => {
              const author_map = mergeLeft(
                { [v.uid]: v.user },
                v.authors_data || {}
              )
              const authors = o(uniq, append(v.uid))(v.authors || [])
              let default_topics = null
              for (let v of v.topics || []) {
                if (!isNil(topics[v])) {
                  default_topics = topics[v]
                  break
                }
              }
              return (
                <Flex width={width} p={3}>
                  <Box
                    href={
                      isPrivate
                        ? `/articles/edit?id=${v.id}`
                        : `/article?id=${v.id}`
                    }
                    display="flex"
                    as="a"
                    width={1}
                    height="300px"
                    flexWrap="wrap"
                    bg="#fff"
                    sx={{
                      borderRadius: "5px",
                      textDecoration: "none",
                      cursor: "pointer",
                      ":hover": { opacity: 0.75 },
                      boxShadow:
                        "rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px",
                    }}
                  >
                    {isNil(v.cover) || v.no_cover ? (
                      <Flex
                        fontSize="24px"
                        lineHeight="150%"
                        fontWeight="bold"
                        color={
                          isNil(default_topics) ? "#222" : default_topics.color
                        }
                        p={4}
                        width={1}
                        height="140px"
                        bg="#ccc"
                        justifyContent="center"
                        alignItems="center"
                        sx={{
                          overflow: "hidden",
                          borderRadius: "5px 5px 0 0",
                        }}
                      >
                        {v.title}
                      </Flex>
                    ) : (
                      <Flex
                        width={1}
                        height="140px"
                        bg="#ccc"
                        sx={{
                          borderRadius: "5px 5px 0 0",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundImage: `url(${v.cover})`,
                        }}
                      />
                    )}
                    {isNil(default_topics) ? (
                      <Flex
                        height="20px"
                        justifyContent="center"
                        alignItems="center"
                        color={"white"}
                        bg={"#111"}
                        width={1}
                        fontSize="12px"
                      ></Flex>
                    ) : (
                      <Flex width={1}>
                        {map(v => {
                          return isNil(topics[v]) ? null : (
                            <Flex
                              flex={1}
                              height="20px"
                              justifyContent="center"
                              alignItems="center"
                              color={getContrastYIQ(
                                topics[v].color.replace(/#/, "")
                              )}
                              bg={topics[v].color}
                              width={1}
                              fontSize="12px"
                            >
                              {topics[v].bar || topics[v].name}
                            </Flex>
                          )
                        })(v.topics)}
                      </Flex>
                    )}
                    <Flex height="140px" flexWrap="wrap">
                      <Box
                        height="80px"
                        color="#5386E4"
                        width={1}
                        fontSize="16px"
                        fontWeight="bold"
                        px={3}
                        pt={3}
                        lineHeight="135%"
                        sx={{ overflow: "hidden" }}
                      >
                        {v.title}
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
                          return (
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
                          <Box width={1} sx={{ wordBreak: "break-all" }}>
                            {v.user.name}
                            {authors.length === 1
                              ? null
                              : `, ${$.lang.others_pre}${authors.length - 1}${
                                  $.lang.others_post
                                }`}
                          </Box>
                          <Box width={1}>
                            {moment(v.published_at || v.created_at).fromNow()}
                          </Box>
                        </Flex>
                      </Flex>
                    </Flex>
                  </Box>
                </Flex>
              )
            })(
              noSort
                ? articles
                : sortBy(v => (v.published_at || v.created_at) * -1)(articles)
            )
          )}
        </Flex>
        {next !== true ? null : (
          <Flex width={1} justifyContent="center" mb={3} px={3} color="#111">
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
              onClick={() => nextFunc()}
            >
              <Box as="i" fontSize="30px" className="fas fa-angle-down" />
            </Flex>
          </Flex>
        )}
      </Fragment>
    )
  },
  ["lang"]
)
