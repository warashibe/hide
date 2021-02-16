import { Fragment } from "react"
import Head from "next/head"
import { isNil } from "ramda"

export default ({ title, description, image }) => (
  <Head>
    {isNil(title) ? null : (
      <Fragment>
        <title>{title}</title>
        <meta property="twitter:title" key="twitter:title" content={title} />
        <meta key="og:title" property="og:title" content={title} />
      </Fragment>
    )}
    {isNil(description) ? null : (
      <Fragment>
        <meta key="description" name="description" content={description} />
        <meta
          property="twitter:description"
          key="twitter:description"
          content={description}
        />
        <meta
          key="og:description"
          property="og:description"
          content={description}
        />
      </Fragment>
    )}
    {isNil(image) ? null : (
      <Fragment>
        <meta
          key="twitter:card"
          property="twitter:card"
          content="summary_large_image"
        />
        <meta property="twitter:image" key="twitter:image" content={image} />

        <meta key="og:image" property="og:image" content={image} />
      </Fragment>
    )}
  </Head>
)
