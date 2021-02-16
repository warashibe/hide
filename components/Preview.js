import { Fragment } from "react"
import { getPreview } from "lib/editor"
import GithubMarkdown from "lib/css/GithubMarkdown"

export default props => {
  const value = props.value || []
  const __html = getPreview(props, value)
  return (
    <Fragment>
      <GithubMarkdown />
      {__html}
    </Fragment>
  )
}
