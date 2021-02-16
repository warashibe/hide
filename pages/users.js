import { useEffect } from "react"
import Loading from "components/Loading"
import { bind } from "nd"
import { isNil, indexBy, prop } from "ramda"
import { Flex, Box } from "rebass"
import NavCustomized from "components/NavCustomized"
import Bloggers from "components/Bloggers"

export default bind(
  ({ $, set, init, conf, router }) => {
    const fn = init(["getTopics", "getBloggers"])

    useEffect(() => {
      if ($.isFB) {
        fn.getTopics({})
        fn.getBloggers({})
      }
    }, [$.isFB])

    return (
      <NavCustomized side_selected="users">
        <Box flex={1} width={1} flexWrap="wrap" bg="#eee" pb={2}>
          {isNil($.bloggers) ? (
            <Loading text={$.lang.loading_article} />
          ) : (
            <Bloggers
              nextFunc={() => fn.getBloggers({ next: true })}
              topics={indexBy(prop("key"))($.topics)}
              users={$.bloggers}
              next={$[`next_bloggers`]}
            />
          )}
        </Box>
      </NavCustomized>
    )
  },
  ["user", "lang", "isFB", "topics", "bloggers", "next_bloggers"]
)
