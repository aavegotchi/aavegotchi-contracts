import builders from './webscript.modern.js'
import createDOMElement from './createDOMElement.modern.js'
import processClasses from './runcss.modern.js'
import { ethers } from './ethers-5.0.esm.min.js'

// A Web3Provider wraps a standard Web3 provider, which is
// what Metamask injects as window.ethereum into each page
const provider = new ethers.providers.Web3Provider(window.ethereum)
const abi = [
  'function mintAavegotchi(bytes32)',
  'function getAavegotchi(uint) view returns (string memory)',
  'function mintWearables()',
  'function transferToParent(address,address,uint,uint,uint)',
  'function transferFromParent(address,uint,address,uint,uint)',
  'function transferAsChild(address,uint,address,uint,uint,uint)'
]
const address = '0x201Df88D8d79ACA0AA6360F02eb9dD8aefdB1dfb'
const ag = new ethers.Contract(address, abi, provider)

// Integrating RunCSS with Webscript
function createElement (type, props, ...children) {
  if (props.class) {
    processClasses(props.class)
  }
  return createDOMElement(type, props, ...children)
}

const { div, body } = builders(createElement)

async function main () {
  const svgDiv = div.class`max-w-xl mx-auto mt-5`(
    await ag.getAavegotchi(0)
  )

  const app = div.class`container mx-auto`(
    svgDiv
  )
  document.body = body(app)
}

main().then(result => {
  console.log('success')
}, error => {
  console.log('yikers: ' + error)
})
