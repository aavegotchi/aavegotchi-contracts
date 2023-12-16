import { BigNumberish } from "@ethersproject/bignumber";
import { BytesLike } from "@ethersproject/bytes";
import { SvgFacet } from "../typechain";
import { itemManager, itemManagerAlt } from "./helperFunctions";

import { aavegotchiSvgs } from "../svgs/aavegotchi-side-typeScript";
import { aavegotchiSvgs as frontGotchiSvgs } from "../svgs/aavegotchi-typescript";
import {
  wearablesSvgs as front,
  sleeveSvgs as frontSleeve,
} from "../svgs/wearables";
import {
  wearablesLeftSvgs as left,
  wearablesRightSvgs as right,
  wearablesBackSvgs as back,
  wearablesLeftSleeveSvgs as leftSleeve,
  wearablesRightSleeveSvgs as rightSleeve,
  wearablesBackSleeveSvgs as backSleeve,
} from "../svgs/wearables-sides";
import { collateralsSvgs as collateralFront } from "../svgs/collateralsOptimizerFront";
import {
  collateralsLeftSvgs,
  collateralsRightSvgs,
} from "../svgs/collaterals-sides";
import { eyeShapeSvgs as frontEyesH1 } from "../svgs/eyeShapesOptimized";
import {
  eyeShapesLeftSvgs as leftEyesH1,
  eyeShapesRightSvgs as rightEyesH1,
} from "../svgs/eyeShapes-sidesOpt";
import { eyeShapeSvgs as frontEyesH2 } from "../svgs/eyeShapesH2Opt";
import {
  eyeShapesLeftSvgs as leftEyesH2,
  eyeShapesRightSvgs as rightEyesH2,
} from "../svgs/eyeShapesH2-sidesOpt";

import { UpdateSvgsTaskArgs } from "../tasks/updateSvgs";
import { AddBaadgeTaskArgs } from "../tasks/addBaadgeSvgs";
import { AirdropBaadgeTaskArgs } from "../tasks/baadgeAirdrop";
import { MintBaadgeTaskArgs } from "../tasks/mintBaadgeSvgs";
const fs = require("fs");
import { SleeveObject, ItemTypeInputNew } from "./itemTypeHelpers";

export interface SvgTypesAndSizes {
  svgType: BytesLike;
  sizes: BigNumberish[];
}

export interface SvgTypesAndSizesOutput {
  svg: string;
  svgTypesAndSizes: SvgTypesAndSizes[];
}

export function setupSvg(
  svgType: string,
  svgs: string[],
  ethers: any
): SvgTypesAndSizesOutput {
  const svgTypesAndSizes: SvgTypesAndSizes[] = [];
  const svgItems = [];

  svgItems.push(svgs.join(""));
  svgTypesAndSizes.push({
    svgType: ethers.utils.formatBytes32String(svgType),
    sizes: svgs.map((value: string) => value.length),
  });

  return {
    svg: svgItems.join(""),
    svgTypesAndSizes: svgTypesAndSizes,
  };

  // return [svgItems.join(""), svgTypesAndSizes];
}

export function printSizeInfo(
  svgType: string,
  sizes: BigNumberish[]
  // ethers: any
) {
  console.log("------------- SVG Size Info ---------------");
  let totalSize = 0;
  for (const size of sizes) {
    console.log(svgType + ":" + size);
    // for (const nextSize of size) {
    totalSize += Number(size.toString());
    // }
  }
  console.log("Total sizes:" + sizes);
}

export function stripSvg(svg: string) {
  // removes svg tag
  if (svg.includes("viewBox")) {
    svg = svg.slice(svg.indexOf(">") + 1);
    svg = svg.replace("</svg>", "");
  }
  return svg;
}

export function readSvg(name: string, folder: string) {
  //folder is usually svgItems but could also be svgItems/subfolder
  return stripSvg(fs.readFileSync(`./svgs/${folder}/${name}.svg`, "utf8"));
}

export function wearable(name: string, folder: string) {
  const svg = readSvg(name, folder);
  return svg;
}

export interface BodyWearableOutput {
  wearable: string;
  sleeves: SleeveObject;
}

