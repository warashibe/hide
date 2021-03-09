import { Fragment, useEffect, useState } from "react"
import moment from "moment"
require("moment-timezone")
import { bind } from "nd"
import { clone, compose, filter, isNil, map, values, range } from "ramda"
import { Flex, Box, Image } from "rebass"
import Loading from "components/Loading"
import NavCustomized from "components/NavCustomized"
import { Input, Select, Radio } from "@rebass/forms"
import Note from "components/Note"
export default bind(
  ({ $, set, init, conf, router, get }) => {
    const fn = init([
      "fetchBackupData",
      "removeBackupData",
      "backupCurrentData",
      "connectHub",
      "downloadJson",
      "importJson",
      "setLang",
      "switchUser",
      "createUser",
      "getUsers",
      "setUser",
    ])
    const [hub, setHub] = useState(null)
    const [tab, setTab] = useState(
      $.data_storage === "localforage" ? "users" : "lang"
    )
    const [new_user, setNewUser] = useState("")
    const [importJSON, setImportJSON] = useState(null)
    useEffect(() => {
      if ($.data_storage === "firestore") setTab("lang")
    }, [$.data_storage])
    let tmenu = []
    if ($.data_storage === "localforage") {
      tmenu.push({
        index: 0,
        text: $.lang.manage_users,
        key: `users`,
        awesome_icon: `fas fa-user`,
        onClick: () => setTab("users"),
      })
      tmenu.push({
        index: 1,
        text: $.lang.export,
        key: `export`,
        awesome_icon: `far fa-hdd`,
        onClick: () => setTab("export"),
      })
      tmenu.push({
        index: 2,
        text: $.lang.import,
        key: `import`,
        awesome_icon: `far fa-hdd`,
        onClick: () => setTab("import"),
      })
      tmenu.push({
        index: 3,
        text: $.lang.backup,
        key: `backup`,
        awesome_icon: `far fa-hdd`,
        onClick: () => setTab("backup"),
      })
    }
    tmenu.push({
      index: 4,
      text: $.lang.language,
      key: `lang`,
      awesome_icon: `fas fa-globe`,
      onClick: () => setTab("lang"),
    })
    useEffect(() => {
      if ($.user_init && tab === "users") fn.getUsers({})
    }, [$.user_init, tab])
    let backup = 0
    for (const v of $.backup_items || []) {
      const id = v.name.split(".").slice(0, -1).join(".")
      if (id === $.local_data_id) {
        backup = v.metadata.updatedAt / 10 ** 6
        break
      }
    }
    return (
      <Fragment>
        <NavCustomized tmenu={tmenu} chosen={tab} side_selected="backup">
          {!$.user_init || $.connecting_ipfs ? (
            <Flex
              sx={{ position: "absolute", zIndex: 1000 }}
              width={1}
              height="100%"
              bg="rgba(0, 0, 0, 0.75)"
            >
              <Loading text={$.lang.loading} color="white" textColor="white" />
            </Flex>
          ) : tab === "users" ? (
            <Flex
              sx={{ position: "absolute", zIndex: 1000 }}
              width={1}
              height="100%"
              bg="#eee"
              p={3}
              flexDirection="column"
            >
              <Flex width={1} mb={3} justifyContent="center">
                <Flex>
                  <Input
                    bg="white"
                    placeholder={$.lang.username30}
                    value={new_user}
                    onChange={e => {
                      if (e.target.value.length <= 30) {
                        setNewUser(e.target.value)
                      }
                    }}
                  />
                  <Flex
                    justifyContent="center"
                    alignItems="center"
                    px={3}
                    py={2}
                    width="200px"
                    bg="#5386E4"
                    color="white"
                    sx={{ cursor: "pointer", ":hover": { opacity: 0.75 } }}
                    onClick={async () => {
                      if (/^\s*$/.test(new_user)) {
                        alert($.lang.enter_username)
                      } else {
                        await fn.createUser({ name: new_user })
                        setNewUser("")
                      }
                    }}
                  >
                    {$.lang.create_user}
                  </Flex>
                </Flex>
              </Flex>
              <Flex
                width={1}
                flexDirection="column"
                px={[0, null, null, 3]}
                alignItems="center"
              >
                {map(v => {
                  return (
                    <Flex
                      alignItems="center"
                      key={v.uid}
                      width={1}
                      maxWidth="1000px"
                    >
                      <Flex
                        justifyContent="center"
                        alignItems="center"
                        height="100%"
                        pl={2}
                        onClick={() => fn.switchUser({ user: v })}
                        sx={{ cursor: "pointer", border: "1px solid white" }}
                        bg="#ddd"
                      >
                        {!isNil($.user) && $.user.uid === v.uid ? (
                          <Box>
                            <Radio checked="checked" />
                          </Box>
                        ) : (
                          <Radio />
                        )}
                      </Flex>
                      <Image src={v.image64} size="50px" />
                      <Box
                        flex={1}
                        p={3}
                        sx={{
                          border: "1px solid white",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        bg="#ddd"
                        width="380px"
                      >
                        {v.uid}
                      </Box>
                      <Box
                        flex={1}
                        sx={{
                          border: "1px solid white",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        bg="#ddd"
                        p={3}
                      >
                        {v.name}
                      </Box>
                    </Flex>
                  )
                })($.users)}
              </Flex>
            </Flex>
          ) : tab === "lang" ? (
            <Flex
              flex={1}
              width={1}
              flexWrap="wrap"
              bg="#eee"
              fontSize="14px"
              justifyContent="center"
              p={3}
            >
              <Box>
                <Select
                  bg="white"
                  value={$.lang.key || "en"}
                  width="150px"
                  onChange={e => {
                    fn.setLang({ user: $.user, lang: e.target.value })
                  }}
                >
                  {map(v => {
                    return <option value={v.key}>{v.name}</option>
                  })([
                    { key: "en", name: "English" },
                    { key: "ja", name: "日本語" },
                  ])}
                </Select>
              </Box>
            </Flex>
          ) : tab === "export" ? (
            <Flex
              flex={1}
              width={1}
              flexWrap="wrap"
              bg="#eee"
              justifyContent="center"
              p={3}
              flexDirection="column"
            >
              <Flex justifyContent="center" width={1}>
                <Box
                  py={3}
                  px={4}
                  color="white"
                  bg="#5386E4"
                  sx={{
                    borderRadius: "3px",
                    cursor: "pointer",
                    ":hover": { opacity: 0.75 },
                  }}
                  onClick={() => fn.downloadJson({})}
                >
                  {$.lang.download_all}
                </Box>
              </Flex>
            </Flex>
          ) : tab === "backup" ? (
            <Flex
              flex={1}
              width={1}
              flexWrap="wrap"
              bg="#eee"
              p={3}
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
            >
              <Flex
                mb={3}
                lineHeight="150%"
                width={1}
                px={3}
                fontSize="12px"
                alignItems="center"
              >
                <Flex width={1} sx={{ borderBottom: "3px #999 solid" }} pb={2}>
                  <Flex mx={2} flex={1} alignItems="center">
                    <Box
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      width={1}
                    >
                      Address: {isNil(hub) ? "Not Connected" : hub.address}
                    </Box>
                  </Flex>
                  <Box mx={2}>
                    {isNil(hub) ? (
                      ""
                    ) : (
                      <Box
                        sx={{
                          borderRadius: "3px",
                          cursor: "pointer",
                          ":hover": { opacity: 0.75 },
                        }}
                        px={3}
                        py={1}
                        bg="#BF731C"
                        color="white"
                        fontSize="14px"
                        onClick={() => setHub(null)}
                      >
                        {$.lang.disconnect}
                      </Box>
                    )}
                  </Box>
                </Flex>
              </Flex>
              <Flex flex={1} flexDirection="column">
                {isNil(hub) ? (
                  <Flex
                    flex={1}
                    flexDirection="column"
                    justifyContent="center"
                    pb={5}
                  >
                    <Flex mb={3} lineHeight="150%">
                      {$.lang.sign_and_pass}
                    </Flex>
                    <Flex
                      width={1}
                      maxWidth="500px"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Flex
                        height="100%"
                        justifyContent="center"
                        alignItems="center"
                        py={3}
                        px={4}
                        fontSize="16px"
                        bg="#5386E4"
                        color="white"
                        onClick={async () => setHub(await fn.connectHub({}))}
                        sx={{
                          borderRadius: "3px",
                          cursor: "pointer",
                          ":hover": { opacity: 0.75 },
                        }}
                      >
                        {$.lang.wallet_connect}
                      </Flex>
                    </Flex>
                  </Flex>
                ) : (
                  <Box>
                    <Flex justifyContent="center" width={1} mb={3}>
                      <Box
                        my={2}
                        py={2}
                        px={4}
                        color="white"
                        bg={
                          isNil($.last_updated) ||
                          ($.last_updated || 0) < backup
                            ? "#999"
                            : "#5386E4"
                        }
                        sx={{
                          borderRadius: "3px",
                          cursor:
                            isNil($.last_updated) ||
                            ($.last_updated || 0) < backup
                              ? "default"
                              : "pointer",
                          ":hover": { opacity: 0.75 },
                        }}
                        onClick={async () => {
                          await fn.backupCurrentData({ hub })
                        }}
                      >
                        {$.lang.backup_current_data}
                        {isNil($.local_data_id)
                          ? null
                          : ` (${$.local_data_id})`}
                      </Box>
                    </Flex>

                    {compose(
                      map(v => {
                        const id = v.name.split(".").slice(0, -1).join(".")

                        return (
                          <Flex
                            width={1}
                            my={1}
                            bg="#ddd"
                            minHeight="56px"
                            flexWrap="wrap"
                            justifyContent="center"
                            alignItems="center"
                          >
                            <Box ml="8px" width="50px" p={2}>
                              {id === $.local_data_id ? (
                                <Radio checked="checked" />
                              ) : null}
                            </Box>
                            <Box py={3} pr={3} flex={1} minWidth="150px">
                              {id}
                            </Box>
                            <Box width="80px" fontSize="12px" p={3}>
                              {Math.round(v.size / 1000)} KB
                            </Box>
                            <Box width="150px" fontSize="12px" p={3}>
                              {moment(v.metadata.updatedAt / 10 ** 6).format(
                                "YYYY/MM/DD HH:mm"
                              )}
                            </Box>
                            {isNil(v.json) ? (
                              <Flex
                                fontSize="12px"
                                justifyContent="center"
                                width="85px"
                                alignItems="center"
                                py={2}
                                ml={2}
                              >
                                <Box
                                  width={1}
                                  textAlign="center"
                                  p={2}
                                  mx={1}
                                  color="white"
                                  bg="#5386E4"
                                  sx={{
                                    borderRadius: "3px",
                                    cursor: "pointer",
                                    ":hover": { opacity: 0.75 },
                                  }}
                                  onClick={async () => {
                                    await fn.fetchBackupData({ item: v, hub })
                                  }}
                                >
                                  {$.lang.fetch}
                                </Box>
                              </Flex>
                            ) : (
                              <Flex
                                fontSize="12px"
                                justifyContent="center"
                                width="85px"
                                alignItems="center"
                                py={2}
                                ml={2}
                              >
                                <Box
                                  width={1}
                                  textAlign="center"
                                  p={2}
                                  mx={1}
                                  color="white"
                                  bg={isNil(v.json) ? "#999" : "#008080"}
                                  sx={{
                                    borderRadius: "3px",
                                    cursor: isNil(v.json)
                                      ? "default"
                                      : "pointer",
                                    ":hover": { opacity: 0.75 },
                                  }}
                                  onClick={async () => {
                                    if (
                                      !isNil(v.json) &&
                                      confirm($.lang.confirm_import)
                                    ) {
                                      await fn.importJson({ json: v.json })
                                    }
                                  }}
                                >
                                  {$.lang.import}
                                </Box>
                              </Flex>
                            )}
                            <Flex
                              fontSize="12px"
                              justifyContent="center"
                              width="40px"
                              alignItems="center"
                              py={2}
                            >
                              <Box
                                width={1}
                                textAlign="center"
                                p={2}
                                mx={1}
                                color="white"
                                bg={isNil(v.json) ? "#999" : "#BF731C"}
                                title={$.lang.download}
                                sx={{
                                  borderRadius: "3px",
                                  cursor: isNil(v.json) ? "default" : "pointer",
                                  ":hover": { opacity: 0.75 },
                                }}
                                onClick={async () => {
                                  if (!isNil(v.json))
                                    await fn.downloadJson({
                                      data: clone(v.json),
                                    })
                                }}
                              >
                                <Box as="i" className="fas fa-download" />
                              </Box>
                            </Flex>

                            <Flex
                              fontSize="12px"
                              justifyContent="center"
                              width="40px"
                              alignItems="center"
                              py={2}
                              mr={2}
                            >
                              <Box
                                width={1}
                                textAlign="center"
                                p={2}
                                mx={1}
                                color="white"
                                bg="#FF5757"
                                title={$.lang.delete}
                                sx={{
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                  ":hover": { opacity: 0.75 },
                                }}
                                onClick={async () => {
                                  if (confirm($.lang.confirm_backup_remove)) {
                                    await fn.removeBackupData({ item: v, hub })
                                  }
                                }}
                              >
                                <Box as="i" className="fas fa-trash" />
                              </Box>
                            </Flex>
                          </Flex>
                        )
                      })
                    )($.backup_items)}
                  </Box>
                )}
              </Flex>
            </Flex>
          ) : (
            <Flex
              flex={1}
              width={1}
              flexWrap="wrap"
              bg="#eee"
              p={3}
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
            >
              <Flex
                width={1}
                maxWidth="500px"
                justifyContent="center"
                alignItems="center"
                pb={2}
              >
                <Input
                  id="md_upload"
                  bg="white"
                  flex={1}
                  accept="application/json"
                  type="file"
                  p={1}
                  onChange={async e => {
                    const file = e.target.files[0]
                    const reader = new FileReader()
                    const [, mime] = file.type.split("/")
                    if (mime === "json") {
                      try {
                        reader.addEventListener("load", () => {
                          try {
                            const json = JSON.parse(reader.result)
                            if (!isNil(json.data.users)) setImportJSON(json)
                          } catch (e) {
                            alert($.lang.wrong)
                          }
                        })
                        reader.readAsText(file)
                      } catch (e) {
                        alert($.lang.wrong)
                      }
                    }
                  }}
                />
                <Flex
                  justifyContent="center"
                  alignItems="center"
                  py={2}
                  px={3}
                  bg={isNil(importJSON) ? "#999" : "#5386E4"}
                  color="white"
                  fontSize="12px"
                  height="34px"
                  onClick={async () => {
                    if (!isNil(importJSON)) {
                      if (confirm($.lang.import_confirmation)) {
                        await fn.importJson({ json: importJSON })
                        location.reload()
                      }
                    }
                  }}
                  sx={{ cursor: "pointer", ":hover": { opacity: 0.75 } }}
                >
                  {$.lang.importJSON}
                </Flex>
              </Flex>
              {isNil(importJSON) ? null : (
                <Flex my={3}>
                  <Box mx={2}>
                    <Box as="span" fontWeight="bold" color="#5386E4">
                      {values(importJSON.data.users || {}).length}
                    </Box>{" "}
                    {$.lang.users}
                  </Box>
                  <Box mx={2}>
                    <Box as="span" fontWeight="bold" color="#5386E4">
                      {values(importJSON.data.articles || {}).length}
                    </Box>{" "}
                    {$.lang._articles}
                  </Box>
                  <Box mx={2}>
                    <Box as="span" fontWeight="bold" color="#5386E4">
                      {values(importJSON.data.magazines || {}).length}
                    </Box>{" "}
                    {$.lang._magazines}
                  </Box>
                  <Box mx={2}>
                    <Box as="span" fontWeight="bold" color="#5386E4">
                      {values(importJSON.data.images || {}).length}
                    </Box>{" "}
                    {$.lang.images}
                  </Box>
                </Flex>
              )}
            </Flex>
          )}
          <Note />
        </NavCustomized>
      </Fragment>
    )
  },
  [
    "users",
    "user",
    "lang",
    "isFB",
    "data_storage",
    "user_init",
    "local_data_id",
    "connecting_ipfs",
    "backup_items",
    "last_updated",
    "backup",
  ]
)
