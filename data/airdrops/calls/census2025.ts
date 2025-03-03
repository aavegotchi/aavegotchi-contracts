const addresses = [
  "0xba39C047714B4CA6244Dc433D3AE3924691e0171",

  "0x49a338c8A8C92f3f7E5A4700A191bb41595591b2",
  "0x9f32B5A3A6A21dF1671c74372F18415CB3FCaca2",
  "0xe6390b6188DedbaF7339672cC4d75ee825b2654e",
  "0xDe34393312C0C1e97e404d18A04580E9610e063C",
  "0xDED7cfB53CF1658e07432a3c4C8C0064D5bD626A",
  "0x019Ed608dD806b80193942F2A960e7AC8aBb2EE3",

  "0xf5Fe364D18F4a5A53BADCe9a046ba74cfC97f6Fb",
  "0x5b1c410F66a0B0b7A8008E256406dFd18593e4Cf",

  "0x9ff84B91998dF96A6587DB8dDe8D4E47518107d6",
  "0x8B200F4c81c54d9014B4cDA3F16501069FA20Ab9",
  "0x07A009e9E98649Bff954cf3032ceB3E21E020f49",
  "0xf211D1166b9a07109174372fA2471e211Ce7286f",

  "0x51d1c0d1a4C7579d48C56C3aF758538cb60E5B23",

  "0x6519E6117480D140CD7d33163aC30fD01812f34a",
  "0x710a24b16ef692c1563e77AFc3f94b758921aa62",
  "0x4AdA1B9D9fe28aBd9585f58cfEeD2169A39e1c6b",
  "0xDb10d21f28a34FD04E4425eac777483798f7e217",

  "0x101aDDC07D63a6B35B199153252168aB9889Dca1",
  "0xcbef46a7cbe1f46a94ab77501eaa32596ab3c538",
  "0x38048aF4da7d79d2b553836a6d4950d0AC4B60f7",
  "0x8CbF96319b3C56d50a7C82EFb6d3c46bD6f889Ba",
  "0xC0Ab521Fa3FF034029C206eEBbb481E06c8d8BB5",
  "0x8C779811306cee2faFc908C557cCB4be9FF20A01",
  "0xa322f14c4e9628F5934420a6098a01e7C999e657",
  "0x693d30bf2a44Db4D3aE23F1198997fD5D7B2eA11",
  "0x96Fe6681b5b8bE0C5d6e8EB690ADEc7Ecb0831C9",
  "0xa5Fa57608C5698120A7C3c9d50EC346bb3980223",

  "0xDf572e905E2730EfDBFb8D11829571D3a516Acd3",
  "0x79D87C8BEf0f0620d773983a6bE6DdCa784ca8a9",

  "0xa9465D03BA38726277B3E478AC98Aa063A0c8D0a",

  "0x74BF5B9972Da24406C2c046494a5cCBE2fBa28Dc",

  "0x638dd68ae2a2563645fcaaff2e84910aa21f9ae6",
  "0x6157730C4F8e2092f601460B836530E3252B3120",

  "0x2e21407be0545C706F25490fbBA532943fCaED32",
  "0x551486c2335D027662B4C603AC203D7a7b30320e",
  "0xA60CA8a1400333468a736c7247BAad6350C6496d",
  "0x543d8004aFA943344E6fba44E189ed0DD4E71D56",
  "0x1d0542b616c691a002e90a713e7d094c0f8e022d",
  "0x3d3D9E2f292aB523d2c518813Be4416d1D641621",
  "0x2Bf034ecCEbc8CD60Dab9c249b6c2996Dcb7D8EC",
  "0x7dbFE62Be1aC737d26823611F251d362C52A1141",
  "0x43FF4C088df0A425d1a519D3030A1a3DFff05CfD",
  "0x0d15764e7F13E780CA0ae83A15A8D819Db05ef2b",

  "0x543d8004aFA943344E6fba44E189ed0DD4E71D56",
  "0x2fa37cb96c19E9B1F9aD060AEd00C0CFC727AE39",
  "0xF0b5370c0c512BECD7aa85FC8c5CAd69b6Cca126",
  "0xABf128d4be3072cDfCB021E702D2B8d8437c789d",
  "0x43fbF8dD759778a54Fd50C3F0AADfBf47c490451",
  "0x40aed3f394F2F0c168D4033a31eCF2248197dDFB",
  "0xFb1398aC62F7DA1c7034B01813263DDc8E7a266A",
  "0xdDDff3048C1d89FA8fE1221b7bC35624622B9058",
  "0xac4734d5Cd80C12F3C90edc9DC5589C11ee17896",
  "0x296eCBBEa7Df97B1Def2996bC2d727bAD8515Bb2",
  "0xfEc90ee4A1EA9CCFF0D1971c61FE5A4488594A58",
  "0xE1a1d5c32888c5b140917B296e82cf3A448F37A6",
  "0xc2862D80Fb768b58484df1d744149B900D74Df65",

  "0xe5F6Dbc39334f3E79C149efB8C8c9c8dEc474aF1",
  "0x37E2A074b7BED2Bf2e35c3767a8b673dB2658Bcc",
  "0xE2dE15659663F7024699E1e573C033e2EFD5bCb1",
  "0xa98E714577AD2B41efBCb5f79C3Cd663bC806905",

  "0x4BE9c62014789DE188D8379AfF628F279e4993b2",

  "0x3fc3e6514fd4925f55fb3ae17bbfbca2eb126608",
  "0x2848b9f2D4FaEBaA4838c41071684c70688B455d",
  "0xa6ab5ca03954E8B2bb54e9006efb8e68824271Fa",
  "0x677975399cbd8aa7BD17A4B87C04Ed07A85978d4",
  "0xdc25324B8186DE47A976191a54ea0366428Af632",
  "0x14e495f1C792185C4491B2317a02f3C3c6775C82",
  "0x77427023E70Cafd983dABaF3488D8D83ECB15b96",

  "0x5CC81f1AfA43f8f3c65FC9Ce96D5a0568F4E285F",
  "0x35001A8Bdb3a224D05F086094c12fd4c9009986D",
  "0xf47D661d3775F99AF434e536c49042B699e26715",
  "0x1BdEbAf12ec0CE61bCfc4c8e2bB15f1286fbfE2A",
  "0xbb73548A0e6F839fb58e9D59969Ba6AEdEcDF5f1",
  "0x5AB06FB01670CcC2750143b9F6863d485c0371C3",
  "0xb26B5566CB575990cd5Dd9c93c43eE39A02BeFBA ",
  "0x59fc6b4E064B62cc7Aed200a71aef3eac36C1287",
  "0xe7824cfa1c9fafa4767df34305123f3151a00f1b",

  "0x984C48852F92288Bd1AfD6FF5d9c26e3d0a9339A",

  "0x5f9CE0c2804AF2a678D33E3617eE829c00EF6Be0",

  "0xF1b2caF073b70DCa2BF8D540670abc9d7cC76882",
  "0xa9A0C84Fe5780d5a5C67cc14165b546F8eC6DCAb",
  "0x7D20E3aE9A4198c2CfC0E2d1D0Bb81cBc41ab0A0",
  "0x4eb172821B5bC013269c4F6f6204F092D44197EC",
  "0xA2faa3405a734c04aE713AAa837E6cEcC2cAee9F",
  "0xED75012f14d89E87d2505AD6DBC0B8F591c660ea",
  "0x3ca2e945a3bc25399c75f49e9e45d34d897c1041",

  "0x4eDb4161D16c89b71Aec027930a943c3d4cf0777",
  "0xE1bCD0f5c6c855ee3452B38E16FeD0b7Cb0CC507",
  "0x3AeF590Df6feBaA81477c1CEa3009BB9e096730c",
  "0xc4Cb6cB969e8b4e309Ab98E4Da51b77887aFaD96",
  "0x3c2B45D1a4accB2c639C35bD0106D45C20424e8e",
  "0x19e02B992c0295D27eeCfF941D5DBFAF85409D86",

  "0x01C3dD0607e189d8ec94c740cf5926dB4f38Bf3f",

  "0x8840603A7dF575A6ea1F70280d4001b64282AAA8",
  "0xa532F169ceE0e551D4Da641031Ac78fd85461035",

  "0x4dAE5b5bf3dC068BDFEC47b8B402AFf28fe6707F",
  "0xB652158F67b9Fb39c29412d6F8e1C563FF6724f2",

  "0x735194B0FF3d9fCA8561770EBf484eaC90b46647",
  "0x472d7E705f3baa44f82bFF5B397330015d810828",
  "0x03b16Ab6e23BdBeEAB719d8e4C49D63674876253",
  "0xf1950fc03486A502b05F93Df1a7A4EDC741257C6",
  "0xd695A06b2A430E351e7eF94506ed6935F6f35eAF",
  "0x9f92Dd5Ee09A798E49d558b98Fdb1f22A2062c2b",
  "0x05EBFf07711A5B6042c27FDaa683a5c6D55b6684",
  "0xE9DA1801ADCB61a41C6bdfDB7049C5e14383e8fD",
  "0x75bbECBC4fA323d304E41Dd383f1F1878288DB00",

  "0xcAD2Bfa256Bc37F03c47099f465a8AD09D5b444d",

  "0x38FF11d71e32D6a97da15bdcFbcdFccdeDA9e637",
  "0x0030B9F1925408D79be83C7cecfffdbACb638e9B",
  "0xc89A3292Eb0a8396A2505deB6195AFA7f83A8A30",
  "0x852271883ed42CC3F9D9559b05aB4784Fc768E93",

  "0x00987cbCE7014389197f9D5468Dab5A8facFfeE0",
  "0xFaFf4170E628Aef5c5ce84C47eBDDB5A99517fe2",
  "0x119B91827dF70f4378De9912FdfA101fb40364b8",

  "0x2D5f86cd294cA6c92189340EaEFf41fc63Dc66EF",

  "0xAf568b4ACaB91A8119994C69B86648271346796d",
  "0xA7f1C77998bAe58614Be010AD2A806639E280056",
  "0x0725Faf58E743002FF5869754B71032D3E88AA02",
  "0x478fa4C971a077038B4Fc5C172c3Af5552224ccc",
  "0x7540DB3e26D453EE6298bbdD263a8e4D88BfBE7F",
  "0x6d06dD922210C87DF1F532B4805bAdf782e598B9",
  "0x77f4e1c69efb78625244dd1c7d9e05b7411a7768",
  "0x17a3831B39cc557296d0C322f9C2D42C0b3A8F3f",
  "0x1EFff6c55a8757Ae57d758f030EdF4B0484d8510",

  "0x7b3012531aaEd7b48bc9BfbC1cd7E7f20B1BB5b8",
  "0xD94A33d2791AE1EEb30e2295276F6b82c17C02cb",
  "0xBDc7a955505e20410061744f556f6dEC761Bfb8f",
  "0x180f207F8747a966EC94277a69610162D7FA3FF1",
  "0xC727Bff1962590C71A6CB56C6D11F37beE740A5D",

  "0x4d00b44569c615f49f50814e4328f354b89e9efe",
  "0x59E9F8f07F9D339C48c8521af341A1A2337a9E22",
  "0x6fcf9D80e2b597F4B3FA764b5626F573a9Fc93D3",
  "0x5b95A971B4583A5f011E9DA082acdD679b870D06",
  "0x26bac3547908E923b641C186000585E8cE98F4Db",
  "0x071D217637b6322a7faaC6895a9EB00e529D3424",
  "0x2127AA7265D573Aa467f1D73554D17890b872E76",

  "0x9080196182F77B89BB5B0EeE3Ddb48cFA716c4c3",
  "0xf8A52A9d5E7E87dff2E815D3Ac3e4E7866e54e2E",
  "0x1e9fb5428855064b5c38e3ae96cc9878c573ed53",
  "0xAABd5fBcb8ad62D4FbBB02a2E9769a9F2EE7e883",
  "0xbe67d6800fab847f99F81A8E25b0F8d3391785a2",
  "0x99959f1A3c5464C78bf446Bd1117a3EC44c7684e",
  "0xEdA29227543b2BC0d8e4A5220EF0a34868033A2d",
  "0x579361d2636152df34DB1d6dFD343f5037dDC71D ",
  "0x65E856C356f0c220fC69C51A66B007748C7596e4",
  "0x8f652eFf4ba275E023F124a98aF86025aB0e5Eec",

  "0x23D204407A546c2A0111Cf2aABD05e274FE8c419",

  "0xb9FF017c875F5C39d0018D1dF86FbD92943d5b82",

  "0x072B96cF92Aa03f453CcFb114A166D11f88A3414",
  "0xfFea5a2cfAF1AaFbB87A1FE4eED5413DA45C30a0",
  "0xc8dcf0d52649ff340266f5fE69d4ba8e9498ecCC",
];

exports.addresses = addresses;
