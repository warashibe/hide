import Article from "components/Article"
import { comment_map_parent } from "lib/selectors"
import { bind } from "nd"

export default bind(Article, [
  "user",
  "lang",
  "isFB",
  "data_storage",
  "comments",
  "next_comments",
  "blog_user_map",
  "blog_map",
  "_comment_map",
  "image_map",
  {
    comment_map_parent,
  },
])
