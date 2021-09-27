"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var hardhat_1 = require("hardhat");
/* import {  } from "../../tasks/addItemTypes"; */
/* import { maticDiamondAddress } from "../helperFunctions"; */
/* import { HardhatRuntimeEnvironment } from "hardhat/types"; */
var wearables_sides_js_1 = require("../../svgs/wearables-sides.js");
var sideViewDimensions_js_1 = require("../../svgs/sideViewDimensions.js");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        /*   let owner = await (
            await ethers.getContractAt("OwnershipFacet", diamondAddress)
          ).owner();
          const testing = ["hardhat", "localhost"].includes(hre.network.name);
        
          if (testing) {
            await hre.network.provider.request({
              method: "hardhat_impersonateAccount",
              params: [owner],
            });
            signer = await ethers.getSigner(owner);
            let dao = await ethers.getContractAt("DAOFacet", diamondAddress, signer);
            [account1Signer] = await ethers.getSigners();
            account1Address = await account1Signer.getAddress();
            let tx = await dao.addItemManagers([account1Address]);
            let receipt = await tx.wait();
            if (!receipt.status) {
              throw Error(`Error:: ${tx.hash}`);
            }
          } else if (hre.network.name === "matic") {
            const accounts = await ethers.getSigners();
            const account = await accounts[0].getAddress();
        
            signer = accounts[0]; //new LedgerSigner(ethers.provider);
          } else {
            throw Error("Incorrect network selected");
          } */
        function updateSvgs(svg, svgType, svgId, uploadSigner) {
            return __awaiter(this, void 0, void 0, function () {
                var svgFacet, svgLength, array, tx, receipt;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, hardhat_1.ethers.getContractAt("SvgFacet", diamondAddress, uploadSigner)];
                        case 1:
                            svgFacet = _a.sent();
                            svgLength = new TextEncoder().encode(svg[svgId]).length;
                            array = [
                                {
                                    svgType: hardhat_1.ethers.utils.formatBytes32String(svgType),
                                    ids: [svgId],
                                    sizes: [svgLength]
                                },
                            ];
                            return [4 /*yield*/, svgFacet.updateSvg(svg[svgId], array, {
                                    gasPrice: gasPrice
                                })];
                        case 2:
                            tx = _a.sent();
                            return [4 /*yield*/, tx.wait()];
                        case 3:
                            receipt = _a.sent();
                            if (!receipt.status) {
                                throw Error("Error:: " + tx.hash);
                            }
                            return [2 /*return*/];
                    }
                });
            });
        }
        var gasPrice, diamondAddress, account1Signer, account1Address, signer, itemSigner, updatingLeftSvgs, updatingRightSvgs, updatingBackSvgs, i, i, i, svgViewsFacet, tx, receipt, numTraits1, wearables1, sidePreview;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    gasPrice = 100000000000;
                    diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
                    itemSigner = signer;
                    updatingLeftSvgs = [229];
                    updatingRightSvgs = [229];
                    updatingBackSvgs = [144, 145, 229];
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < updatingLeftSvgs.length)) return [3 /*break*/, 4];
                    return [4 /*yield*/, updateSvgs(wearables_sides_js_1.wearablesLeftSvgs, "wearables-left", updatingLeftSvgs[i], itemSigner)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    i = 0;
                    _a.label = 5;
                case 5:
                    if (!(i < updatingRightSvgs.length)) return [3 /*break*/, 8];
                    return [4 /*yield*/, updateSvgs(wearables_sides_js_1.wearablesRightSvgs, "wearables-right", updatingRightSvgs[i], itemSigner)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    i++;
                    return [3 /*break*/, 5];
                case 8:
                    i = 0;
                    _a.label = 9;
                case 9:
                    if (!(i < updatingRightSvgs.length)) return [3 /*break*/, 12];
                    return [4 /*yield*/, updateSvgs(wearables_sides_js_1.wearablesBackSvgs, "wearables-back", updatingBackSvgs[i], itemSigner)];
                case 10:
                    _a.sent();
                    _a.label = 11;
                case 11:
                    i++;
                    return [3 /*break*/, 9];
                case 12: return [4 /*yield*/, hardhat_1.ethers.getContractAt("SvgViewsFacet", diamondAddress, itemSigner)];
                case 13:
                    svgViewsFacet = _a.sent();
                    return [4 /*yield*/, svgViewsFacet.setSideViewDimensions(sideViewDimensions_js_1.sideViewDimensions8, {
                            gasPrice: gasPrice
                        })];
                case 14:
                    tx = _a.sent();
                    return [4 /*yield*/, tx.wait()];
                case 15:
                    receipt = _a.sent();
                    if (!receipt.status) {
                        throw Error("Error:: " + tx.hash);
                    }
                    numTraits1 = [99, 99, 99, 99, 12, 9];
                    wearables1 = [0, 0, 0, 145, 229, 229, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    return [4 /*yield*/, svgViewsFacet.previewSideAavegotchi("2", "0xE0b22E0037B130A9F56bBb537684E6fA18192341", numTraits1, wearables1)];
                case 16:
                    sidePreview = _a.sent();
                    console.log("Side Preview: ", sidePreview);
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .then(function () { return process.exit(0); })["catch"](function (error) {
    console.error(error);
    process.exit(1);
});
exports.sideViewsUpdate3 = main;
