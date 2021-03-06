import { Fragment, useEffect, useState } from "react"
import { bind } from "nd"
import {
  reverse,
  values,
  mergeLeft,
  compose,
  indexBy,
  prop,
  isNil,
  map,
} from "ramda"
import { Flex, Box, Image } from "rebass"

import Loading from "components/Loading"
import NavCustomized from "components/NavCustomized"
import Articles from "components/Articles"
import Header from "online/components/Header"

export default bind(
  ({ $, init, conf }) => {
    const fn = init(["getAllArticles", "getTopics"])
    const [topic, setTopic] = useState(null)

    useEffect(() => {
      if ($.isFB) {
        fn.getTopics()
      }
    }, [$.isFB])

    useEffect(() => {
      if ($.isFB) {
        fn.getAllArticles({ topic, user: $.user })
      }
    }, [$.isFB, topic])

    let extra = {}

    if (!isNil($.user)) {
      extra.restricted = {
        key: "restricted",
        name: $.lang.restricted_articles,
        bar: $.lang.unsorted,
        color: "#222",
        icon: "fas fa-lock",
      }
    }

    extra.undefined = {
      key: null,
      name: $.lang.all,
      bar: $.lang.unsorted,
      color: "#222",
      src: "/static/images/icon-128x128.png",
    }

    const topics = compose(mergeLeft(extra), indexBy(prop("key")))($.topics)
    return (
      <Fragment>
        <NavCustomized side_selected="blogs">
          {$.data_storage === "firestore" ? <Header /> : null}
          {isNil($.all_articles) ? (
            <Box
              flex={1}
              width={1}
              flexWrap="wrap"
              bg="#eee"
              pb={2}
              pt={$.data_storage === "firestore" ? 2 : 0}
            >
              <Loading text={$.lang.loading_article} />
            </Box>
          ) : (
            <Box
              flex={1}
              width={1}
              flexWrap="wrap"
              bg="#eee"
              pt={$.data_storage === "firestore" ? 2 : 0}
            >
              <Flex
                width={1}
                justifyContent="center"
                mt="24px"
                px={3}
                color="#111"
                flexWrap="wrap"
              >
                {compose(
                  map(v => (
                    <Flex
                      mb={3}
                      width="75px"
                      justifyContent="center"
                      flexWrap="wrap"
                      mx={1}
                      onClick={() => setTopic(v.key)}
                      sx={{
                        cursor: "pointer",
                        ":hover": { opacity: 0.75 },
                      }}
                    >
                      <Flex
                        justifyContent="center"
                        width={1}
                        sx={{
                          borderRadius: "5px",
                        }}
                      >
                        {!isNil(v.icon) ? (
                          <Flex
                            size="50px"
                            justifyContent="center"
                            alignItems="center"
                            fontSize="30px"
                            color="#5386E4"
                            bg="white"
                            sx={{
                              borderRadius: "5px",
                              border:
                                topic === v.key ? "3px solid #5386E4" : "",
                            }}
                          >
                            <Box as="i" className={v.icon} />
                          </Flex>
                        ) : (
                          <Image
                            size="50px"
                            sx={{
                              borderRadius: "5px",
                              border:
                                topic === v.key ? "3px solid #5386E4" : "",
                            }}
                            src={
                              v.src ||
                              `https://firebasestorage.googleapis.com/v0/b/${conf.fb.id}.appspot.com/o/topics%2F${v.id}.${v.ext}?alt=media`
                            }
                          />
                        )}
                      </Flex>
                      <Box
                        fontSize="11px"
                        mt={2}
                        textAlign="center"
                        color={v.key === topic ? "#5386E4" : "#222"}
                        fontWeight={v.key === topic ? "bold" : "normal"}
                      >
                        {v.name}
                      </Box>
                    </Flex>
                  )),
                  reverse,
                  values
                )(topics)}
              </Flex>
              <Articles
                nextFunc={() =>
                  fn.getAllArticles({ next: true, topic, user: $.user })
                }
                topics={topics}
                isPrivate={false}
                articles={$.all_articles}
                next={$[`next_all_articles`]}
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
    "next_all_articles",
    "all_articles",
    "topics",
    "user_init",
    "data_storage",
  ]
)
