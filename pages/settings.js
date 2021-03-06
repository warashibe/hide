import { Fragment, useEffect, useState } from "react"
import { bind } from "nd"
import { isNil, map, values } from "ramda"
import { Flex, Box, Image } from "rebass"
import Loading from "components/Loading"
import NavCustomized from "components/NavCustomized"
import { Input, Select, Radio } from "@rebass/forms"

export default bind(
  ({ $, set, init, conf, router, get }) => {
    const fn = init([
      "downloadJson",
      "importJson",
      "setLang",
      "switchUser",
      "createUser",
      "getUsers",
      "setUser",
    ])

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
    }
    tmenu.push({
      index: 3,
      text: $.lang.language,
      key: `lang`,
      awesome_icon: `fas fa-globe`,
      onClick: () => setTab("lang"),
    })
    useEffect(() => {
      if ($.user_init && tab === "users") fn.getUsers({})
    }, [$.user_init, tab])

    return (
      <Fragment>
        <NavCustomized tmenu={tmenu} chosen={tab} side_selected="backup">
          {!$.user_init ? (
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
                  onClick={() => {
                    fn.downloadJson()
                  }}
                >
                  {$.lang.download_all}
                </Box>
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
        </NavCustomized>
      </Fragment>
    )
  },
  ["users", "user", "lang", "isFB", "data_storage", "user_init"]
)