export function bodyWearable(name: string, folder: string): BodyWearableOutput {
  let baseSvg = readSvg(name, folder);
  // console.log(name, svg.length)
  const id = name.slice(0, name.indexOf("_"));
  const leftSleevesUp =
    '<g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-up">' +
    readSvg(`${name}LeftUp`, folder) +
    "</g>";
  const leftSleeves =
    '<g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-down">' +
    readSvg(`${name}Left`, folder) +
    "</g>";
  const rightSleevesUp =
    '<g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-up">' +
    readSvg(`${name}RightUp`, folder) +
    "</g>";
  const rightSleeves =
    '<g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-down">' +
    readSvg(`${name}Right`, folder) +
    "</g>";
  let sleevesSvg =
    "<g>" +
    leftSleevesUp +
    leftSleeves +
    rightSleevesUp +
    rightSleeves +
    "</g>";

  return { wearable: baseSvg, sleeves: { id: id, svg: sleevesSvg } };
}

export function bodyWearableBack(name: string, folder: string) {
  let svg;

  const back = readSvg(`${name}Back`, folder);
  const backLeftSleevesUp =
    '<g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-up">' +
    readSvg(`${name}BackLeftUp`, folder) +
    "</g>";
  const backLeft = readSvg(`${name}BackLeft`, folder);
  const backRightSleevesUp =
    '<g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-up">' +
    readSvg(`${name}BackRightUp`, folder) +
    "</g>";
  const backRight = readSvg(`${name}BackRight`, folder);

  svg =
    "<g>" +
    back +
    backLeftSleevesUp +
    backLeft +
    backRightSleevesUp +
    backRight +
    "</g>";

  return svg;
}

export function bodyWearableLeft(name: string, folder: string) {
  let svg;
  const left = readSvg(`${name}SideLeft`, folder);
  svg = "<g>" + left + "</g>";
  return svg;
}

export function bodyWearableRight(name: string, folder: string) {
  let svg;
  const right = readSvg(`${name}SideRight`, folder);
  svg = "<g>" + right + "</g>";
  return svg;
}

export function sleeveWearableLeft(name: string, folder: string) {
  let svg;
  const leftSleevesUp =
    '<g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-up">' +
    readSvg(`${name}SideLeftUp`, folder) +
    "</g>";
  const leftSleevesDown =
    '<g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-down">' +
    readSvg(`${name}SideLeftDown`, folder) +
    "</g>";
  svg = "<g>" + leftSleevesUp + leftSleevesDown + "</g>";
  return svg;
}

export function sleeveWearableRight(name: string, folder: string) {
  let svg;
  const rightSleevesUp =
    '<g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-up">' +
    readSvg(`${name}SideRightUp`, folder) +
    "</g>";
  const rightSleevesDown =
    '<g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-down">' +
    readSvg(`${name}SideRightDown`, folder) +
    "</g>";
  svg = "<g>" + rightSleevesUp + rightSleevesDown + "</g>";
  return svg;
}

export interface UpdateSvgPayload {
  svgType: BytesLike;
  ids: string[];
  sizes: number[];
}

export function updateSvgsPayload(
  svg: string,
  svgType: string,
  svgId: string,
  ethers: any
): UpdateSvgPayload {
  let svgLength = new TextEncoder().encode(svg).length;
  const payload = {
    svgType: ethers.utils.formatBytes32String(svgType),
    ids: [svgId],
    sizes: [svgLength],
  };

  return payload;
}

export function svgTypeToBytes(svgType: string, ethers: any): BytesLike {
  return ethers.utils.formatBytes32String(svgType);
}

export async function uploadSvgs(
  svgFacet: SvgFacet,
  svgs: string[],
  svgType: string,
  ethers: any
) {
  console.log("starting Upload");

  let svgItemsStart = 0;
  let svgItemsEnd = 0;
  while (true) {
    let itemsSize = 0;
    while (true) {
      console.log("continuing Upload");
      if (svgItemsEnd === svgs.length) {
        console.log("continuing Upload");
        break;
      }
      itemsSize += svgs[svgItemsEnd].length;
      if (itemsSize > 24576) {
        break;
      }
      svgItemsEnd++;
    }
    const { svg, svgTypesAndSizes } = setupSvg(
      svgType,
      svgs.slice(svgItemsStart, svgItemsEnd),
      ethers
    );

    //this might be incorrect
    // printSizeInfo(svgType, svgTypesAndSizes[0].sizes);

    let tx = await svgFacet.storeSvg(svg, svgTypesAndSizes);
    console.log("tx:", tx.hash);
    let receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }

    // console.log(svgItemsEnd, svg.length);
    if (svgItemsEnd === svgs.length) {
      break;
    }
    svgItemsStart = svgItemsEnd;
  }
}

