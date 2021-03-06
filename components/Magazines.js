import { Fragment, useEffect, useState } from "react"
import { bind } from "nd"
import { clone, isNil, map, addIndex, range, uniq, append, o } from "ramda"
import { Flex, Box, Image } from "rebass"
import { getContrastYIQ } from "lib/utils"

import moment from "moment"
require("moment-timezone")
moment.locale("ja")

export default bind(
  ({ $, magazines, isPrivate, next, topics, router, nextFunc }) => {
    return (
      <Fragment>
        <Flex p={3} flexWrap="wrap" width={1}>
          {magazines.length == 0 ? (
            <Box p={2} textAlign="center" width={1}>
              {$.lang.no_magazine}
            </Box>
          ) : (
            map(v => {
              const author_map = v.authors_data
              const authors = o(uniq, append(v.uid))(v.authors || [])
              let all_topics = []
              for (let v2 of v.articles || []) {
                for (let t of v2.topics || []) {
                  all_topics.push(t)
                }
              }
              all_topics = uniq(all_topics).slice(0, 3)
              let default_topics = null
              for (let v of v.topics || []) {
                if (!isNil(topics[v])) {
                  default_topics = topics[v]
                  break
                }
              }
              let articles = clone(v.recent_articles) || []
              if ((articles || []).length < 3) {
                for (let v of range(0, 3 - (articles || []).length)) {
                  articles.push({})
                }
              }
              return (
                <Flex width={[1, null, 1 / 2, null, 1 / 3, null, 1 / 4]} p={3}>
                  <Box
                    display="flex"
                    as="a"
                    href={
                      $.data_storage === "localforage"
                        ? `/magazine?id=${v.id}`
                        : `/magazines/${v.id}`
                    }
                    width={1}
                    height="405px"
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
                    {isNil(v.image) || v.no_cover ? (
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
                        sx={{ overflow: "hidden", borderRadius: "5px 5px 0 0" }}
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
                          backgroundImage: `url(${v.image})`,
                        }}
                      />
                    )}
                    <Flex flexDirection="column" width={1} height="99px">
                      {addIndex(map)((a, i) => {
                        const tpc = isNil(a.topics) ? null : topics[a.topics[0]]
                        let bg = "#111"
                        for (let t of a.topics || []) {
                          if (!isNil(topics[t])) {
                            bg = topics[t].color
                            break
                          }
                        }
                        return (
                          <Flex
                            height="35px"
                            width={1}
                            px={3}
                            py={2}
                            color="#5386E4"
                            alignItems="center"
                            sx={{ borderTop: "1px solid #eee" }}
                          >
                            {isNil(a.title) ? null : (
                              <Fragment>
                                <Box
                                  size="16px"
                                  bg={bg}
                                  mr={3}
                                  sx={{ borderRadius: "3px" }}
                                ></Box>
                                <Box
                                  sx={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                  flex={1}
                                  fontSize="14px"
                                >
                                  {a.title}
                                </Box>
                                <Box
                                  sx={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                  pl={1}
                                  width="60px"
                                  fontSize="10px"
                                  color="#777"
                                  textAlign="right"
                                >
                                  {moment(a.published_at).fromNow()}
                                </Box>
                              </Fragment>
                            )}
                          </Flex>
                        )
                      })(articles)}
                    </Flex>
                    {(v.topics || []).length === 0 ? (
                      <Flex
                        height="20px"
                        justifyContent="center"
                        alignItems="center"
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

                    <Box
                      height="40px"
                      color="#5386E4"
                      width={1}
                      fontSize="16px"
                      fontWeight="bold"
                      px={3}
                      pt={3}
                      lineHeight="135%"
                      sx={{
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                      }}
                    >
                      {v.title}
                    </Box>
                    <Box
                      height="43px"
                      color="#222"
                      width={1}
                      fontSize="13px"
                      px={3}
                      py={1}
                      lineHeight="140%"
                      sx={{
                        overflow: "hidden",
                      }}
                    >
                      {v.desc}
                    </Box>

                    <Flex height="60px" flexWrap="wrap">
                      <Flex
                        alignItems="center"
                        width={1}
                        pb={2}
                        px={3}
                        height="55px"
                        alignSelf="flex-end"
                      >
                        {map(a => {
                          const author = author_map[a]
                          return isNil(author) ? null : (
                            <Image
                              mr={1}
                              width="40px"
                              src={author.image64 || author.image}
                              title={author.name}
                              height="40px"
                              sx={{ borderRadius: "50%" }}
                            />
                          )
                        })(v.authors)}
                        <Flex
                          lineHeight="150%"
                          flex={1}
                          fontSize="12px"
                          flexWrap="wrap"
                          ml={2}
                          color="#333"
                        >
                          <Box width={1}>
                            {v.user.name}
                            {authors.length === 1
                              ? null
                              : `, 他${authors.length - 1}名`}
                          </Box>
                          <Box width={1}>
                            {v.updated_at === 0
                              ? ""
                              : moment(v.updated_at).fromNow()}
                          </Box>
                        </Flex>
                      </Flex>
                    </Flex>
                  </Box>
                </Flex>
              )
            })(magazines)
          )}
        </Flex>
        {next !== true ? null : (
          <Flex width={1} justifyContent="center" mb={3} px={3} color="#111">
            <Flex
              title={$.lang.load_more}
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
  ["lang", "data_storage"]
)
