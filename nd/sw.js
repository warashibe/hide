import { precacheAndRoute } from "workbox-precaching/precacheAndRoute"
import { createHandlerBoundToURL } from "workbox-precaching"
import { NavigationRoute, registerRoute } from "workbox-routing"
import { forEach } from "ramda"

precacheAndRoute(self.__WB_MANIFEST)

forEach(v => {
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL(v.file), {
      allowlist: [new RegExp(v.reg)],
    })
  )
})([
  { file: `/articles/edit`, reg: "/articles/edit.*" },
  { file: `/article`, reg: "/article\\?id=.+" },
  { file: `/magazine`, reg: "/magazine\\?id=.+" },
  { file: `/user`, reg: "/user\\?id=.+" },
  { file: `/user-articles`, reg: "/user-articles\\?id=.+" },
  { file: `/user-magazines`, reg: "/user-magazines\\?id=.+" },
])

self.addEventListener("install", function (event) {
  self.skipWaiting()
})
