import moment from "moment"
moment.locale("ja")
import { conf } from "nd"
import {
  filter,
  assoc,
  map,
  groupBy,
  compose,
  values,
  mergeRight,
  range,
  pick,
  concat,
  prop,
  indexBy,
  clone,
  sortBy,
  isNil,
  includes,
} from "ramda"

export const comment_map_parent = {
  get: atoms => ({ get }) => {
    let selected = get(atoms.comment_selected)
    let _cmap = clone(get(atoms._comment_map))
    let _pmap = compose(
      map(sortBy(v => v.date * 1)),
      groupBy(prop("parent")),
      values
    )(_cmap)
    let cmap = {}
    let pmap = {}
    const _get = obj => {
      for (let v of obj) {
        if (!isNil(_pmap[v.id])) {
          pmap[v.id] = _pmap[v.id]
          cmap[v.id] = v
          _get(_pmap[v.id])
        }
      }
    }
    if (!isNil(selected)) {
      if (!isNil(_pmap[selected])) {
        pmap[selected] = _pmap[selected]
        _get(_pmap[selected])
      }
      cmap[_cmap[selected].reply_to] = _cmap[_cmap[selected].reply_to]
    } else {
      cmap = _cmap
      pmap = _pmap
    }
    for (let k in pmap) {
      let current_arr = pmap[k]
      let pid = current_arr[0].parent
      let pp = pmap[pid]
      if (isNil(cmap[pid])) continue
      let parent_id = cmap[pid].parent
      let ppp = pmap[parent_id]
      if (
        !isNil(parent_id) &&
        !isNil(pp) &&
        !isNil(ppp) &&
        ppp[ppp.length - 1].id === current_arr[0].parent &&
        !isNil(cmap[parent_id])
      ) {
        pmap[ppp[0].parent] = concat(
          ppp,
          clone(
            compose(
              map(v2 => {
                cmap[v2.id].parent = ppp[0].parent
                return assoc("parent", ppp[0].parent)(v2)
              }),
              filter(v2 => !isNil(cmap[v2.id]))
            )(current_arr)
          )
        )
        delete pmap[k]
      }
    }
    return pmap
  },
}
