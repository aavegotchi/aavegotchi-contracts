// Make sure that the entire enclosing <g> has a class="collateral"

const collateralsSvgs = [
  // 0, DAI Collateral
  '<g class="gotchi-collateral" fill="#ff7d00"><path d="M37 16v-1h-1v-1h-1v1h-6v-2h5v-1h-6v3h-1v1h1v1h-1v1h1v3h6v-1h-5v-2h6v1h1v-1h1v-1h-1v-1h1zm-2 1h-6v-1h6v1z"/><path d="M34 19h1v1h-1zm0-6h1v1h-1z"/></g>',
  // 1, ETH Collateral
  '<g class="gotchi-collateral"><g ><path d="M29 17v-2h-1v4h1v-1z"/><path d="M29 14h1v1h-1zm0 5h1v1h-1z"/><path d="M30 20h1v1h-1z"/><path d="M31 21v1h2v-1h-1zm-1-8h1v1h-1zm4 6h1v1h-1zm0-5h1v1h-1z"/><path d="M33 13v-1h-2v1h1zm0 7h1v1h-1z"/><path d="M33 13h1v1h-1zm2 2v4h1v-4z"/></g><path d="M34 17h-2v4h1v-1h1v-1h1v-2z" fill="#c260ff"/><g fill="#dea8ff"><path d="M30 17h-1v2h1v1h1v1h1v-4h-1z"/><path d="M34 15v-1h-1v-1h-1v4h3v-2z"/></g><path d="M31 17h1v-4h-1v1h-1v1h-1v2h1z" /></g>',
  // 2, AAVE Collateral
  '<g class="gotchi-collateral" fill="#a73796"><path d="M30.5 15h1v-2h-1z"/><path d="M31.5 12h1v1h-1z"/><path d="M33.5 13h-1v2h1zm-4 3h-2v1h1v2h1v-2h2v-1h-1v-1h-1z"/><path d="M34.5 15h-1v2h1z"/><path d="M35.5 17h-1v2h1zm-8 4h1v-2h-1z"/><path d="M35.5 19v2h1v-2z"/></g>',
  // 3, LINK Collateral
  '<g class="gotchi-collateral"><path d="M34 13v-1h-4v1h-1v1h-1v1h-1v4h1v1h1v1h1v1h4v-1h1v-1h1v-1h1v-4h-1v-1h-1v-1h-1zm-2 1h1v1h1v1h1v2h-1v1h-1v1h-2v-1h-1v-1h-1v-2h1v-1h1v-1h1z" fill="#0000b9"/></g>',
  // 4, USDT Collateral
  '<g class="gotchi-collateral" fill="#26a17b"><path d="M31 19h2v3h-2zm0-2v1h2v-1h3v-1h-3v-1h2v-2h-6v2h2v1h-3v1z"/><path d="M27 17h1v1h-1z"/><path d="M28 18h3v1h-3zm8-1h1v1h-1z"/><path d="M33 18h3v1h-3z"/></g>',
  // 5, USDC Collateral
  '<g class="gotchi-collateral" fill="#2664ba"><path d="M30 15v2h3v1h-3v1h1.5v1h1v-1H34v-3h-3v-1h3v-1h-1.5v-1h-1v1H30zm4 5h1v1h-1z"/><path d="M35 19h1v1h-1z"/><path d="M36 16v3h1v-5h-1v1zm-2-4h1v1h-1z"/><path d="M35 13h1v1h-1zm-7 5v-4h-1v5h1zm1 2h1v1h-1z"/><path d="M28 19h1v1h-1zm1-7h1v1h-1z"/><path d="M28 13h1v1h-1z"/></g>',
  // 6, Uni Collateral
  '<g class="gotchi-collateral"><path d="M30 9V8h-1v1h-1v2h1v1h2V9z" fill="#ffc2db"/><path d="M28 7V6h-1v2h2V7z" fill="#ffdeec"/><path d="M26 5h1v1h-1z" fill="#fff"/><path d="M33 13v-2h-1v1h-1v1h-2v1h1v1h4v-2z" fill="#ff88b8"/><g fill="#ff3085"><path d="M27 5V4h-1V3h-1v3h1V5z"/><path d="M27 5h1v1h-1z"/><path d="M28 6h1v1h-1z"/><path d="M29 7h1v1h-1z"/><path d="M30 8h1v1h-1zm-2 1h1V8h-2v3h1z"/><path d="M31 13v-1h-2v-1h-1v3h1v-1z"/><path d="M31 12h1v-1h1v-1h-1V9h-1z"/><path d="M34 12v-1h-1v2h1v2h1v-3z"/><path d="M30 15v-1h-1v2h5v-1zm-4-9h1v2h-1z"/></g></g>',
  // 7, YFI Collateral
  '<g class="gotchi-collateral" fill="#0074f9"><path d="M30 16h1v1h-1zm4 1h1v1h-1z"/><path d="M33 16h1v1h-1zm1 2h1v1h-1z"/><path d="M34 19h1v1h-1z"/><path d="M34 20h1v1h-1zm-2 1h1v1h-1z"/><path d="M33 21h1v1h-1zm-2 0h1v1h-1z"/><path d="M30 21h1v1h-1z"/><path d="M29 20h1v1h-1z"/><path d="M30 19h1v1h-1z"/><path d="M30 18h1v1h-1z"/><path d="M29 18h1v1h-1zm4-7h1v1h-1zm-2 0h1v1h-1z"/><path d="M30 11h1v1h-1zm2 0h1v1h-1zm-3 4h1v1h-1zm0-2h1v1h-1z"/><path d="M29 12h1v1h-1zm0 2h1v1h-1zm5-2h1v1h-1zm-1 2h1v1h-1z"/><path d="M34 14h1v1h-1z"/><path d="M33 13h1v1h-1zm-1.5 2h1v1h-1z"/><path d="M31.5 14h1v1h-1z"/><path d="M31.5 13h1v1h-1zm0 3h1v1h-1zm0 2h1v1h-1z"/><path d="M31.5 19h1v1h-1zm0-2h1v1h-1z"/></g>',
  // 8, TUSD Collateral
  '<g class="gotchi-collateral"><g fill="#282473"><path d="M37 15h-1v4h1zm-3 5h1v1h-1z"/><path d="M35 19h1v1h-1zm-6 1h1v1h-1z"/><path d="M34 22v-1h-4v1z"/></g><g fill="#489ff8"><path d="M30.5 15v1h1v3h1v-3h1v-1zm-.5-3v1h4v-1z"/><path d="M34 13h1v1h-1zm-7 6h1v-4h-1zm2-6h1v1h-1z"/><path d="M28 14h1v1h-1z"/></g></g>',
];

exports.collateralsSvgs = collateralsSvgs;
