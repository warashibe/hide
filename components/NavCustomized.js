import { Fragment, useEffect } from "react"
import url from "url"
import { bind } from "nd"
import { isNil, map, clone, mergeLeft } from "ramda"
import Nav from "components/Nav"
import { ThemeProvider } from "@emotion/react"
import preset from "@rebass/preset"

import moment from "moment"
require("moment-timezone")

export default bind(
  ({
    $,
    set,
    init,
    conf,
    router,
    children,
    smenu,
    tmenu,
    chosen,
    logo_link,
    side_selected,
    side_iconWidth,
    fontSize,
    side_fontSize,
    side_height,
    side_width,
    pre_title,
    post_title,
    Side,
    noNav,
    get,
    noComment,
  }) => {
    const fn = init(["setUserLang", "initialize", "checkNotifications"])
    useEffect(() => {
      if (
        $.user_init &&
        isNil($.user) &&
        url.parse(location.href).path !== "/settings"
      ) {
        location.href = "/settings"
      }
    }, [$.user_init])
    useEffect(() => {
      fn.initialize()
    }, [])
    useEffect(() => {
      ;(async () => {
        if (!isNil($.user)) {
          fn.setUserLang({ user: $.user })
          fn.checkNotifications({ user: $.user })
          moment.locale($.user.lang)
        }
      })()
    }, [$.user])

    if (isNil(smenu)) {
      smenu = []
    } else {
      smenu = clone(smenu)
    }
    smenu.unshift({
      index: 0.1,
      text: $.lang._blog,
      key: `blogs`,
      awesome_icon: `fas fa-rss`,
      href: "/",
      target: "_self",
    })
    smenu.unshift({
      index: 0.15,
      text: $.lang._magazines,
      key: `magazines`,
      awesome_icon: `fas fa-book-open`,
      href: "/magazines",
      target: "_self",
    })
    smenu.unshift({
      index: 0.16,
      text: $.lang.users,
      key: `users`,
      awesome_icon: `fas fa-users`,
      href: "/users",
      target: "_self",
      border: true,
    })

    if ($.user_init) {
      if (!isNil($.user)) {
        smenu.unshift({
          index: 0.205,
          text: $.lang.mypage,
          key: `your_page`,
          awesome_icon: `fas fa-home`,
          href: `/user?id=${$.user.uid}`,
          target: "_self",
        })
        smenu.unshift({
          index: 0.21,
          text: $.lang.blog,
          key: `your_blogs`,
          awesome_icon: `fas fa-rss`,
          href: `/user-articles?id=${$.user.uid}`,
          target: "_self",
        })
        smenu.unshift({
          index: 0.22,
          text: $.lang.magazines,
          key: `your_magazines`,
          awesome_icon: `fas fa-book-open`,
          href: `/user-magazines?id=${$.user.uid}`,
          target: "_self",
        })

        smenu.unshift({
          index: 0.3,
          text: $.lang.comments,
          key: `comments`,
          awesome_icon: `fas fa-comments`,
          href: "/comments",
          target: "_self",
        })
        smenu.push({
          index: 3,
          text: $.lang.manage_data,
          key: `backup`,
          awesome_icon: `far fa-hdd`,
          href: "/settings",
          target: "_self",
        })
      }
    }
    if (isNil(tmenu)) {
      tmenu = []
      if ($.user_init && !isNil($.user)) {
        tmenu.push({
          index: 3,
          text: $.lang.blog,
          key: `top-blog`,
          awesome_icon: `fas fa-rss`,
          href: `/user-articles?id=${$.user.uid}`,
          target: "_self",
        })
        tmenu.push({
          index: 3.5,
          text: $.lang.magazines,
          key: `top-magazines`,
          awesome_icon: `fas fa-book-open`,
          href: `/user-magazines?id=${$.user.uid}`,
          target: "_self",
        })
      }
      tmenu.push({
        index: 3.6,
        text: $.lang.create_article,
        key: `top-edit`,
        awesome_icon: `fas fa-edit`,
        href: "/articles/edit",
        target: "_self",
      })
      tmenu.push({
        index: 3.7,
        text: $.lang.create_magazine,
        key: `top-edit-magazine`,
        awesome_icon: `fas fa-edit`,
        href: "/magazines/edit",
        target: "_self",
      })
    } else {
      tmenu = clone(tmenu)
    }
    let backups = []
    if (!isNil($.user) && !isNil($.user.backup)) {
      backups.push({ id: "main", type: "remote", backup: $.user.backup })
    }
    if (noComment !== true) {
      if ($.isNotifications) {
        tmenu.unshift({
          index: -10,
          color: "#F44E3B",
          text: $.lang.notifications,
          key: `top-notifications`,
          awesome_icon: `fas fa-bell`,
          href: "/comments",
          target: "_self",
        })
      }
    }
    return (
      <ThemeProvider theme={preset}>
        <Fragment>
          <style global jsx>{`
            html {
              height: 100%;
            }
            body {
              height: 100%;
            }
            #__next {
              height: 100%;
              font-family: "M PLUS 1p", sans-serif;
            }
          `}</style>

          {noNav ? (
            children
          ) : (
            <Nav
              side_iconWidth={side_iconWidth || 50}
              chosen={chosen || null}
              side_selected={side_selected || null}
              side_height={side_height || 45}
              side_width={side_width || null}
              icon_color={"#5386E4"}
              post_title={
                post_title ||
                ($.data_storage === "localforage" ? "Offline" : "Top")
              }
              logo_link={logo_link || "/"}
              size="sx"
              TMENU={tmenu}
              SMENU={smenu}
              side_selected_color="#5386E4"
              pre_title={pre_title || "HiÐe."}
              pre_title_color={"#ccc"}
              post_title_color={"#5386E4"}
              Side={Side}
              fontSize={fontSize || "24px"}
              side_fontSize={side_fontSize || "16px"}
              bg_side="#ccc"
              side_text_color="#444"
              selected_border={"#5386E4"}
              regular_border="#aaa"
              bg_top="white"
              title_logo="/static/images/logo.png"
            >
              {children}
            </Nav>
          )}
        </Fragment>
      </ThemeProvider>
    )
  },
  [
    "user",
    "isFB",
    "lang",
    "user_init",
    "data_storage",
    "user_init_remote",
    "isNotifications",
  ]
)