export async function updateSvgs(
  svgs: string[],
  svgType: string,
  svgIds: number[],
  svgFacet: SvgFacet,
  ethers: any
) {
  for (let index = 0; index < svgIds.length; index++) {
    const svgId = svgIds[index];
    const svg = svgs[index];
    let svgLength = new TextEncoder().encode(svg).length;
    const array = [
      {
        svgType: svgTypeToBytes(svgType, ethers),
        ids: [svgId],
        sizes: [svgLength],
      },
    ];

    let tx = await svgFacet.updateSvg(svg, array);
    console.log("tx:", tx.hash);
    // console.log("tx hash:", tx.hash);
    let receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
  }
}

export async function uploadOrUpdateSvg(
  svg: string[],
  svgType: string,
  svgId: number[],
  svgFacet: SvgFacet,
  ethers: any
) {
  // if (typeof svg === "number") svg = [""];
  const idUpload = [];
  const svgUpload = [];
  const idUpdate = [];
  const svgUpdate = [];

  for (let i = 0; i < svgId.length; i++) {
    try {
      await svgFacet.getSvg(svgTypeToBytes(svgType, ethers), svgId[i]);
      idUpdate.push(svgId[i]);
      svgUpdate.push(svg[i]);
    } catch (error) {
      idUpload.push(svgId[i]);
      svgUpload.push(svg[i]);
    }
  }

  if (idUpdate.length > 0) {
    console.log(`Svg ${svgType} #${idUpdate} exists, updating`);
    await updateSvgs(svgUpdate, svgType, idUpdate, svgFacet, ethers);
  }
  if (idUpload.length > 0) {
    console.log(`Svg ${svgType} #${idUpload} does not exist, uploading`);
    await uploadSvgs(svgFacet, svgUpload, svgType, ethers);
  }
}

export async function updateSvgTaskFront(_itemIds: number[]) {
  let taskArray = [];

  for (let index = 0; index < _itemIds.length; index++) {
    const itemId = _itemIds[index];
    const sideArrays = [front[itemId]];

    let taskArgsFront: UpdateSvgsTaskArgs = {
      svgIds: [itemId].join(","),
      svgType: `wearables`,
      svgs: [sideArrays].join("***"),
    };
    taskArray.push(taskArgsFront);
  }
  return taskArray;
}

//side must be front, left, right or back only
export async function updateSvgTaskForSvgType(
  _itemIds: number[],
  _side: string
) {
  let taskArgs: UpdateSvgsTaskArgs;
  const frontSvg = [];
  const leftSvg = [];
  const rightSvg = [];
  const backSvg = [];

  if ("front" === _side) {
    for (let i = 0; i < _itemIds.length; i++) {
      frontSvg.push(`***${front[_itemIds[i]]}`);
    }

    taskArgs = {
      svgIds: [_itemIds].join(","),
      svgType: `wearables`,
      svgs: [frontSvg].join("***"),
    };
    console.log("Task Arg IDs: ", taskArgs.svgIds);
    return taskArgs;
  } else if ("left" === _side) {
    for (let i = 0; i < _itemIds.length; i++) {
      leftSvg.push(`***${left[_itemIds[i]]}`);
    }

    taskArgs = {
      svgIds: [_itemIds].join(","),
      svgType: `wearables-left`,
      svgs: [leftSvg].join("***"),
    };
    console.log("Task Arg IDs: ", taskArgs.svgIds);
    return taskArgs;
  } else if ("right" === _side) {
    for (let i = 0; i < _itemIds.length; i++) {
      rightSvg.push(`***${right[_itemIds[i]]}`);
    }

    taskArgs = {
      svgIds: [_itemIds].join(","),
      svgType: `wearables-right`,
      svgs: [rightSvg].join("***"),
    };
    console.log("Task Arg IDs: ", taskArgs.svgIds);
    return taskArgs;
  } else if ("back" === _side) {
    for (let i = 0; i < _itemIds.length; i++) {
      backSvg.push(`***${back[_itemIds[i]]}`);
    }

    taskArgs = {
      svgIds: [_itemIds].join(","),
      svgType: `wearables-back`,
      svgs: [backSvg].join("***"),
    };
    console.log("Task Arg IDs: ", taskArgs.svgIds);
    return taskArgs;
  } else {
    console.log(
      "Not a proper wearables side, must be string of front, left, right or back ONLY"
    );
  }
}

