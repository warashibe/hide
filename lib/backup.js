import crypto from "crypto"
import { compose, assoc, clone, filter, isNil, map, values, pick } from "ramda"
import { PrivateKey, Buckets, Identity } from "@textile/hub"
import { BigNumber, providers, utils } from "ethers"
import lf from "localforage"
import { popNote, getDLJson } from "./main"
import Web3Modal from "web3modal"
import WalletConnectProvider from "@walletconnect/web3-provider"

const getProvider = async conf => {
  //const Torus = require("@toruslabs/torus-embed")
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: conf.infura.id,
      },
    },
    /*torus: {
      package: Torus,
    },*/
  }
  const web3Modal = new Web3Modal({
    providerOptions,
  })
  let provider
  try {
    provider = await web3Modal.connect()
  } catch (e) {}
  return isNil(provider) ? null : new providers.Web3Provider(provider)
}

const getSigner = async conf => {
  const provider = await getProvider(conf)
  if (isNil(provider)) {
    throw new Error(
      "Ethereum is not connected. Please download Metamask from https://metamask.io/download.html"
    )
  }
  const signer = provider.getSigner()
  return signer
}

async function getAddressAndSigner(conf) {
  const signer = await getSigner(conf)
  const address = await signer.getAddress()
  return { address, signer }
}

const generateMessage = (ethereum_address, application_name) =>
  "******************************************************************************** \n" +
  "READ THIS MESSAGE CAREFULLY. \n" +
  "DO NOT SHARE THIS SIGNED MESSAGE WITH ANYONE OR THEY WILL HAVE READ AND WRITE \n" +
  "ACCESS TO THIS APPLICATION. \n" +
  "DO NOT SIGN THIS MESSAGE IF THE FOLLOWING IS NOT TRUE OR YOU DO NOT CONSENT \n" +
  "TO THE CURRENT APPLICATION HAVING ACCESS TO THE FOLLOWING APPLICATION. \n" +
  "******************************************************************************** \n" +
  "The Ethereum address used by this application is: \n" +
  "\n" +
  ethereum_address.toLowerCase() +
  "\n" +
  "\n" +
  "\n" +
  "By signing this message, you authorize the current application to use the \n" +
  "following app associated with the above address: \n" +
  "\n" +
  application_name +
  "\n" +
  "\n" +
  "\n" +
  "******************************************************************************** \n" +
  "ONLY SIGN THIS MESSAGE IF YOU CONSENT TO THE CURRENT PAGE ACCESSING THE KEYS \n" +
  "ASSOCIATED WITH THE ABOVE ADDRESS AND APPLICATION. \n" +
  "AGAIN, DO NOT SHARE THIS SIGNED MESSAGE WITH ANYONE OR THEY WILL HAVE READ AND \n" +
  "WRITE ACCESS TO THIS APPLICATION. \n" +
  "******************************************************************************** \n"

export const connectHub = async ({ val: {}, set, conf, fn, get }) => {
  try {
    const metamask = await getAddressAndSigner(conf)
    await set(true, "connecting_ipfs")
    const message = generateMessage(
      metamask.address,
      conf.textile.application_name
    )
    const signedText = await metamask.signer.signMessage(message)
    const hash = utils.keccak256(signedText)
    if (hash === null) {
      throw new Error(
        "No account is provided. Please provide an account to this application."
      )
    }
    const array = hash
      .replace("0x", "")
      .match(/.{2}/g)
      .map(hexNoPrefix => BigNumber.from("0x" + hexNoPrefix).toNumber())
    if (array.length !== 32) {
      throw new Error(
        "Hash of signature is not the correct size! Something went wrong!"
      )
    }
    const identity = PrivateKey.fromRawEd25519Seed(Uint8Array.from(array))
    const auth = pick(["key", "secret"])(conf.textile)
    const buckets = await Buckets.withKeyInfo(auth)
    await buckets.getToken(identity)
    const result = await buckets.getOrCreate("hideaki", { encrypted: true })
    if (!result.root) {
      throw new Error("Failed to open bucket")
    }
    const bucketKey = result.root.key
    const item = await buckets.listPath(bucketKey, "./")
    await set(
      filter(v => v.name.split(".").pop() === "json")(item.item.items),
      "backup_items"
    )
    await set(false, "connecting_ipfs")
    return {
      buckets,
      bucketKey,
      item,
      address: metamask.address,
    }
  } catch (e) {
    console.log(e)
    await fn(popNote)({ text: (await get("lang")).wrong })
    await set(false, "connecting_ipfs")
    return null
  }
}

export const backupCurrentData = async ({ fn, get, set, val: { hub } }) => {
  let json = await getDLJson(set)
  const fileType = "application/json"
  const fileName = `hide_${json.id}_${json.date}.json`
  json.backup = Date.now()
  const file = {
    path: `/${json.id}.json`,
    content: Buffer.from(JSON.stringify(json)),
  }
  await hub.buckets.pushPath(hub.bucketKey, `${json.id}.json`, file)
  await lf.setItem("backup", json.backup)
  const item = await hub.buckets.listPath(hub.bucketKey, "./")
  await set(
    compose(
      map(v => {
        return v.name !== item.name ? v : assoc("backup", json.backup)
      }),
      filter(v => v.name.split(".").pop() === "json")
    )(item.item.items),
    "backup_items"
  )
  await set(json.backup, "backup")
  await fn(popNote)({ text: (await get("lang")).saved })
}

export const fetchBackupData = async ({ fn, get, set, val: { item, hub } }) => {
  const pullResult = hub.buckets.pullPath(hub.bucketKey, item.name)
  let buffer = ""
  for await (const chunk of pullResult) {
    for (var i = 0; i < chunk.length; i++) {
      buffer += String.fromCharCode(chunk[i])
    }
  }
  await set(
    map(v => (v.name !== item.name ? v : assoc("json", JSON.parse(buffer))(v)))(
      get("backup_items")
    ),
    "backup_items"
  )
}

export const removeBackupData = async ({
  fn,
  get,
  set,
  val: { item, hub },
}) => {
  const pullResult = hub.buckets.removePath(hub.bucketKey, item.name)
  const _item = await hub.buckets.listPath(hub.bucketKey, "./")
  await set(
    filter(v => v.name !== item.name)(get("backup_items")),
    "backup_items"
  )
  await fn(popNote)({ text: (await get("lang")).saved })
}
