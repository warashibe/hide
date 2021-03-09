import { mergeAll } from "ramda"
let local = {}
try {
  local = require("nd/conf.local")
} catch (e) {}

const prod = {
  id: "hide",
  html: {
    title: "HiÐΞ | Hi, ÐΞcentralization!",
    description: "Offline First Decentralized CMS",
    image: "http://localhost:3000/static/images/cover.png",
    "theme-color": "#5386E4",
  },
  textile: {
    key: "<YOUR_TEXTILE_USER_GROUP_KEY>",
    secret: "<YOUR_TEXTILE_USER_GROUP_SECRET>",
    application_name: "HiÐΞ",
  },
}

module.exports = mergeAll([prod, local])