//side must be left, right or back only
export async function updateSleevesTaskForSvgType(
  _itemIds: number[],
  _side: string
) {
  let taskArgs: UpdateSvgsTaskArgs;
  const frontSvg = [];
  const leftSvg = [];
  const rightSvg = [];
  const backSvg = [];
  const sleeveId = [];

  if ("front" === _side) {
    for (let i = 0; i < _itemIds.length; i++) {
      frontSvg.push(`***${frontSleeve[_itemIds[i]]}`);
      sleeveId.push(_itemIds[i]);
    }
    taskArgs = {
      svgIds: sleeveId.join(","),
      svgType: `sleeves`,
      svgs: [frontSvg].join("***"),
    };
    console.log("Task Arg IDs: ", taskArgs.svgIds);
    return taskArgs;
  } else if ("left" === _side) {
    for (let i = 0; i < _itemIds.length; i++) {
      leftSvg.push(`***${leftSleeve[_itemIds[i]]}`);
      sleeveId.push(_itemIds[i]);
    }
    taskArgs = {
      svgIds: sleeveId.join(","),
      svgType: `sleeves-left`,
      svgs: [leftSvg].join("***"),
    };
    console.log("Task Arg IDs: ", taskArgs.svgIds);
    return taskArgs;
  } else if ("right" === _side) {
    for (let i = 0; i < _itemIds.length; i++) {
      rightSvg.push(`***${rightSleeve[_itemIds[i]]}`);
      sleeveId.push(_itemIds[i]);
    }
    taskArgs = {
      svgIds: sleeveId.join(","),
      svgType: `sleeves-right`,
      svgs: [rightSvg].join("***"),
    };
    console.log("Task Arg IDs: ", taskArgs.svgIds);
    return taskArgs;
  } else if ("back" === _side) {
    for (let i = 0; i < _itemIds.length; i++) {
      backSvg.push(`***${backSleeve[_itemIds[i]]}`);
      sleeveId.push(_itemIds[i]);
    }
    taskArgs = {
      svgIds: sleeveId.join(","),
      svgType: `sleeves-back`,
      svgs: [backSvg].join("***"),
    };
    console.log("Task Arg IDs: ", taskArgs.svgIds);
    return taskArgs;
  } else {
    console.log(
      "Not a proper sleeve side, must be string of left, right or back ONLY"
    );
  }
}

//name and _itemIds arrays must have the same length
export async function updateBaadgeTaskForSvgType(
  name: string[],
  folder: string,
  _itemIds: number[]
) {
  let taskArgs: UpdateSvgsTaskArgs;
  const baadgeSvg: string[] = [];

  if (name.length === _itemIds.length) {
    for (let i = 0; i < _itemIds.length; i++) {
      const item: string = fs.readFileSync(
        `./svgs/${folder}/${name[i]}.svg`,
        "utf8"
      );

      baadgeSvg.push(`***${item}`);
    }

    taskArgs = {
      svgIds: [_itemIds].join(","),
      svgType: `wearables`,
      svgs: [baadgeSvg].join("***"),
    };
    return taskArgs;
  } else {
    console.log("File Names array is not equal to IDs array");
  }
}

export async function updateSvgTaskForSideViews(_itemIds: number[]) {
  const sideViews = ["left", "right", "back"];
  let taskArray = [];

  for (let index = 0; index < _itemIds.length; index++) {
    const itemId = _itemIds[index];
    const sideArrays = [left[itemId], right[itemId], back[itemId]];

    for (let index = 0; index < sideViews.length; index++) {
      const side = sideViews[index];
      const sideArray = sideArrays[index];

      let taskArgsSides: UpdateSvgsTaskArgs = {
        svgIds: [itemId].join(","),
        svgType: `wearables-${side}`,
        svgs: [sideArray].join("***"),
      };
      taskArray.push(taskArgsSides);
    }
  }
  return taskArray;
}

export async function updateSvgTaskForSideSleeves(_itemIds: number[]) {
  const sideViews = ["left", "right", "back"];
  let taskArray = [];

  //for sleeves, we have to make sure all the arrays have the same length
  if (
    leftSleeve.length !== rightSleeve.length ||
    leftSleeve.length !== backSleeve.length
  ) {
    console.error("Sleeves arrays are not the same length");
    return;
  }
  for (let index = 0; index < _itemIds.length; index++) {
    const itemId = _itemIds[index];
    const sideArrays = [
      leftSleeve[itemId],
      rightSleeve[itemId],
      backSleeve[itemId],
    ];

    for (let index = 0; index < sideViews.length; index++) {
      const side = sideViews[index];
      const sideArray = sideArrays[index];

      let taskArgsSides: UpdateSvgsTaskArgs = {
        svgIds: [itemId].join(","),
        svgType: `sleeves-${side}`,
        svgs: [sideArray].join("***"),
      };
      taskArray.push(taskArgsSides);
    }
  }
  return taskArray;
}

