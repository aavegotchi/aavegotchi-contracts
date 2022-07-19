const fs = require("fs");
// const sealedClosedPortal = fs.readFileSync(
//   "./svgs/sealedClosedPortal.svg",
//   "utf8"
// );
// const openPortal = fs.readFileSync("./svgs/openPortal.svg", "utf8");

const body = `<g class="gotchi-body"><path d="M47 14v-2h-2v-2h-4V8h-4V6H27v2h-4v2h-4v2h-2v2h-2v41h4v-2h5v2h5v-2h6v2h5v-2h5v2h4V14z" class="gotchi-primary"/><path d="M45 14v-2h-4v-2h-4V8H27v2h-4v2h-4v2h-2v39h2v-2h5v2h5v-2h6v2h5v-2h5v2h2V14z" class="gotchi-secondary"/><path d="M18,49h2v-1h2v1h2v2h5v-2h2v-1h2v1h2v2h5v-2h2v-1h2v1h1V14h-4v-2h-4v-2h-5V9h-5v2h-4v2h-4v2h-1V49z" fill="#fff"/></g>`;
const cheeks =
  '<path class="gotchi-cheek" d="M21 32v2h2v-2h-1zm21 0h-1v2h2v-2z"/>';
const mouth =
  '<g class="gotchi-primary-mouth"><path d="M29 32h-2v2h2v-1z"/><path d="M33 34h-4v2h6v-2h-1z"/><path d="M36 32h-1v2h2v-2z"/></g>';
const handsDownClosed =
  '<g class="gotchi-handsDownClosed"><g class="gotchi-primary"><path d="M19 42h1v1h-1zm1-6h1v1h-1z"/><path d="M21 37h1v1h-1zm5 3v4h1v-4zm-5 3h-1v1h2v-1z"/><path d="M24 44h-2v1h4v-1h-1zm1-5h-1v1h2v-1z"/><path d="M23 38h-1v1h2v-1z"/></g><g class="gotchi-secondary"><path d="M19 43h1v1h-1zm5 2h-2v1h4v-1h-1z"/><path d="M27 41v3h1v-3zm-6 3h-1v1h2v-1z"/><path d="M26 44h1v1h-1zm-7-3h-1v2h1v-1z"/></g><g class="gotchi-primary"><path d="M44 42h1v1h-1zm-1-6h1v1h-1z"/><path d="M42 37h1v1h-1z"/><path d="M42 39v-1h-2v1h1zm0 4v1h2v-1h-1z"/><path d="M40 44h-2v1h4v-1h-1z"/><path d="M38 42v-2h-1v4h1v-1z"/><path d="M40 40v-1h-2v1h1z"/></g><g class="gotchi-secondary"><path d="M42 44v1h2v-1h-1zm-5-2v-1h-1v3h1v-1z"/><path d="M40 45h-2v1h4v-1h-1z"/><path d="M37 44h1v1h-1zm7-1h1v1h-1z"/></g></g>';
const handsDownOpen =
  '<g class="gotchi-handsDownOpen"><g class="gotchi-primary"><path d="M56 38v-1h-2v-1h-2v-1h-1v-1h-1v-1h-1v8h1v1h2v1h4v-1h1v-4z"/></g><g class="gotchi-secondary"><path d="M54 38v-1h-2v-1h-1v-1h-1v-1h-1v6h1v1h2v1h4v-4z" /></g><path d="M54,38v-1h-2v-1h-1v-1h-1v-1h-1v5h1v1h2v1h4v-3H54z" fill="#fff"/><g class="gotchi-primary"><path d="M8 38v-1h2v-1h2v-1h1v-1h1v-1h1v8h-1v1h-2v1H8v-1H7v-4z"/></g><g class="gotchi-secondary"><path d="M10 38v-1h2v-1h1v-1h1v-1h1v6h-1v1h-2v1H8v-4z" /></g><path d="M8,38v3h4v-1h2v-1h1v-5h-1v1h-1v1h-1v1h-2v1H8z" fill="#fff"/></g>';
