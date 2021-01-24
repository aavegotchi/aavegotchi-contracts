import builders from './webscript.modern.js'
import createDOMElement from './createDOMElement.modern.js'
import processClasses from './runcss.modern.js'
import { ethers } from './ethers-5.0.esm.min.js'

window.ethereum.enable()
window.ethereum.autoRefreshOnNetworkChange = false

window.ethereum.on('chainChanged', (_chainId) => window.location.reload())

// A Web3Provider wraps a standard Web3 provider, which is
// what Metamask injects as window.ethereum into each page
const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()

const abi = [
  'function mintAavegotchi(bytes32)',
  'function getAavegotchiSVG(uint) view returns (string memory)',
  'function getFirstAavegotchi(address) external view returns (uint tokenId, string memory svg)',
  'function mintWearables()',
  'function wearablesBalances(address _account) external view returns (uint[] memory bals)',
  'function balanceOfToken(address _tokenContract, uint _tokenId, uint _id) external view returns (uint256 value)',
  'function transferToParent(address,address,uint,uint,uint)',
  'function transferFromParent(address,uint,address,uint,uint)',
  'function transferAsChild(address,uint,address,uint,uint,uint)',
  'event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value)'
]
// const address = '0x201Df88D8d79ACA0AA6360F02eb9dD8aefdB1dfb'
const contractAddress = '0x187DffAef821d03055aC5eAa1524c53EBB36eA97'
// const contractAddress = '0x10E79E279a6cfEEf54428091Dc22da04f49d1E0b'

const agr = new ethers.Contract(contractAddress, abi, provider)
const agw = agr.connect(signer)

// Integrating RunCSS with Webscript
function createElement (type, props, ...children) {
  if (props.class) {
    processClasses(props.class)
  }
  return createDOMElement(type, props, ...children)
}

const { div, body, button, span, a } = builders(createElement)

function wearableId (id) {
  return ethers.BigNumber.from(id).mul(ethers.BigNumber.from(2).pow(240))
}

