import builders from './webscript.modern.js'
import createDOMElement from './createDOMElement.modern.js'
import processClasses from './runcss.modern.js'
import { ethers } from './ethers-5.0.esm.min.js'

window.ethereum.enable()
window.ethereum.autoRefreshOnNetworkChange = false

window.ethereum.on('chainChanged', (_chainId) => window.location.reload())

let biconomy
if (window.Biconomy) {
  const Biconomy = window.Biconomy
  biconomy = new Biconomy(window.ethereum, { apiKey: 'ebjORzwPD.cd328a46-712c-4bdf-89f7-80ff90e942a3' })
}

// A Web3Provider wraps a standard Web3 provider, which is
// what Metamask injects as window.ethereum into each page
// const provider = new ethers.providers.Web3Provider(biconomy)
import Biconomy from "@biconomy/mexa";
biconomy = new Biconomy(window.ethereum, { apiKey: 'ebjORzwPD.cd328a46-712c-4bdf-89f7-80ff90e942a3' })
const provider = new ethers.providers.Web3Provider(biconomy)
const signer = provider.getSigner()

const abi = [
  'function buyPortals(address _to, uint256 _ghst) external',
  'function ghstAddress() external view returns (address contract_)'
]
// const address = '0x201Df88D8d79ACA0AA6360F02eb9dD8aefdB1dfb'
// const contractAddress = '0x187DffAef821d03055aC5eAa1524c53EBB36eA97'
// const contractAddress = '0x10E79E279a6cfEEf54428091Dc22da04f49d1E0b'
// const contractAddress = '0x9bD39B5b30ec0880e9b702c6148F1E77EE9e74D2'
const contractAddress = '0x709eB50473bDd050F671aBc277606Bf93eafF065'

const agr = new ethers.Contract(contractAddress, abi, provider)
const agw = agr.connect(signer)

const ghstABI = [
  'function approve(address _spender, uint256 _value) public returns (bool success)',
  'function balanceOf(address _owner) public view returns (uint256 balance)'
]
const ghstAddress = '0x20d0A1ce31f8e8A77b291f25c5fbED007Adde932'
const ghstr = new ethers.Contract(ghstAddress, ghstABI, provider)
const ghstw = ghstr.connect(signer)

// Integrating RunCSS with Webscript
function createElement (type, props, ...children) {
  if (props.class) {
    processClasses(props.class)
  }
  return createDOMElement(type, props, ...children)
}

const { div, body, button, span, a } = builders(createElement)

// Anytime something changes this function gets called to refresh what is shown
// on the webpage.
async function main () {
  const app = div.class`container mx-auto`(
    div.class`mt-50 w-500 mx-auto`(
      button
        .type`button`
        .class`inline-flex items-center px-3 py-2 border border-transparent text-base leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150`
        .onclick(async e => {
          // await agw.buyPortals(signer.getAddress(), ethers.utils.parseEther('500'))
          await ghstw.approve(contractAddress, ethers.utils.parseEther('50000000'))
          // await agw.mintWearables()
          // svgDiv.replaceWith(wait)
          console.log('cool man')
        })`Approve`,
      div.class`mt-5`(
        button
          .type`button`
          .class`inline-flex items-center px-3 py-2 border border-transparent text-base leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150`
          .onclick(async e => {
            console.log('Address:', await signer.getAddress())
            const bal = await ghstr.balanceOf(await signer.getAddress())
            console.log('balance:', ethers.utils.formatEther(bal))
            const ghstAdd = agr.
            await agw.buyPortals(await signer.getAddress(), ethers.utils.parseEther('10'))
            // await agw.mintWearables()
            // svgDiv.replaceWith(wait)
            console.log('cool man')
          })`Buy Portals`
      )
    )
  )
  document.body = body(app)
}

function runMain () {
  console.log('Chain id:', window.ethereum.chainId)
  // Check if we are on Kovan network
  if (window.ethereum.chainId === '0x13881') {
    main().then(result => {
    // console.log('success')
    }, error => {
      console.log('yikers: ' + error)
    })
  } else {
    document.body = body(div.class`text-4xl container mx-auto text-center mt-30``Switch to the Mumbai Network`)
  }
}

runMain()