const handsUp =
  '<g class="gotchi-handsUp"><g class="gotchi-secondary"><path d="M50,38h1v1h-1V38z"/><path d="M49 39h1v1h-1v-1zm2-2h1v1h-1v-1z"/><path d="M52,36h2v1h-2V36z"/><path d="M54,35h2v1h-2V35z"/></g><path d="M52,32v1h-2v1h-1v5h1v-1h1v-1h1v-1h2v-1h2v-3H52z" fill="#fff"/><g class="gotchi-primary"><path d="M49,33h1v1h-1V33z"/><path d="M50 32h2v1h-2v-1zm0 7h1v1h-1v-1z"/><path d="M49 40h1v1h-1v-1zm2-2h1v1h-1v-1z"/><path d="M52 37h2v1h-2v-1zm0-6h4v1h-4v-1z"/><path d="M56,32h1v4h-1V32z"/><path d="M54,36h2v1h-2V36z"/></g><g class="gotchi-secondary"><path d="M13,38h1v1h-1V38z"/><path d="M14 39h1v1h-1v-1zm-2-2h1v1h-1v-1z"/><path d="M10,36h2v1h-2V36z"/><path d="M8,35h2v1H8V35z"/></g><path d="M8,32v3h2v1h2v1h1v1h1v1h1v-5h-1v-1h-2v-1H8z" fill="#fff"/><g class="gotchi-primary"><path d="M14,33h1v1h-1V33z"/><path d="M12 32h2v1h-2v-1zm1 7h1v1h-1v-1z"/><path d="M14 40h1v1h-1v-1zm-2-2h1v1h-1v-1z"/><path d="M10 37h2v1h-2v-1zm-2-6h4v1H8v-1z"/><path d="M7,32h1v4H7V32z"/><path d="M8,36h2v1H8V36z"/></g></g>';
const shadow =
  '<g class="gotchi-shadow"><path opacity=".25" d="M25 58H19v1h1v1h24V59h1V58h-1z" fill="#000"/></g>';
const aavegotchiBody = body + cheeks + mouth + shadow;
const hands = handsDownClosed + handsDownOpen + handsUp;
export const aavegotchiSvgs = [
  // 0, sealed closed portal
  //
  "",
  // 1, open portal
  // openPortal
  "",
  // 2 aavegotchi
  aavegotchiBody,
  // 3 hands
  hands,

  // 4 Background ETH

  '<g class="gotchi-bg"><defs fill="#fff"><pattern id="a" patternUnits="userSpaceOnUse" width="4" height="4"><path d="M0 0h1v1H0zm2 2h1v1H2z"/></pattern><pattern id="b" patternUnits="userSpaceOnUse" x="0" y="0" width="2" height="2"><path d="M0 0h1v1H0z"/></pattern><pattern id="c" patternUnits="userSpaceOnUse" x="-2" y="0" width="8" height="1"><path d="M0 0h1v1H0zm2 0h1v1H2zm2 0h1v1H4z"/></pattern><pattern id="d" patternUnits="userSpaceOnUse" x="0" y="0" width="4" height="4"><path d="M0 0h1v1H0zm0 2h1v1H0zm1 0V1h1v1zm1 0h1v1H2zm0-1h1V0H2zm1 2h1v1H3z"/></pattern><pattern id="e" patternUnits="userSpaceOnUse" width="64" height="32"><path d="M4 4h1v1H4zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1z"/><path fill="url(#a)" d="M0 8h64v7H0z"/><path fill="url(#b)" d="M0 16h64v1H0z"/><path fill="url(#c)" d="M0 18h64v1H0z"/><path fill="url(#b)" d="M22 18h15v1H22zM0 20h64v3H0z"/><path fill="url(#d)" d="M0 24h64v8H0z"/></pattern><mask id="f"><path fill="url(#e)" d="M0 0h64v32H0z"/></mask></defs><path fill="#fff" d="M0 0h64v32H0z"/><path fill="#dea8ff" class="gotchi-secondary" mask="url(#f)" d="M0 0h64v32H0z"/><path fill="#dea8ff" class="gotchi-secondary" d="M0 32h64v32H0z"/><path mask="url(#f)" fill="#fff" transform="matrix(1 0 0 -1 0 64)" d="M0 0h64v32H0z"/></g>',
];