export async function uploadSvgTaskForBaadges(
  itemTypeInput: ItemTypeInputNew[],
  svgFileName: string
) {
  let taskArray = [];

  for (let index = 0; index < itemTypeInput.length; index++) {
    if (!itemTypeInput[index].canBeTransferred) {
      let taskArgs: AddBaadgeTaskArgs = {
        itemManager: itemManager,
        svgFile: svgFileName,
        svgIds: [itemTypeInput[index].svgId].join(","),
        svgArrayIndex: index.toString(),
      };
      taskArray.push(taskArgs);
    } else {
      console.log(
        itemTypeInput[index].name + " canBeTransferred must be set to FALSE"
      );
    }
  }
  return taskArray;
}

export async function mintSvgTaskForBaadges(fileName: string) {
  let taskArgs: MintBaadgeTaskArgs = {
    itemManager: itemManagerAlt,
    itemFile: fileName,
    uploadItemTypes: true,
    sendToItemManager: true,
  };

  return taskArgs;
}

export async function airdropTaskForBaadges(
  itemTypeInput: ItemTypeInputNew[],
  awardsArray: number[]
) {
  const itemInfo = itemTypeInput[0];

  let taskArgs: AirdropBaadgeTaskArgs = {
    maxProcess: [itemInfo.maxQuantity].join(","),
    badgeIds: [itemInfo.svgId].join(","),
    awardsArray: [awardsArray].join("***"),
  };
  return taskArgs;
}

export async function collateralsUpdateForSvgTask(
  _itemIds: number[],
  _side: string
) {
  let taskArgs: UpdateSvgsTaskArgs;
  const frontSvg = [];
  const leftSvg = [];
  const rightSvg = [];

  if ("front" === _side) {
    for (let i = 0; i < _itemIds.length; i++) {
      frontSvg.push(`***${collateralFront[_itemIds[i]]}`);
    }

    taskArgs = {
      svgIds: [_itemIds].join(","),
      svgType: `collaterals`,
      svgs: [frontSvg].join("***"),
    };
    console.log("Task Arg IDs: ", taskArgs.svgIds);
    return taskArgs;
  } else if ("left" === _side) {
    for (let i = 0; i < _itemIds.length; i++) {
      leftSvg.push(`***${collateralsLeftSvgs[_itemIds[i]]}`);
    }

    taskArgs = {
      svgIds: [_itemIds].join(","),
      svgType: `collaterals-left`,
      svgs: [leftSvg].join("***"),
    };
    console.log("Task Arg IDs: ", taskArgs.svgIds);
    return taskArgs;
  } else if ("right" === _side) {
    for (let i = 0; i < _itemIds.length; i++) {
      rightSvg.push(`***${collateralsRightSvgs[_itemIds[i]]}`);
    }

    taskArgs = {
      svgIds: [_itemIds].join(","),
      svgType: `collaterals-right`,
      svgs: [rightSvg].join("***"),
    };
    console.log("Task Arg IDs: ", taskArgs.svgIds);
    return taskArgs;
  } else {
    console.log(
      "Not a proper collaterals side, must be string of front, left, right or back ONLY"
    );
  }
}

