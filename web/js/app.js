import builders from './webscript.modern.js'
import createDOMElement from './createDOMElement.modern.js'
import createSVGElement from './createSVGElement.modern.js'
import processClasses from './runcss.modern.js'
import { ethers } from './ethers-5.0.esm.min.js'

// A Web3Provider wraps a standard Web3 provider, which is
// what Metamask injects as window.ethereum into each page
const provider = new ethers.providers.Web3Provider(window.ethereum)
const abi = ['function getAavegotchi(uint) view returns (string memory)']
const address = '0x201Df88D8d79ACA0AA6360F02eb9dD8aefdB1dfb'
const aavegotchiNFT = new ethers.Contract(address, abi, provider)

// Integrating RunCSS with Webscript
function createElement (type, props, ...children) {
  if (props.class) {
    processClasses(props.class)
  }
  return createDOMElement(type, props, ...children)
}

const { div, body } = builders(createElement)

// const { svg } = builders(createSVGElement)

const svgDiv = div.class`max-w-xl mx-auto mt-5``Switch to Kovan Network`

const app = div.class`container mx-auto`(
  svgDiv
)

document.body = body(app)

aavegotchiNFT.getAavegotchi(0).then(result => {
  svgDiv.innerHTML = result
}, error => {
  console.log('yikers: ' + error)
})
