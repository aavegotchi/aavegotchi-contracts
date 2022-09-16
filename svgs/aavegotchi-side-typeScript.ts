// body
let leftBody =
  '<path d="M43 14v-2h-2v-2h-2V8h-4V6h-6v2h-4v2h-2v2h-2v2h-1v41h3v-2h3v2h4v-2h4v2h4v-2h3v2h3V14z" class="gotchi-wearable gotchi-primary"/><path d="M41 14v-2h-2v-2h-4V8h-6v2h-4v2h-2v2h-2v39h2v-2h3v2h4v-2h4v2h4v-2h3v2h2V14z" class="gotchi-wearable gotchi-secondary"/><path d="M42,51h-1v-2h-3v2h-4v-2h-4v2h-4v-2h-3v2h-2V14h2v-1h2v-2h4V9h6v2h4v2h2v2h1V51z" fill="#fff" class="gotchi-wearable"/>';
// shadow
leftBody +=
  '<g class="gotchi-shadow"><path d="M23 58v1h1v1h16v-1h1v-1z" opacity=".25"/></g>';
// cheek
leftBody += '<path class="gotchi-cheek" d="M22 32h2v2h-2z" fill="#f696c6"/>';

let leftHand =
  '<path d="M25 44h-1v-4h1v-1h2v-1h2v-1h1v-1h1v-1h2v1h-.2v5h.2v1h-1v1h-1v1h-2v1h-4v-1z" class="gotchi-wearable gotchi-primary"/><path d="M25,40h2v-1h2v-1h1v-1h1v-1h2v5h-1v1h-1v1h-2v1h-4V40z" fill="#fff" class="gotchi-wearable"/><g class="gotchi-wearable gotchi-secondary"><path d="M33 40v1h-1v-1h1z"/><path d="M29,42v1h2v-1h1v-1h-1v1H29z"/><path d="M29 43v1h-4v-1h4z"/></g>';

// body
let rightBody =
  '<path d="M21 14v-2h2v-2h2V8h4V6h6v2h4v2h2v2h2v2h1v41h-3v-2h-3v2h-4v-2h-4v2h-4v-2h-3v2h-3V14z" class="gotchi-wearable gotchi-primary"/><path d="M23 14v-2h2v-2h4V8h6v2h4v2h2v2h2v39h-2v-2h-3v2h-4v-2h-4v2h-4v-2h-3v2h-2V14z" class="gotchi-wearable gotchi-secondary"/><path d="M22,15h1v-2h2v-2h4V9h6v2h4v2h2v1h2v37h-2v-2h-3v2h-4v-2h-4v2h-4v-2h-3v2h-1V15z" fill="#fff" class="gotchi-wearable"/>';
// shadow
rightBody +=
  '<g class="gotchi-shadow"><path d="M23 58v1h1v1h16v-1h1v-1z" opacity=".25"/></g>';
// cheek
rightBody += '<path class="gotchi-cheek" d="M40 32h2v2h-2z" fill="#f696c6"/>';

let rightHand =
  '<path class="gotchi-wearable gotchi-primary" d="M39 45h-4v-1h-2v-1h-1v-1h-1v-1h.2v-5H31v-1h2v1h1v1h1v1h2v1h2v1h1v4h-1v1z"/><path d="M39 44h-4v-1h-2v-1h-1v-1h-1v-5h2v1h1v1h1v1h2v1h2v4z" fill="#fff" class="gotchi-wearable"/><g class="gotchi-wearable gotchi-secondary"><path d="M32 40v1h-1v-1h1z"/><path d="M33 42v-1h-1v1h1v1h2v-1h-2z"/><path d="M39 43v1h-4v-1h4z"/></g>';