export async function eyeShapeUpdateForSvgTask(
  _itemIds: number[],
  _side: string,
  _haunt: number
) {
  let taskArgs: UpdateSvgsTaskArgs;
  const frontSvg = [];
  const leftSvg = [];
  const rightSvg = [];

  if (1 === _haunt) {
    if ("front" === _side) {
      for (let i = 0; i < _itemIds.length; i++) {
        frontSvg.push(`***${frontEyesH1[_itemIds[i]]}`);
      }

      taskArgs = {
        svgIds: [_itemIds].join(","),
        svgType: `eyeShapes`,
        svgs: [frontSvg].join("***"),
      };
      console.log("Task Arg IDs: ", taskArgs.svgIds);
      return taskArgs;
    } else if ("left" === _side) {
      for (let i = 0; i < _itemIds.length; i++) {
        leftSvg.push(`***${leftEyesH1[_itemIds[i]]}`);
      }

      taskArgs = {
        svgIds: [_itemIds].join(","),
        svgType: `eyeShapes-left`,
        svgs: [leftSvg].join("***"),
      };
      console.log("Task Arg IDs: ", taskArgs.svgIds);
      return taskArgs;
    } else if ("right" === _side) {
      for (let i = 0; i < _itemIds.length; i++) {
        rightSvg.push(`***${rightEyesH1[_itemIds[i]]}`);
      }

      taskArgs = {
        svgIds: [_itemIds].join(","),
        svgType: `eyeShapes-right`,
        svgs: [rightSvg].join("***"),
      };
      console.log("Task Arg IDs: ", taskArgs.svgIds);
      return taskArgs;
    } else {
      console.log(
        "Not a proper eyeShape side, must be string of front, left, right or back ONLY"
      );
    }
  } else if (2 === _haunt) {
    if ("front" === _side) {
      for (let i = 0; i < _itemIds.length; i++) {
        frontSvg.push(`***${frontEyesH2[_itemIds[i]]}`);
      }

      taskArgs = {
        svgIds: [_itemIds].join(","),
        svgType: `eyeShapesH2`,
        svgs: [frontSvg].join("***"),
      };
      console.log("Task Arg IDs: ", taskArgs.svgIds);
      return taskArgs;
    } else if ("left" === _side) {
      for (let i = 0; i < _itemIds.length; i++) {
        leftSvg.push(`***${leftEyesH2[_itemIds[i]]}`);
      }

      taskArgs = {
        svgIds: [_itemIds].join(","),
        svgType: `eyeShapesH2-left`,
        svgs: [leftSvg].join("***"),
      };
      console.log("Task Arg IDs: ", taskArgs.svgIds);
      return taskArgs;
    } else if ("right" === _side) {
      for (let i = 0; i < _itemIds.length; i++) {
        rightSvg.push(`***${rightEyesH2[_itemIds[i]]}`);
      }

      taskArgs = {
        svgIds: [_itemIds].join(","),
        svgType: `eyeShapesH2-right`,
        svgs: [rightSvg].join("***"),
      };
      console.log("Task Arg IDs: ", taskArgs.svgIds);
      return taskArgs;
    } else {
      console.log(
        "Not a proper eyeShape side, must be string of front, left, right or back ONLY"
      );
    }
  } else {
    console.log(
      "Not a proper haunt, must be 1 or 2... unless a new haunt has been deployed"
    );
  }
}

export async function aavegotchiUpdateForSvgTask(
  _itemIds: number[],
  _side: string
) {
  let taskArgs: UpdateSvgsTaskArgs;
  const frontSvg = [];
  const leftSvg = [];
  const rightSvg = [];
  const backSvg = [];

  if ("front" === _side) {
    for (let i = 0; i < _itemIds.length; i++) {
      frontSvg.push(`***${frontGotchiSvgs[_itemIds[i]]}`);
    }

    taskArgs = {
      svgIds: [_itemIds].join(","),
      svgType: `aavegotchi`,
      svgs: [frontSvg].join("***"),
    };
    console.log("Task Arg IDs: ", taskArgs.svgIds);
    return taskArgs;
  } else if ("left" === _side) {
    for (let i = 0; i < _itemIds.length; i++) {
      leftSvg.push(`***${aavegotchiSvgs.left[_itemIds[i]]}`);
    }

    taskArgs = {
      svgIds: [_itemIds].join(","),
      svgType: `aavegotchi-left`,
      svgs: [leftSvg].join("***"),
    };
    console.log("Task Arg IDs: ", taskArgs.svgIds);
    return taskArgs;
  } else if ("right" === _side) {
    for (let i = 0; i < _itemIds.length; i++) {
      rightSvg.push(`***${aavegotchiSvgs.right[_itemIds[i]]}`);
    }

    taskArgs = {
      svgIds: [_itemIds].join(","),
      svgType: `aavegotchi-right`,
      svgs: [rightSvg].join("***"),
    };
    console.log("Task Arg IDs: ", taskArgs.svgIds);
    return taskArgs;
  } else if ("back" === _side) {
    for (let i = 0; i < _itemIds.length; i++) {
      backSvg.push(`***${aavegotchiSvgs.back[_itemIds[i]]}`);
    }

    taskArgs = {
      svgIds: [_itemIds].join(","),
      svgType: `aavegotchi-back`,
      svgs: [backSvg].join("***"),
    };
    console.log("Task Arg IDs: ", taskArgs.svgIds);
    return taskArgs;
  } else {
    console.log(
      "Not a proper aavegotchi side, must be string of front, left, right or back ONLY"
    );
  }
}
