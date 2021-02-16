import React from "react"
import ReactDOM from "react-dom"
import { Box } from "rebass"
import { isNil } from "ramda"

const __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {}
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p]
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (
          e.indexOf(p[i]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(s, p[i])
        )
          t[p[i]] = s[p[i]]
      }
    return t
  }

export const Button = React.forwardRef((_a, ref) => {
  const { className, active, reversed } = _a,
    props = __rest(_a, ["className", "active", "reversed"])
  return (
    <Box
      as="span"
      {...props}
      sx={{
        cursor: "pointer",
        color: reversed
          ? active
            ? "white"
            : "#aaa"
          : active
          ? "#5386E4"
          : "#ccc",
      }}
    />
  )
})

export const Icon = ({ className, text }) => {
  return !isNil(text) ? (
    <Box as="span" mx={[1, 2]} fontWeight="bold">
      {text}
    </Box>
  ) : (
    <Box as="i" className={className} mx={[1, 2]} fontSize="16px" />
  )
}
