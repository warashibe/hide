import langs from "./langs"
import fbls from "firestore-offline"
import shortid from "shortid"
import sweet from "firestore-sweet"
import lf from "localforage"
import { is, isNil, isEmpty } from "ramda"

let logging = false

const initOfflineFB = async ({
  fn,
  get,
  set,
  global,
  val: { init_data, local_user },
}) => {
  fbls.initializeApp({
    onChange: async data => {
      await lf.setItem("hideaki_data", data.data)
      if (isNil(data.op.data) || isNil(data.op.data.backup)) {
        const update = Date.now()
        await lf.setItem("last_updated", update)
        await set(update, "last_updated")
      }
    },
    data: init_data,
  })
  global.db = sweet(fbls.firestore)
}

export const initialize = async ({ fn, get, set, global }) => {
  const lang = (await lf.getItem("lang")) || "en"
  await set(langs[lang], "lang")
  const data_storage = (await lf.getItem("storage")) || "localforage"
  let local_user = await lf.getItem("user")
  if (!isNil(local_user) && isNil(local_user.uid)) local_user = null
  const init_data = (await lf.getItem("hideaki_data")) || {}
  if (
    !isNil(local_user) &&
    !isNil(init_data.users) &&
    !isNil(init_data.users[local_user.uid])
  ) {
    local_user = init_data.users[local_user.uid]
  } else {
    local_user = null
  }
  const backup = (await lf.getItem("backup")) || null
  const local_data_id = (await lf.getItem("local_data_id")) || null
  const backups = (await lf.getItem("backups")) || {}
  const last_updated = await lf.getItem("last_updated")
  let isOffline = data_storage === "localforage"
  await fn(initOfflineFB)({ init_data, local_user })
  await set({
    backup,
    backups,
    local_data_id,
    data_storage,
    local_user,
    last_updated,
    local_uid: isNil(local_user) ? null : local_user.uid,
  })
  await set({ user_init: true, isFB: true, user: local_user })
}
