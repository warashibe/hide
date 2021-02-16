import { useState, useEffect } from "react"
import DOMPurify from "dompurify"
import { keys, includes, isNil, prepend, concat } from "ramda"
import _wl from "lib/whitelist.json"
const wl = keys(_wl.domains)
import url from "url"
const _md = require("markdown-it")({
  html: true,
})
const mk = require("markdown-it-katex")
_md.use(mk)

export const checkURL = src => {
  let banned = true
  let hostname = url.parse(src).hostname
  for (const v of concat(["hatenablog-parts.com", "stand.fm"])(wl)) {
    console.log(v)
    const reg = /^\*\./.test(v)
      ? new RegExp("^" + v.replace(/^\*\./, ""))
      : new RegExp("^" + v)
    if (
      (/^\*\./.test(v) &&
        hostname.split(".").slice(-2).join(".") === v.replace(/^\*\./, "")) ||
      reg.test(hostname)
    ) {
      banned = false
      break
    }
  }
  return banned
}

export const toHTML = content => _md.render(content)
export const toMarked = content =>
  DOMPurify.sanitize(toHTML(content), {
    ADD_TAGS: [
      "iframe",
      "script",
      "coingecko-coin-market-ticker-list-widget",
      "coingecko-coin-ticker-widget",
      "coingecko-coin-market-ticker-list-widget",
      "coingecko-coin-price-chart-widget",
      "coingecko-coin-converter-widget",
      "coingecko-coin-list-widget",
      "coingecko-coin-price-marquee-widget",
      "coingecko-coin-price-static-headline-widget",
      "coingecko-coin-heatmap-widget",
      "coingecko-coin-compare-chart-widget",
      "coingecko-beam-widget",
      "coingecko-random-coin-widget",
    ],
    ADD_ATTR: [
      "type",
      "width",
      "height",
      "background-color",
      "font-color",
      "allow",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "coin-id",
      "coin-ids",
      "currency",
      "locale",
    ],
    FORCE_BODY: true,
  })

export const useScript = src => {
  const [status, setStatus] = useState(src ? "loading" : "idle")
  useEffect(() => {
    if (!src) {
      setStatus("idle")
      return
    }

    let script = document.querySelector(`script[src="${src}"]`)
    if (!script) {
      script = document.createElement("script")
      script.src = src
      script.async = true
      script.setAttribute("data-status", "loading")
      document.body.appendChild(script)
      const setAttributeFromEvent = event => {
        script.setAttribute(
          "data-status",

          event.type === "load" ? "ready" : "error"
        )
      }
      script.addEventListener("load", setAttributeFromEvent)
      script.addEventListener("error", setAttributeFromEvent)
    } else {
      setStatus(script.getAttribute("data-status"))
    }
    const setStateFromEvent = event => {
      setStatus(event.type === "load" ? "ready" : "error")
    }
    script.addEventListener("load", setStateFromEvent)
    script.addEventListener("error", setStateFromEvent)
    return () => {
      if (script) {
        script.removeEventListener("load", setStateFromEvent)
        script.removeEventListener("error", setStateFromEvent)
      }
    }
  }, [src])

  return status
}

export const _checkHeight = ({ ids, _default, delay = 0, setHeight }) => {
  if (!isNil(window)) {
    let missing = false
    let tries = 0
    const check = () => {
      tries += 1
      setTimeout(() => {
        let _height = window.innerHeight
        const h1 = document.getElementById(ids[0])
        if (!isNil(h1)) {
          _height -= h1.offsetHeight
          if (ids.length > 1) {
            for (let v of ids.slice(1)) {
              const h = document.getElementById(v)
              if (!isNil(h)) {
                _height -= h.offsetHeight
              } else {
                missing = true
              }
            }
          }
        } else {
          missing = true
        }
        if (missing === false) {
          setHeight(_height)
        } else {
          if (tries < 5) {
            check()
          }
        }
      }, delay)
    }
    check()
  }
}

export const getContrastYIQ = hexcolor => {
  var r = parseInt(hexcolor.substr(0, 2), 16)
  var g = parseInt(hexcolor.substr(2, 2), 16)
  var b = parseInt(hexcolor.substr(4, 2), 16)
  var yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? "black" : "white"
}
