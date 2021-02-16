let props = {}
const mergeProps = (name, obj, core = false, namespace = null) => {
  for (const k in obj) {
    props[`${k}${namespace !== null ? `$${namespace}` : core ? "" : `$${name}`}`] = obj[k]
  }
}
import { init as util } from "nd/util"
mergeProps("util", util, true, null)
export default props