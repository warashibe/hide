import { bind } from "nd"

import { Image, Text, Box, Flex, Button } from "rebass"
import useEventListener from "@use-it/event-listener"
import { ThemeProvider } from "emotion-theming"
import {
  isNil,
  gt,
  is,
  compose,
  sortBy,
  takeWhile,
  last,
  range,
  slice,
  map,
  complement,
  clone,
  not,
  filter,
  tap,
  when,
  equals,
  length,
  gte,
  always,
  ifElse,
  includes,
  __,
  prop,
} from "ramda"

import React, { useEffect, useState, Fragment } from "react"
const getElementOffset = element => {
  if (isNil(element)) {
    return { top: 0, left: 0 }
  }
  var de = document.documentElement
  var box = element.getBoundingClientRect()
  var top = box.top + window.pageYOffset - de.clientTop
  var left = box.left + window.pageXOffset - de.clientLeft
  return { top: top, left: left }
}

const offsetTop = () => {
  var supportPageOffset = window.pageXOffset !== undefined
  var isCSS1Compat = (document.compatMode || "") === "CSS1Compat"
  var scrollTop = supportPageOffset
    ? window.pageYOffset
    : isCSS1Compat
    ? document.documentElement.scrollTop
    : document.body.scrollTop
  return scrollTop
}

