const path = require("path")
const withOffline = require("next-offline")
const { PHASE_DEVELOPMENT_SERVER } = require("next/constants")
const {
  map,
  compose,
  forEach,
  reduce,
  concat,
  filter,
  values,
  pluck,
  isNil,
  complement,
} = require("ramda")
const revision = Date.now().toString()
const webpack = (
  config,
  { buildId, dev, isServer, defaultLoaders, webpack }
) => {
  compose(
    forEach(
      v =>
        (config.resolve.alias[v] = path.resolve(__dirname, `node_modules/${v}`))
    ),
    reduce(concat, ["recoil", "ramda"]),
    filter(complement(isNil)),
    pluck("peer"),
    values
  )(require("./nd/.plugins"))
  return config
}

const nextConfig = {
  target: "serverless",
  transformManifest: manifest => ["/"].concat(manifest),
  generateInDevMode: true,
  generateSw: false,
  workboxOpts: {
    swDest: "../public/service-worker.js",
    swSrc: __dirname + "/nd/sw.js",
    maximumFileSizeToCacheInBytes: 100000000,
    additionalManifestEntries: map(v => {
      return { url: v, revision }
    })([
      "/",
      "/users",
      "/magazines",
      "/comments",
      "/settings",
      "/articles/edit",
      "/magazines/edit",
      `/article`,
      `/magazine`,
      `/user`,
      `/user-articles`,
      `/user-magazines`,
      "/static/manifest.json",
      "/static/favicon.ico",
      "/static/images/logo.png",
      "/static/images/icon-128x128.png",
      "/static/images/icon-144x144.png",
    ]),
  },
  webpack,
}

const nextConfig_dev = {
  target: "serverless",
  transformManifest: manifest => ["/"].concat(manifest),
  generateInDevMode: true,
  generateSw: false,
  workboxOpts: {
    swDest: "../public/service-worker.js",
    swSrc: __dirname + "/nd/sw_dev.js",
    maximumFileSizeToCacheInBytes: 10000000000,
  },
  webpack,
}

module.exports = (phase, { defaultConfig }) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) return withOffline(nextConfig_dev)
  return withOffline(nextConfig)
}
