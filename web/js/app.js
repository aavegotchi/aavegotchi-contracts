import builders from './webscript.modern.js'
import createDOMElement from './createDOMElement.modern.js'
import processClasses from './runcss.modern.js'
import { ethers } from './ethers-5.0.esm.min.js'

// A Web3Provider wraps a standard Web3 provider, which is
// what Metamask injects as window.ethereum into each page
const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()
const abi = [
  'function mintAavegotchi(bytes32)',
  'function getAavegotchi(uint) view returns (string memory)',
  'function getFirstTokenId(address)',
  'function mintWearables()',
  'function balanceOf(address,uint)',
  'function transferToParent(address,address,uint,uint,uint)',
  'function transferFromParent(address,uint,address,uint,uint)',
  'function transferAsChild(address,uint,address,uint,uint,uint)'
]
// const address = '0x201Df88D8d79ACA0AA6360F02eb9dD8aefdB1dfb'
const address = '0x7c2C195CD6D34B8F845992d380aADB2730bB9C6F'
const agr = new ethers.Contract(address, abi, provider)
const agw = agr.connect(signer)

// Integrating RunCSS with Webscript
function createElement (type, props, ...children) {
  if (props.class) {
    processClasses(props.class)
  }
  return createDOMElement(type, props, ...children)
}

const { div, body } = builders(createElement)

async function main () {
  const svgDiv = div.class`flex-1``Switch to the Kovan Network`
  svgDiv.innerHTML = await agr.getAavegotchi(0)

  const app = div.class`container mx-auto`(
    div.class`flex justify-center`(
      svgDiv,
      div.class`flex-1 border-2 ``test here`
    )
  )
  document.body = body(app)
}

main().then(result => {
  console.log('success')
}, error => {
  document.body = body(div.class`text-4xl container mx-auto text-center mt-30``Switch to the Kovan Network`)
  console.log('yikers: ' + error)
})
