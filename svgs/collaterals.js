const collateralsSvgs = [
  // 0, DAI Collateral
  '<g fill="#ff7d00"><path d="M37 16v-1h-1v-1h-1v1h-6v-2h5v-1h-6v3h-1v1h1v1h-1v1h1v3h6v-1h-5v-2h6v1h1v-1h1v-1h-1v-1h1zm-2 1h-6v-1h6v1z"/><path d="M34 19h1v1h-1zm0-6h1v1h-1z"/></g>',
  // 1, ETH Collateral
  '<g fill="#64438e"><path d="M29 17v-2h-1v4h1v-1z"/><path d="M29 14h1v1h-1zm0 5h1v1h-1z"/><path d="M30 20h1v1h-1z"/><path d="M31 21v1h2v-1h-1zm-1-8h1v1h-1zm4 6h1v1h-1zm0-5h1v1h-1z"/><path d="M33 13v-1h-2v1h1zm0 7h1v1h-1z"/><path d="M33 13h1v1h-1zm2 2v4h1v-4z"/></g><path d="M34 17h-2v4h1v-1h1v-1h1v-2z" fill="#c260ff"/><g fill="#dea8ff"><path d="M30 17h-1v2h1v1h1v1h1v-4h-1z"/><path d="M34 15v-1h-1v-1h-1v4h3v-2z"/></g><path d="M31 17h1v-4h-1v1h-1v1h-1v2h1z" fill="#edd3fd"/>',
  // 2, LEND Collateral
  '<g fill="#0fa9c9"><path d="M34 16h1v1h-1zm0-2h1v1h-1z"/><path d="M35 13h1v1h-1zm-3 4h1v1h-1z"/><path d="M33 18h1v1h-1zm-2-2h1v1h-1zm0 3h1v1h-1z"/><path d="M30 20h1v1h-1z"/><path d="M29 21h1v1h-1zm1-3h1v1h-1zm3-3h1v1h-1z"/></g>',
  // 3, LINK Collateral
  '<path d="M34 13v-1h-4v1h-1v1h-1v1h-1v4h1v1h1v1h1v1h4v-1h1v-1h1v-1h1v-4h-1v-1h-1v-1h-1zm-2 1h1v1h1v1h1v2h-1v1h-1v1h-2v-1h-1v-1h-1v-2h1v-1h1v-1h1z" fill="#0000b9"/>',
  // 4, SNX Collateral
  '<g fill="#1b182a"><path d="M33 16h-3v1h4v-1z"/><path d="M34 18v2h1v-3h-1z"/><path d="M32 20h-3v1h5v-1h-1zm-2-6v-1h-1v3h1v-1z"/><path d="M34 12h-4v1h5v-1z"/></g><g fill="#a4a3aa"><path d="M34 13h1v1h-1z"/><path d="M33 14h1v1h-1z"/><path d="M32 15h1v1h-1zm-2 3h1v1h-1z"/><path d="M31 17h1v1h-1zm-2 2h1v1h-1z"/></g>',
  // 5, TUSD Collateral
  '<g fill="#282473"><path d="M37 18v-3h-1v4h1zm-3 2h1v1h-1z"/><path d="M35 19h1v1h-1zm-6 1h1v1h-1z"/><path d="M31 22h3v-1h-4v1z"/></g><g fill="#489ff8"><path d="M31.5 15h-1v1h1v3h1v-3h1v-1h-1zm1.5-3h-3v1h4v-1z"/><path d="M34 13h1v1h-1zm-7 3v3h1v-4h-1zm2-3h1v1h-1z"/><path d="M28 14h1v1h-1z"/></g>',
  // 6, USDC Collateral
  '<g fill="#2664ba"><path d="M30 15v2h3v1h-3v1h1.5v1h1v-1H34v-3h-3v-1h3v-1h-1.5v-1h-1v1H30zm4 5h1v1h-1z"/><path d="M35 19h1v1h-1z"/><path d="M36 16v3h1v-5h-1v1zm-2-4h1v1h-1z"/><path d="M35 13h1v1h-1zm-7 5v-4h-1v5h1zm1 2h1v1h-1z"/><path d="M28 19h1v1h-1zm1-7h1v1h-1z"/><path d="M28 13h1v1h-1z"/></g>',
  // 7, YFI Collateral
  '<g fill="#0074f9"><path d="M30 16h1v1h-1zm4 1h1v1h-1z"/><path d="M33 16h1v1h-1zm1 2h1v1h-1z"/><path d="M34 19h1v1h-1z"/><path d="M34 20h1v1h-1zm-2 1h1v1h-1z"/><path d="M33 21h1v1h-1zm-2 0h1v1h-1z"/><path d="M30 21h1v1h-1z"/><path d="M29 20h1v1h-1z"/><path d="M30 19h1v1h-1z"/><path d="M30 18h1v1h-1z"/><path d="M29 18h1v1h-1zm4-7h1v1h-1zm-2 0h1v1h-1z"/><path d="M30 11h1v1h-1zm2 0h1v1h-1zm-3 4h1v1h-1zm0-2h1v1h-1z"/><path d="M29 12h1v1h-1zm0 2h1v1h-1zm5-2h1v1h-1zm-1 2h1v1h-1z"/><path d="M34 14h1v1h-1z"/><path d="M33 13h1v1h-1zm-1.5 2h1v1h-1z"/><path d="M31.5 14h1v1h-1z"/><path d="M31.5 13h1v1h-1zm0 3h1v1h-1zm0 2h1v1h-1z"/><path d="M31.5 19h1v1h-1zm0-2h1v1h-1z"/></g>',
  // 8, REN Collateral
  '<path d="M32 20h1v1h-1zm-2 0h1v1h-1z"/><path d="M33 21h1v1h-1zm-4-2h1v1h-1zm-2-2h1v1h-1zm0-2h1v1h-1z"/><path d="M28 18h1v1h-1zm0-2h1v1h-1zm0-2h1v1h-1z"/><path d="M29 13h1v1h-1zm0 2h1v1h-1z"/><path d="M30 14h1v1h-1z"/><path d="M32 15h1v1h1v1h-1v1h1v1h-1v1h1v1h1v-1h1v-1h1v-4h-1v-1h-1v-1h-1v-1h-4v1h1v1h1z"/><path d="M31 15h1v1h-1z"/><path d="M30 16h1v1h-1zm2 0h1v1h-1z"/><path d="M29 17h1v1h-1zm2 0h1v1h-1z"/><path d="M30 18h1v1h-1zm2 0h1v1h-1z"/><path d="M31 19h1v1h-1zm0 2h1v1h-1z"/>',
]

exports.collateralsSvgs = collateralsSvgs


