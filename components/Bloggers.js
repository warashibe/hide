import { Fragment, useEffect, useState } from "react"
import { bind } from "nd"
import { isNil, map, uniq, append, o } from "ramda"
import { Flex, Box, Image } from "rebass"
import { getContrastYIQ } from "lib/utils"
import moment from "moment"
require("moment-timezone")
moment.locale("ja")

export default bind(
  ({ $, users, isPrivate, next, topics, router, nextFunc }) => {
    return (
      <Fragment>
        <Flex p={3} flexWrap="wrap" width={1}>
          {users.length == 0 ? (
            <Box p={2} textAlign="center" width={1}>
              {$.lang.no_users}
            </Box>
          ) : (
            map(v => {
              const author_map = { [v.uid]: v }
              const authors = o(uniq, append(v.uid))(v.authors || [])
              let all_topics = []
              for (let v2 of v.articles) {
                for (let t of v2.topics || []) {
                  all_topics.push(t)
                }
              }
              all_topics = uniq(all_topics).slice(0, 3)
              return (
                <Flex width={[1, null, 1 / 2, null, 1 / 3, null, 1 / 4]} p={3}>
                  <Box
                    display="flex"
                    as="a"
                    href={`/user?id=${v.uid}`}
                    width={1}
                    height="237px"
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
                    <Flex flexDirection="column" width={1} height="147px">
                      {map(a => {
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
                            width={1}
                            p={3}
                            color="#5386E4"
                            alignItems="center"
                            sx={{
                              borderBottom: "1px solid #eee",
                            }}
                          >
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
                              color="#aaa"
                              textAlign="right"
                            >
                              {moment(a.published_at).fromNow()}
                            </Box>
                          </Flex>
                        )
                      })(v.articles)}
                    </Flex>
                    {(all_topics || []).length === 0 ? (
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
                        })(all_topics)}
                      </Flex>
                    )}
                    <Flex height="65px" flexWrap="wrap">
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
                          return (
                            <Image
                              mr={1}
                              width="40px"
                              src={author.image64 || author.image}
                              title={author.name}
                              height="40px"
                              sx={{ borderRadius: "50%" }}
                            />
                          )
                        })([v.uid])}
                        <Flex
                          lineHeight="150%"
                          flex={1}
                          fontSize="12px"
                          flexWrap="wrap"
                          ml={2}
                          color="#333"
                        >
                          <Box width={1} sx={{ wordBreak: "break-all" }}>
                            {v.name}
                          </Box>
                          <Box width={1}>
                            {moment(v.last_article).fromNow()}
                          </Box>
                        </Flex>
                      </Flex>
                    </Flex>
                  </Box>
                </Flex>
              )
            })(users)
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
  ["lang"]
)