let backBody = `<g class="gotchi-body"><path d="M47 14v-2h-2v-2h-4V8h-4V6H27v2h-4v2h-4v2h-2v2h-2v41h4v-2h5v2h5v-2h6v2h5v-2h5v2h4V14z" class="gotchi-primary"/><path d="M45 14v-2h-4v-2h-4V8H27v2h-4v2h-4v2h-2v39h2v-2h5v2h5v-2h6v2h5v-2h5v2h2V14z" class="gotchi-secondary"/><path d="M18,49h2v-1h2v1h2v2h5v-2h2v-1h2v1h2v2h5v-2h2v-1h2v1h1V14h-4v-2h-4v-2h-5V9h-5v2h-4v2h-4v2h-1V49z" fill="#fff"/></g>`;
// shadow
backBody +=
  '<g class="gotchi-shadow"><path opacity=".25" d="M25 58H19v1h1v1h24V59h1V58h-1z" fill="#000"/></g>';

let handsDownOpen =
  '<g class="gotchi-handsDownOpen"><g class="gotchi-primary"><path d="M56 38v-1h-2v-1h-2v-1h-1v-1h-1v-1h-1v8h1v1h2v1h4v-1h1v-4z"/></g><g class="gotchi-secondary"><path d="M54 38v-1h-2v-1h-1v-1h-1v-1h-1v6h1v1h2v1h4v-4z" /></g><path d="M54,38v-1h-2v-1h-1v-1h-1v-1h-1v5h1v1h2v1h4v-3H54z" fill="#fff"/><g class="gotchi-primary"><path d="M8 38v-1h2v-1h2v-1h1v-1h1v-1h1v8h-1v1h-2v1H8v-1H7v-4z"/></g><g class="gotchi-secondary"><path d="M10 38v-1h2v-1h1v-1h1v-1h1v6h-1v1h-2v1H8v-4z" /></g><path d="M8,38v3h4v-1h2v-1h1v-5h-1v1h-1v1h-1v1h-2v1H8z" fill="#fff"/></g>';
let handsUp =
  '<g class="gotchi-handsUp"><g class="gotchi-secondary"><path d="M50,38h1v1h-1V38z"/><path d="M49 39h1v1h-1v-1zm2-2h1v1h-1v-1z"/><path d="M52,36h2v1h-2V36z"/><path d="M54,35h2v1h-2V35z"/></g><path d="M52,32v1h-2v1h-1v5h1v-1h1v-1h1v-1h2v-1h2v-3H52z" fill="#fff"/><g class="gotchi-primary"><path d="M49,33h1v1h-1V33z"/><path d="M50 32h2v1h-2v-1zm0 7h1v1h-1v-1z"/><path d="M49 40h1v1h-1v-1zm2-2h1v1h-1v-1z"/><path d="M52 37h2v1h-2v-1zm0-6h4v1h-4v-1z"/><path d="M56,32h1v4h-1V32z"/><path d="M54,36h2v1h-2V36z"/></g><g class="gotchi-secondary"><path d="M13,38h1v1h-1V38z"/><path d="M14 39h1v1h-1v-1zm-2-2h1v1h-1v-1z"/><path d="M10,36h2v1h-2V36z"/><path d="M8,35h2v1H8V35z"/></g><path d="M8,32v3h2v1h2v1h1v1h1v1h1v-5h-1v-1h-2v-1H8z" fill="#fff"/><g class="gotchi-primary"><path d="M14,33h1v1h-1V33z"/><path d="M12 32h2v1h-2v-1zm1 7h1v1h-1v-1z"/><path d="M14 40h1v1h-1v-1zm-2-2h1v1h-1v-1z"/><path d="M10 37h2v1h-2v-1zm-2-6h4v1H8v-1z"/><path d="M7,32h1v4H7V32z"/><path d="M8,36h2v1H8V36z"/></g></g>';

let hands = handsDownOpen + handsUp;

export const aavegotchiSvgs = {
  left: ["", "", leftBody, leftHand],
  right: ["", "", rightBody, rightHand],
  back: ["", "", backBody, hands, ""],
};
