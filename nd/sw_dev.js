import { precacheAndRoute } from "workbox-precaching/precacheAndRoute"
precacheAndRoute(self.__WB_MANIFEST)
self.addEventListener("install", function (event) {
  self.skipWaiting()
})