const TopMenu = ({
  islast = false,
  index = 1,
  isScroll = false,
  size = "xs",
  open,
  breakpoint,
  selected_border,
  regular_border,
  text_show,
  text_hide,
  TMENU = [],
  topnum,
  divnum,
  setter,
  user,
  showmore,
  catopen,
  chosen = null,
  bg_top = null,
  bg_side,
  React,
}) => {
  let i = 0
  let len = TMENU.length
  let tnum = TMENU.length

  TMENU = sortBy(v => {
    i += 1
    const rank = complement(isNil)(v.index) ? v.index : i + len
    return rank
  })(TMENU)
  const [scroll, setScroll] = useState(null)
  if (isScroll) {
    /*
    useEventListener("scroll", () => {
      const ids = pluck("key")(TMENU)
      const ot = offsetTop()
      const offsets = compose(
        takeWhile(
          compose(
            gt(ot + 51),
            key => {
              return getElementOffset(document.getElementById(key)).top
            }
          )
        )
      )(ids)
      const now = offsets.length === 0 ? null : last(offsets)
      if (scroll !== now) {
        setScroll(now)
      }
    })*/
  }
  const isBreak2 = open && breakpoint == 2
  const text_size =
    size === "xs" || isBreak2 ? "10px" : ["10px", null, "13px", "16px"]
  const text_width = size == "xs" || isBreak2 ? 1 : [1, 1, "auto"]
  const text_ml = size == "xs" || isBreak2 ? 0 : [0, 0, 2]
  const all_display =
    size === "xs"
      ? open && breakpoint == 1
        ? "none"
        : "flex"
      : open && breakpoint == 1
      ? "none"
      : "flex"
  const sx =
    open && breakpoint == 1
      ? { borderBottom: `${regular_border} 3px solid` }
      : {}
  const icon_gap = open && breakpoint == 1 ? "block" : "none"
  const isshow = showmore && index === 1 && !catopen ? true : false
  let tstart = (index - 1) * divnum
  let tend = tstart + divnum
  if (topnum >= tnum) {
    tend = tnum
  }
  if (isshow) {
    tend -= 1
  }
  let pad = []
  if (tend > tnum) {
    let hm = tend - tnum
    for (let i of range(0, hm)) {
      if (islast && hm - 1 === i) {
        pad.push(
          <Box
            display={all_display}
            title={text_hide || "HiÐe."}
            key="showmore"
            justifyContent="center"
            alignItems="center"
            flex={1}
            flexWrap="wrap"
            color={selected_border || "#198643"}
            sx={{
              textDecoration: "none",
              borderBottom: `${regular_border} 3px solid`,
              cursor: "pointer",
              ":hover": {
                opacity: 0.75,
              },
            }}
            onClick={() => {
              setter(!catopen, "catopen$nav")
            }}
          >
            <Flex justifyItems="center" mt={1}>
              <Box as="i" className="fas fa-angle-double-up" />
            </Flex>
            <Text
              mb={1}
              display={"block"}
              fontSize={text_size}
              width={text_width}
              ml={text_ml}
              sx={{ textAlign: "center" }}
            >
              {text_hide || "HiÐe."}
            </Text>
          </Box>
        )
      } else {
        pad.push(
          <Fragment>
            <Box flex={1} display={icon_gap} />
            <Box
              flex={1}
              sx={{
                borderBottom: `${regular_border} 3px solid`,
              }}
            />
          </Fragment>
        )
      }
    }
  }
  return (
    <Fragment>
      <Flex flex={1} bg={bg_top} color="#F7F4F6" sx={sx} id="nav">
        {compose(
          map(v => {
            const mcolor =
              chosen === v.key || scroll === v.key
                ? selected_border || "#198643"
                : regular_border || "#191919"
            const icolor =
              chosen === v.key || scroll === v.key ? mcolor : "#111"

            const extra = isNil(v.href)
              ? null
              : {
                  as: "a",
                  href: v.href,
                  target: v.target || "_blank",
                }

            return (
              <Box
                {...extra}
                display={all_display}
                title={v.text}
                id={`menu-${v.key}`}
                key={v.key}
                justifyContent="center"
                alignItems="center"
                flex={1}
                flexWrap="wrap"
                color={icolor}
                sx={{
                  textDecoration: "none",
                  borderBottom: `${mcolor} 3px solid`,
                  color: "#F7F4F6",
                  cursor: "pointer",
                  ":hover": {
                    opacity: 0.75,
                  },
                }}
                onClick={() => {
                  if (complement(isNil)(v.onClick)) {
                    v.onClick()
                  } else {
                    const x = getElementOffset(document.getElementById(v.key))
                    if (complement(isNil)(document.getElementById(v.key))) {
                      window.scrollTo({ top: x.top - 50, behavior: "smooth" })
                    }
                  }
                }}
              >
                <Flex justifyContent="center" alignItems="center">
                  {is(String, v.icon) ? (
                    <Image
                      mt={size === "xs" || breakpoint === 1 || isBreak2 ? 1 : 0}
                      src={
                        chosen === v.key && complement(isNil)(v.icon_hover)
                          ? v.icon_hover
                          : v.icon
                      }
                      width={v.size || "20px"}
                      height={v.size || "20px"}
                      sx={{
                        marginTop: v.marginTop || "0",
                      }}
                    />
                  ) : (
                    <Box
                      mt={[
                        1,
                        null,
                        open ? 1 : 0,
                        size === "xs" || breakpoint === 1 || isBreak2 ? 1 : 0,
                      ]}
                      as="i"
                      color={
                        !isNil(v.color)
                          ? v.color
                          : chosen === v.key
                          ? selected_border
                          : "#333"
                      }
                      fontSize="12px"
                      className={v.awesome_icon || "fas fa-home"}
                    />
                  )}
                </Flex>
                <Text
                  display={"block"}
                  fontSize={text_size}
                  width={text_width}
                  ml={text_ml}
                  color={
                    !isNil(v.color)
                      ? v.color
                      : chosen === v.key
                      ? selected_border
                      : "#333"
                  }
                  mb={[
                    1,
                    null,
                    open ? 1 : 0,
                    size === "xs" || breakpoint === 1 || isBreak2 ? 1 : 0,
                  ]}
                  sx={{
                    textAlign: "center",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {v.shorter || v.text}
                </Text>
              </Box>
            )
          }),
          slice(tstart, tend)
        )(TMENU)}
        {pad}
        {!isshow ? null : (
          <Fragment>
            <Box
              display={all_display}
              title={text_show || "Show"}
              key="showmore"
              justifyContent="center"
              alignItems="center"
              flex={1}
              flexWrap="wrap"
              color={selected_border}
              sx={{
                textDecoration: "none",
                borderBottom: `${regular_border} 3px solid`,
                cursor: "pointer",
                ":hover": {
                  opacity: 0.75,
                },
              }}
              onClick={() => {
                setter(!catopen, "catopen$nav")
              }}
            >
              <Flex justifyItems="center" mt={1}>
                <Box as="i" className="fas fa-angle-double-down" />
              </Flex>
              <Text
                mb={1}
                display={"block"}
                fontSize={text_size}
                width={text_width}
                ml={text_ml}
                sx={{ textAlign: "center" }}
              >
                {text_show || "Show"}
              </Text>
            </Box>
          </Fragment>
        )}
        {isNil(user) || catopen ? null : index !== 1 ? (
          islast ? (
            <Box
              display={all_display}
              title={text_hide || "HiÐe."}
              key="showmore"
              justifyContent="center"
              alignItems="center"
              width="50px"
              flexWrap="wrap"
              color={selected_border || "#198643"}
              sx={{
                textDecoration: "none",
                borderBottom: `${regular_border} 3px solid`,
                cursor: "pointer",
                ":hover": {
                  opacity: 0.75,
                },
              }}
              onClick={() => {
                setter(!catopen, "catopen$nav")
              }}
            >
              <Flex justifyItems="center" mt={1}>
                <Box as="i" className="fas fa-home" />
              </Flex>
              <Text
                mb={1}
                display={"block"}
                fontSize={text_size}
                width={text_width}
                ml={text_ml}
                color={selected_border || "#198643"}
                sx={{ textAlign: "center" }}
              >
                {text_hide || "HiÐe."}
              </Text>
            </Box>
          ) : (
            <Fragment>
              <Box flex={1} display={icon_gap} />
              <Box
                width={50}
                height={50}
                sx={{
                  borderBottom: `${regular_border} 3px solid`,
                }}
              />
            </Fragment>
          )
        ) : (
          <Fragment>
            <Box flex={1} display={icon_gap} />
            <Image
              title={user.name}
              src={user.image64 || user.image}
              width={50}
              height={50}
              sx={{
                cursor: "pointer",
                borderBottom: `${selected_border} 3px solid`,
              }}
            />
          </Fragment>
        )}
      </Flex>
    </Fragment>
  )
}

const makeSide = (num, props, fn) => {
  let cursor = props.cursor$nav
  let smenu = sortBy(prop("index"))(
    complement(isNil)(props.SMENU) ? clone(props.SMENU) : []
  )
  let leftover = props.bg_side || "#198643"
  if (isNil(num)) {
    smenu = []
  } else {
    const snum = smenu.length
    let end = cursor + num - 1
    smenu = slice(cursor, end)(smenu)
    let recover = null
    const many = num - 2
    if (cursor !== 0) {
      smenu.unshift({
        key: "up",
        awesome_icon: "fas fa-angle-double-up",
        color: props.regular_border || "#333",
        onClick: props => () => {
          let to
          if (cursor - many <= 0) {
            to = 0
          } else {
            to = cursor - many + 1
          }
          if (cursor !== to) {
            props.set(to, "cursor$nav")
          }
        },
      })
      recover = smenu.pop()
      end -= 1
    }
    if (end < snum) {
      leftover = props.regular_border || "#333"
      smenu.pop()
      smenu.push({
        key: "down",
        awesome_icon: "fas fa-angle-double-down",
        color: props.regular_border || "#333",
        onClick: props => () => {
          let to
          if (cursor + many * 2 - 1 >= snum) {
            to = snum - many
          } else {
            to = cursor + many - 1
            if (cursor == 0) {
              to += 1
            }
          }
          if (cursor !== to) {
            props.set(to, "cursor$nav")
          }
        },
      })
    } else if (end === snum) {
      smenu.push(recover)
    }
  }
  const sidemenu = compose(
    map(v => {
      let extra = {}
      if (v.href) {
        extra = {
          as: "a",
          href: v.href,
          target: v.target || "_blank",
          color: "white",
        }
      }
      const text = isNil(v.text) ? null : (
        <Flex
          flex={1}
          height="100%"
          justifyContent="left"
          alignItems={!isNil(v.progress) ? "center" : "center"}
          bg={v.color || props.bg_side || leftover}
        >
          {!isNil(v.progress) ? (
            <Box
              width={1}
              bg="#eee"
              height="15px"
              mr={15}
              sx={{ borderRadius: "10px" }}
            >
              <Flex
                width={v.progress[1] === 0 ? 0 : v.progress[0] / v.progress[1]}
                bg={v.progress[0] === 0 ? "#999" : "#5386E4"}
                height="15px"
                fontSize="10px"
                color="white"
                justifyContent="center"
                alignItems="center"
                sx={{
                  borderRadius: "10px",
                  transition: "width 1s",
                  minWidth: "50px",
                }}
              >
                {v.progress[1] !== 0 ? (
                  <Box>
                    {v.progress[0]} / {v.progress[1]}
                  </Box>
                ) : null}
              </Flex>
            </Box>
          ) : (
            <Text
              fontSize={props.side_fontSize || "16px"}
              fontWeight="bold"
              pr={3}
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {v.text}
            </Text>
          )}
        </Flex>
      )
      const isConpact = 3 > props.breakpoint$nav && props.open$nav === false
      const iconWidth = isNil(v.text)
        ? "100%"
        : isConpact
        ? 50
        : props.side_iconWidth || 50
      const setW = () => {
        props.set(false, "open$nav")
        fn.setPnum$nav(not(props.open$nav), props.breakpoint$nav)
      }
      const border = v.border
        ? `1px solid ${props.side_border_color || "#999"}`
        : null
      const text_color =
        props.side_selected === v.key
          ? props.side_selected_color || "#A2C856"
          : v.disabled
          ? "#555"
          : props.side_text_color || "#F7F4F6"
      return (
        <Flex
          {...extra}
          color={text_color}
          width="100%"
          height={props.side_height || 45}
          bg="#A4F4E7"
          justifyContent="left"
          onClick={v.disabled ? () => {} : v.onClick ? v.onClick(props) : setW}
          sx={{
            textDecoration: "none",
            borderBottom: border,
            cursor: v.disabled ? "default" : "pointer",
            ":hover": {
              opacity: v.disabled ? 1 : 0.75,
            },
          }}
          title={v.text}
        >
          <Flex
            onClick={!isNil(v.onClick_icon) ? v.onClick_icon : null}
            width={iconWidth}
            bg={v.color || props.bg_side || leftover}
            justifyContent="center"
            alignItems="center"
            sx={{
              position: "relative",
              cursor: !isNil(v.onClick_icon) ? "pointer" : "",
            }}
            color={v.icon_color || ""}
          >
            {!isNil(v.progress) ? (
              <Flex
                justifyContent="center"
                alignItems="center"
                fontSize="12px"
                fontWeight="bold"
                color={props.side_selected_color || "#A2C856"}
              >
                {v.progress[1] === 0
                  ? 0
                  : Math.round((v.progress[0] / v.progress[1]) * 100)}
                %
              </Flex>
            ) : isNil(v.icon) && isNil(v.awesome_icon) ? (
              <Flex
                bg={
                  props.side_selected === v.key
                    ? props.side_selected_color || "#A2C856"
                    : "#ddd"
                }
                sx={{
                  position: "absolute",
                  top: 0,
                  left: "calc(50% - 2px)",
                }}
                height="100%"
                width="4px"
              ></Flex>
            ) : is(String, v.icon) ? (
              <img src={v.icon} width="25px" height="25px" />
            ) : (
              <Box
                as="i"
                className={v.awesome_icon}
                sx={{
                  ":hover": { opacity: !isNil(v.onClick_icon) ? 0.75 : 1 },
                }}
              />
            )}
          </Flex>
          {text}
        </Flex>
      )
    }),
    filter(complement(isNil))
  )(smenu)
  return { leftover, sidemenu }
}

let to
const getInnerHeight = (outerElms, set) => {
  let missing = false
  let innerHeight = window.innerHeight
  for (const v of outerElms) {
    if (complement(isNil)(document.getElementById(v))) {
      innerHeight -= document.getElementById(v).offsetHeight || 0
    } else {
      missing = true
    }
  }
  set(innerHeight, "innerHeight$nav")
  if (missing) {
    clearTimeout(to)
    to = setTimeout(() => {
      getInnerHeight(outerElms, set)
    }, 500)
  }
}

export default bind(
  props => {
    const Side = props.Side
    const $ = props.$
    const set = props.set
    const fn = props.init(["setPnum$nav"])
    const side_width = props.side_width || 250
    const side_height = isNil(props.side_height) ? 45 : props.side_height
    const tnum = (props.TMENU || []).length
    const def = { color: "#eee" }
    const [num, setNum] = useState(null)
    const bp = props.bp || [
      "360px",
      "600px",
      "1010px",
      "1280px",
      "1600px",
      "1900px",
    ]
    const bp2 = props.bp2 || [0, 700, 1010]
    const bg_img_top = props.bg_img_top || null
    const bg_top = complement(isNil)(bg_img_top)
      ? null
      : props.bg_top || props.regular_border || "#191919"
    const selected_border = props.selected_border || "#03414D"
    const regular_border = props.regular_border || "#222"
    const closeNav = e => {
      set(false, "open$nav")
      set(false, "catopen$nav")
      fn.setPnum$nav(false, $.breakpoint$nav)
    }
    const checkBP = () => {
      let op = $.open$nav
      let _bp = $.breakpoint$nav
      let mainHeight = window.innerHeight
      set(window.innerHeight, "height$nav")
      mainHeight -= document.getElementById("nav").offsetHeight || 0
      set(mainHeight, "mainHeight$nav")
      if (complement(isNil)(props.outerElms)) {
        getInnerHeight(props.outerElms, set)
      }

      return compose(
        tap(() => {
          const new_num = Math.floor(window.innerHeight / side_height)
          if (num !== new_num) {
            set(0, "cursor$nav")
          }
          let sub = _bp === 1 || (_bp === 2 && !op) ? side_height : side_width
          if (!isNil($.user)) {
            sub += side_height
          }
          const topnum = Math.floor((window.innerWidth - sub) / 60)
          let showmore = false
          if (topnum < tnum) {
            showmore = true
          }
          if ($.showmore$nav !== showmore) {
            set(showmore, "showmore$nav")
          }
          if (!showmore && $.catopen$nav) {
            set(false, "catopen$nav")
          }
          const divnum = Math.ceil((tnum + 1) / Math.ceil((tnum + 1) / topnum))
          if ($.topnum$nav !== topnum) {
            set(topnum, "topnum$nav")
          }
          if ($.divnum$nav !== divnum) {
            set(divnum, "divnum$nav")
          }
          setNum(new_num)
          fn.setPnum$nav(op, _bp)
        }),
        when(complement(equals($.breakpoint$nav)), v => {
          set(v * 1, "breakpoint$nav")
          set(false, "open$nav")
          op = false
          _bp = v * 1
        }),
        length,
        takeWhile(gte(window.innerWidth))
      )(bp2)
    }
    useEventListener("resize", checkBP)
    useEffect(() => {
      checkBP()
    }, [props.SMENU])
    const onClick = () =>
      ifElse(includes(__, [null, 3]), always(null), () => {
        set(not($.open$nav), "open$nav")
        fn.setPnum$nav(not($.open$nav), $.breakpoint$nav)
      })($.breakpoint$nav)
    const menuWidth = $.open$nav ? side_width : [0, 0, 50, side_width]
    const topleftWidth = $.open$nav ? side_width : [50, 50, 50, side_width]
    const phWidth = $.open$nav
      ? $.breakpoint$nav === 1
        ? 0
        : $.breakpoint$nav === 2
        ? 50
        : side_width
      : [0, 0, 50, side_width]
    const mask =
      $.catopen$nav || (props.open$nav && includes($.breakpoint$nav)([1, 2]))
        ? "block"
        : "none"
    const extra =
      $.breakpoint$nav !== 3
        ? {
            cursor: "pointer",
            ":hover": {
              bg: regular_border,
              color: "#eee",
            },
          }
        : {}
    const icon = includes($.breakpoint$nav)([null, 3]) ? (
      <Image
        src={props.title_logo || "/static/images/icon-128x128.png"}
        width="35px"
        height="35px"
      />
    ) : (
      <Box
        as="i"
        className={`fas fa-angle-double-${$.open$nav ? "left" : "right"}`}
      />
    )
    const { leftover, sidemenu } = makeSide(num, props, fn)
    let extraTop = []
    let many = Math.ceil((tnum + 1) / $.topnum$nav)
    if (
      $.showmore$nav &&
      $.catopen$nav &&
      many > 1 &&
      !($.breakpoint$nav == 1 && $.open$nav)
    ) {
      for (let i of range(0, many - 1)) {
        let islast = many === i + 2
        extraTop.push(
          <Flex
            height={side_height}
            sx={{
              marginLeft:
                $.breakpoint$nav === 1 ||
                ($.breakpoint$nav === 2 && !$.open$nav)
                  ? "50px"
                  : `${side_width}px`,
              transitionPproperty: "width",
              transitionDuration: "0.5s",
            }}
          >
            <TopMenu
              bg_side={props.bg_side}
              selected_border={selected_border}
              regular_border={regular_border}
              bg_top={bg_top}
              chosen={props.chosen}
              islast={islast}
              index={i + 2}
              setter={set}
              divnum={$.divnum$nav}
              showmore={$.showmore$nav}
              catopen={$.catopen$nav}
              topnum={$.topnum$nav}
              isScroll={props.isScroll}
              size={props.size}
              open={$.open$nav}
              breakpoint={$.breakpoint$nav}
              TMENU={props.TMENU}
              user={$.user}
            />
          </Flex>
        )
      }
    }
    const side = (
      <Box
        width={menuWidth}
        color="#F7F4F6"
        bg={leftover}
        height="100%"
        sx={{
          zIndex: 100,
          left: 0,
          top: 0,
          position: "fixed",
          paddingTop: "50px",
          transitionPproperty: "width",
          transitionDuration: "0.5s",
          overflow: "hidden",
        }}
      >
        {!isNil(Side) && (props.open$nav || props.breakpoint$nav > 2) ? (
          <Side />
        ) : (
          sidemenu
        )}
      </Box>
    )
    const top = (
      <Box
        {...def}
        bg={bg_top}
        height={50}
        width="100%"
        sx={{
          left: 0,
          top: 0,
          position: "fixed",
          zIndex: 101,
          backgroundImage: bg_img_top,
        }}
      >
        <Flex height="100%">
          <Flex
            width={topleftWidth}
            sx={{
              transitionPproperty: "width",
              transitionDuration: "0.5s",
              borderBottom: `${selected_border} 3px solid`,
            }}
          >
            <Flex
              width={50}
              height={47}
              justifyContent="center"
              alignItems="center"
              sx={extra}
              fontSize="25px"
              color={props.icon_color || "#F0ECD4"}
              onClick={onClick}
            >
              {icon}
            </Flex>
            <Flex
              as="a"
              href={props.logo_link || "/"}
              flex={1}
              height="100%"
              justifyContent="left"
              alignItems="center"
              sx={{
                overflow: "hidden",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              <Text
                fontSize={props.fontSize || "21px"}
                fontWeight="bold"
                px="5px"
                color="#F0ECD4"
              >
                <Box
                  as="span"
                  style={{ color: props.pre_title_color || "#198643" }}
                  mr={1}
                >
                  {complement(isNil)(props.pre_title)
                    ? props.pre_title
                    : "Next"}
                </Box>
                <Box
                  as="span"
                  style={{ color: props.post_title_color || "#F0ECD4" }}
                >
                  {complement(isNil)(props.post_title)
                    ? props.post_title
                    : "Dapp"}
                </Box>
              </Text>
            </Flex>
          </Flex>
          <TopMenu
            React={props.React}
            bg_side={props.bg_side}
            regular_border={props.regular_border}
            selected_border={selected_border}
            chosen={props.chosen}
            divnum={$.divnum$nav}
            setter={set}
            index={1}
            showmore={$.showmore$nav}
            catopen={$.catopen$nav}
            topnum={$.topnum$nav}
            isScroll={props.isScroll}
            size={props.size}
            open={$.open$nav}
            breakpoint={$.breakpoint$nav}
            TMENU={props.TMENU}
            user={$.user}
          />
        </Flex>
        {extraTop}
      </Box>
    )
    const cover = (
      <Box
        display={mask}
        height="100%"
        pt="50px"
        bg="#222"
        color="#eee"
        width="100%"
        sx={{
          zIndex: 99,
          opacity: 0.7,
          position: "fixed",
          top: 0,
          left: 0,
          cursor: "pointer",
        }}
        onClick={closeNav}
      />
    )

    const modal = (
      <Flex sx={{ height: "100%" }}>
        <Box
          width={phWidth}
          {...def}
          sx={{
            transitionPproperty: "width",
            transitionDuration: "0.5s",
          }}
        />
        <Box flex={1} pt="50px" id="main_area" sx={{ height: "100%" }}>
          <Box
            onClick={() => {
              set(false, "showModal$nav")
            }}
            height="100%"
            bg="rgba(0,0,0,0.75)"
            mt="50px"
            width={1}
            sx={{
              display: $.showModal$nav ? "flex" : "none",
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 98,
              cursor: "pointer",
            }}
            justifyContent="center"
            alignItems="center"
          >
            <Box
              width={["300px", null, "500px"]}
              bg="white"
              ml={$.breakpoint$nav === 3 || $.open$nav ? `${side_width}px` : 0}
              sx={{
                borderRadius: "5px",
                position: "relative",
                cursor: "default",
              }}
              pt={4}
              px={3}
              pb={3}
              onClick={e => {
                e.stopPropagation()
              }}
            >
              <Box
                sx={{
                  textAlign: "right",
                  position: "absolute",
                  top: 0,
                  right: 0,
                }}
                p={2}
                color="tomato"
              >
                <Box as="i" className="fas fa-home" />
              </Box>
              {$.modalContent$nav}
            </Box>
          </Box>
          <Box
            onClick={() => {
              set(false, "showModal_send$nav")
            }}
            height="100%"
            bg="rgba(0,0,0,0.75)"
            mt="50px"
            width={1}
            sx={{
              display: $.showModal_send$nav ? "flex" : "none",
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 98,
              cursor: "pointer",
            }}
            justifyContent="center"
            alignItems="center"
          >
            <Box
              width={["300px", null, "500px"]}
              bg="white"
              ml={$.breakpoint$nav === 3 || $.open$nav ? `${side_width}px` : 0}
              sx={{
                borderRadius: "5px",
                position: "relative",
                cursor: "default",
              }}
              pt={4}
              px={3}
              pb={3}
              onClick={e => {
                e.stopPropagation()
              }}
            >
              <Box
                sx={{
                  textAlign: "right",
                  position: "absolute",
                  top: 0,
                  right: 0,
                }}
                p={2}
                color="tomato"
              >
                <Box as="i" className="fas fa-home" />
              </Box>
            </Box>
          </Box>
          <Flex
            width={1}
            sx={{ height: "100%", position: "relative" }}
            flexDirection="column"
          >
            {props.children}
          </Flex>
        </Box>
      </Flex>
    )
    return (
      <ThemeProvider theme={{ breakpoints: bp }}>
        <style global jsx>{`
          html,
          body {
            height: 100%;
          }
          #__next {
            height: 100%;
          }
        `}</style>
        {cover}
        <Flex key={props.updated || null}>
          {side}
          {top}
        </Flex>
        {modal}
      </ThemeProvider>
    )
  },
  [
    "open$nav",
    "breakpoint$nav",
    "cursor$nav",
    "catopen$nav",
    "topnum$nav",
    "divnum$nav",
    "showmore$nav",
    "showModal$nav",
    "showModal_send$nav",
    "modalContent$nav",
    "innerHeight$nav",
    "mainHeight$nav",
    "user",
  ]
)
