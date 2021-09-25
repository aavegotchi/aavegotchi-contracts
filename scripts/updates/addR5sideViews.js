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
var wearables_sides_js_1 = require("../../svgs/wearables-sides.js");
var sideViewDimensions_js_1 = require("../../svgs/sideViewDimensions.js");
/* const hre = require("hardhat"); */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        function updateSvgs(svg, svgType, svgId, testing, uploadSigner) {
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
        var gasPrice, diamondAddress, account1Signer, account1Address, signer, owner, testing, dao, tx_1, receipt_1, accounts, account, itemSigner, updatingLeftSvgs, updatingRightSvgs, updatingBackSvgs, i, i, i, updatingSleevesLeft, updatingSleevesRight, updatingSleevesBack, i, i, i, svgViewsFacet, tx, receipt, numTraits1, wearables1, sidePreview;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    gasPrice = 100000000000;
                    diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
                    return [4 /*yield*/, hardhat_1.ethers.getContractAt("OwnershipFacet", diamondAddress)];
                case 1: return [4 /*yield*/, (_a.sent()).owner()];
                case 2:
                    owner = _a.sent();
                    testing = ["hardhat", "localhost"].includes(hre.network.name);
                    if (!testing) return [3 /*break*/, 10];
                    return [4 /*yield*/, hre.network.provider.request({
                            method: "hardhat_impersonateAccount",
                            params: [owner]
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, hardhat_1.ethers.getSigner(owner)];
                case 4:
                    signer = _a.sent();
                    return [4 /*yield*/, hardhat_1.ethers.getContractAt("DAOFacet", diamondAddress, signer)];
                case 5:
                    dao = _a.sent();
                    return [4 /*yield*/, hardhat_1.ethers.getSigners()];
                case 6:
                    account1Signer = (_a.sent())[0];
                    return [4 /*yield*/, account1Signer.getAddress()];
                case 7:
                    account1Address = _a.sent();
                    return [4 /*yield*/, dao.addItemManagers([account1Address])];
                case 8:
                    tx_1 = _a.sent();
                    return [4 /*yield*/, tx_1.wait()];
                case 9:
                    receipt_1 = _a.sent();
                    if (!receipt_1.status) {
                        throw Error("Error:: " + tx_1.hash);
                    }
                    return [3 /*break*/, 14];
                case 10:
                    if (!(hre.network.name === "matic")) return [3 /*break*/, 13];
                    return [4 /*yield*/, hardhat_1.ethers.getSigners()];
                case 11:
                    accounts = _a.sent();
                    return [4 /*yield*/, accounts[0].getAddress()];
                case 12:
                    account = _a.sent();
                    /* console.log("account:", account); */
                    signer = accounts[0]; //new LedgerSigner(ethers.provider);
                    return [3 /*break*/, 14];
                case 13: throw Error("Incorrect network selected");
                case 14:
                    if (testing) {
                        itemSigner = account1Signer;
                    }
                    else {
                        itemSigner = signer;
                    }
                    updatingLeftSvgs = 264;
                    updatingRightSvgs = 264;
                    updatingBackSvgs = 264;
                    i = 245;
                    _a.label = 15;
                case 15:
                    if (!(i < updatingLeftSvgs)) return [3 /*break*/, 18];
                    return [4 /*yield*/, updateSvgs(wearables_sides_js_1.wearablesLeftSvgs, "wearables-left", i, testing, itemSigner)];
                case 16:
                    _a.sent();
                    _a.label = 17;
                case 17:
                    i++;
                    return [3 /*break*/, 15];
                case 18:
                    i = 245;
                    _a.label = 19;
                case 19:
                    if (!(i < updatingRightSvgs)) return [3 /*break*/, 22];
                    return [4 /*yield*/, updateSvgs(wearables_sides_js_1.wearablesRightSvgs, "wearables-right", i, testing, itemSigner)];
                case 20:
                    _a.sent();
                    _a.label = 21;
                case 21:
                    i++;
                    return [3 /*break*/, 19];
                case 22:
                    i = 245;
                    _a.label = 23;
                case 23:
                    if (!(i < updatingBackSvgs)) return [3 /*break*/, 26];
                    return [4 /*yield*/, updateSvgs(wearables_sides_js_1.wearablesBackSvgs, "wearables-back", i, testing, itemSigner)];
                case 24:
                    _a.sent();
                    _a.label = 25;
                case 25:
                    i++;
                    return [3 /*break*/, 23];
                case 26:
                    updatingSleevesLeft = [36, 37, 38, 39, 40];
                    updatingSleevesRight = [36, 37, 38, 39, 40];
                    updatingSleevesBack = [36, 37, 38, 39, 40];
                    i = 0;
                    _a.label = 27;
                case 27:
                    if (!(i < updatingSleevesLeft.length)) return [3 /*break*/, 30];
                    return [4 /*yield*/, updateSvgs(wearables_sides_js_1.wearablesLeftSleeveSvgs, 'sleeves-left', updatingSleevesLeft[i], testing, itemSigner)];
                case 28:
                    _a.sent();
                    _a.label = 29;
                case 29:
                    i++;
                    return [3 /*break*/, 27];
                case 30:
                    i = 0;
                    _a.label = 31;
                case 31:
                    if (!(i < updatingSleevesRight.length)) return [3 /*break*/, 34];
                    return [4 /*yield*/, updateSvgs(wearables_sides_js_1.wearablesRightSleeveSvgs, 'sleeves-right', updatingSleevesRight[i], testing, itemSigner)];
                case 32:
                    _a.sent();
                    _a.label = 33;
                case 33:
                    i++;
                    return [3 /*break*/, 31];
                case 34:
                    i = 0;
                    _a.label = 35;
                case 35:
                    if (!(i < updatingSleevesBack.length)) return [3 /*break*/, 38];
                    return [4 /*yield*/, updateSvgs(wearables_sides_js_1.wearablesBackSleeveSvgs, 'sleeves-back', updatingSleevesBack[i], testing, itemSigner)];
                case 36:
                    _a.sent();
                    _a.label = 37;
                case 37:
                    i++;
                    return [3 /*break*/, 35];
                case 38: return [4 /*yield*/, hardhat_1.ethers.getContractAt("SvgViewsFacet", diamondAddress, itemSigner)];
                case 39:
                    svgViewsFacet = _a.sent();
                    return [4 /*yield*/, svgViewsFacet.setSideViewDimensions(sideViewDimensions_js_1.sideViewDimensions9, {
                            gasPrice: gasPrice
                        })];
                case 40:
                    tx = _a.sent();
                    return [4 /*yield*/, tx.wait()];
                case 41:
                    receipt = _a.sent();
                    if (!receipt.status) {
                        throw Error("Error:: " + tx.hash);
                    }
                    numTraits1 = [99, 99, 99, 99, 12, 9];
                    wearables1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    return [4 /*yield*/, svgViewsFacet.previewSideAavegotchi("2", "0xE0b22E0037B130A9F56bBb537684E6fA18192341", numTraits1, wearables1)];
                case 42:
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
exports.addR5sideViews = main;
