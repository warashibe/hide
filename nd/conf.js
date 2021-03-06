import { mergeAll } from "ramda"
let local = {}
try {
  local = require("nd/conf.local")
} catch (e) {}

const prod = {
  id: "hide",
  html: {
    title: "HiÐe. | Hi, Ðecentralization!",
    description: "Offline First Decentralized CMS",
    image: "http://localhost:3000/static/images/cover.png",
    "theme-color": "#5386E4",
  },
}

module.exports = mergeAll([prod, local])