// Anytime something changes this function gets called to refresh what is shown
// on the webpage.
async function main () {
  const accountAddress = await signer.getAddress()
  const [[tokenId, svg], wearableBalances] = await Promise.all([
    agr.getFirstAavegotchi(accountAddress),
    agr.wearablesBalances(accountAddress)
  ])
  const tokenExists = svg.length > 0
  let tokenHatBalance = 0
  let tokenPantsBalance = 0
  let tokenStickBalance = 0
  if (tokenExists) {
    // Get the account's wearable balance for each wearable
    ;[tokenHatBalance, tokenPantsBalance, tokenStickBalance] = await Promise.all([
      agr.balanceOfToken(contractAddress, tokenId, wearableId(1)),
      agr.balanceOfToken(contractAddress, tokenId, wearableId(2)),
      agr.balanceOfToken(contractAddress, tokenId, wearableId(3))
    ])
    tokenHatBalance = tokenHatBalance.toNumber()
    tokenPantsBalance = tokenPantsBalance.toNumber()
    tokenStickBalance = tokenStickBalance.toNumber()
  }

  // Display and logic to mint a new aavegotchi
  const svgDiv = div.class`flex-1 text-4xl text-center`(
    div.class`mt-38`(
      span.class`inline-flex rounded-md shadow-sm`(
        button
          .type`button`
          .class`inline-flex items-center px-3 py-2 border border-transparent text-base leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150`
          .onclick(async e => {
            let svgLayers = [0, 1, 2, 3, 5]
            svgLayers = svgLayers.map(value => {
              value = ethers.utils.hexlify(value)
              value = value.slice(2)
              if (value.length === 2) {
                value = '00' + value
              }
              return value
            })
            svgLayers = '0x' + svgLayers.join('').padEnd(64, '0')
            await agw.mintAavegotchi(svgLayers)
            svgDiv.append(div`Waiting for transaction.... Please wait.`)
          })`Mint Aavegotchi`
      )
    ))

  if (svg.length > 0) {
    svgDiv.innerHTML = svg
  }
  const wearableButtonClassActive = 'inline-flex items-center px-3 py-2 border border-transparent text-base leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150'
  const wearableButtonClassDisabled = 'cursor-not-allowed inline-flex items-center px-3 py-2 border border-transparent text-base leading-4 font-medium rounded-md text-white bg-indigo-200 focus:outline-none'

  const wait = div.class`flex-1 mt-40 text-4xl text-center``Waiting for transaction.... Please wait.`

  const app = div.class`container mx-auto`(
    div.class`flex justify-center text-xl`(
      svgDiv,
      // display the wearable balances for an account and wearable minting logic
      div.class`flex-1 mt-18`(
        div`Farmer Hats: ${wearableBalances[0]}`,
        div`Farmer Pants: ${wearableBalances[1]}`,
        div`Farmer Sticks: ${wearableBalances[2]}`,
        div.class`mt-2`(
          span.class`inline-flex rounded-md shadow-sm`(
            button
              .type`button`
              .class`inline-flex items-center px-3 py-2 border border-transparent text-base leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150`
              .onclick(async e => {
                await agw.mintWearables()
                svgDiv.replaceWith(wait)
              })`Mint Wearables`
          )
        ),
        // display the wearable buttons and logic for adding/removing them to the aavegotchi
        div.class`mt-10`(
          span.class`inline-flex rounded-md shadow-sm`(
            button
              .type`button`
              .class(tokenHatBalance === 0 && wearableBalances[0] > 0 && tokenExists ? wearableButtonClassActive : wearableButtonClassDisabled)
              .onclick(async e => {
                if (tokenHatBalance === 0 && wearableBalances[0] > 0 && tokenExists) {
                // transferToParent(address _from, address _toContract, uint _toTokenId, uint _id, uint _value) external {
                  await agw.transferToParent(accountAddress, contractAddress, tokenId, wearableId(1), 1)
                  svgDiv.replaceWith(wait)
                }
              })`Put On Hat`
          )
        ),
        div.class`mt-2`(
          span.class`inline-flex rounded-md shadow-sm`(
            button
              .type`button`
              .class(tokenHatBalance > 0 ? wearableButtonClassActive : wearableButtonClassDisabled)
              .onclick(async e => {
                if (tokenHatBalance > 0) {
                  await agw.transferFromParent(contractAddress, tokenId, accountAddress, wearableId(1), 1)
                  svgDiv.replaceWith(wait)
                }
              })`Take Off Hat`
          )
        ),
        div.class`mt-10`(
          span.class`inline-flex rounded-md shadow-sm`(
            button
              .type`button`
              .class(tokenPantsBalance === 0 && wearableBalances[1] > 0 && tokenExists ? wearableButtonClassActive : wearableButtonClassDisabled)
              .onclick(async e => {
                if (tokenPantsBalance === 0 && wearableBalances[1] > 0 && tokenExists) {
                  await agw.transferToParent(accountAddress, contractAddress, tokenId, wearableId(2), 1)
                  svgDiv.replaceWith(wait)
                }
              })`Put On Pants`
          )
        ),
        div.class`mt-2`(
          span.class`inline-flex rounded-md shadow-sm`(
            button
              .type`button`
              .class(tokenPantsBalance > 0 ? wearableButtonClassActive : wearableButtonClassDisabled)
              .onclick(async e => {
                if (tokenPantsBalance > 0) {
                  await agw.transferFromParent(contractAddress, tokenId, accountAddress, wearableId(2), 1)
                  svgDiv.replaceWith(wait)
                }
              })`Take Off Pants`
          )
        ),
        div.class`mt-10`(
          span.class`inline-flex rounded-md shadow-sm`(
            button
              .type`button`
              .class(tokenStickBalance === 0 && wearableBalances[2] > 0 && tokenExists ? wearableButtonClassActive : wearableButtonClassDisabled)
              .onclick(async e => {
                if (tokenStickBalance === 0 && wearableBalances[2] > 0 && tokenExists) {
                  await agw.transferToParent(accountAddress, contractAddress, tokenId, wearableId(3), 1)
                  svgDiv.replaceWith(wait)
                }
              })`Pickup Stick`
          )
        ),
        div.class`mt-2`(
          span.class`inline-flex rounded-md shadow-sm`(
            button
              .type`button`
              .class(tokenStickBalance > 0 ? wearableButtonClassActive : wearableButtonClassDisabled)
              .onclick(async e => {
                if (tokenStickBalance > 0) {
                  await agw.transferFromParent(contractAddress, tokenId, accountAddress, wearableId(3), 1)
                  svgDiv.replaceWith(wait)
                }
              })`Drop Stick`
          )
        )
      )
    ),
    div.class`text-lg``Get some ether ${a.class`text-blue underline`.href`https://faucet.kovan.network/`.target`_blank``here`}.`
  )
  document.body = body(app)
}

agr.on('TransferSingle', () => {
  // console.log('we got the event!!!!')
  runMain()
})

function runMain () {
  // Check if we are on Kovan network
  if (window.ethereum.chainId === '0x2a') {
    main().then(result => {
    // console.log('success')
    }, error => {
      console.log('yikers: ' + error)
    })
  } else {
    document.body = body(div.class`text-4xl container mx-auto text-center mt-30``Switch to the Kovan Network`)
  }
}

runMain()
