//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;
//pragma experimental ABIEncoderV2;

import "@nomiclabs/buidler/console.sol";

contract SvgLayer250 {  
  function getSvg() pure external returns (string memory) {
    return '20h64v3H0z"/><path fill=ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"url(#d)" dddddfdfasfdsafasdfdsafasds="M0 24h64vdfasdfdsfdsfdsadfasdfasdfsdfsadfasfasd8H0z"/></c260fl(#f)" fill="#c260ff" transform="matrix(1 0  0 64)" d=g>';
  }
}

contract SvgLayer1K {  
  function getSvg() pure external returns (string memory) {
    return '"c" patternUnits="userSpaceOnUse" x="-2" y="0" width="8" height="1"><path d="M0 0h1v1H0zm2 0h1v1H2zm2 0h1v1H4z"/></pattern><pattern id="d" patternUnits="userSpaceOnUse" x="0" y="0" width="4" height="4"><path d="M0 0h1v1H0zm0 2h1v1H0zm1 0V1h1v1zm1 0h1v1H2zm0-1h1V0H2zm1 2h1v1H3z"/></pattern><pattern id="e" patternUnits="userSpaceOnUse" width="64" height="32"><path d="M4 4h1v1H4zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1z"/><path fill="url(#a)" d="M0 8h64v7H0z"/><path fill="url(#b)" d="M0 16h64v1H0z"/><path fill="url(#c)" d="M0 18h64v1H0z"/><path fill="url(#b)" d="M22 18h15v1H22zM0 20h64v3H0z"/><path fill="url(#d)" d="M0 24h64v8H0z"/></pattern><mask id="f"><path fill="url(#e)" d="M0 0h64v32H0z"/></mask></defs><path fill="#c260ff" d="M0 0h64v32H0z"/><path fill="#dea8ff" mask="url(#f)" d="M0 0h64v32H0z"/><path fill="#dea8ff" d="M0 32h64v32H0z"/><path mask="url(#f)" fill="#c260ff" transform="matrix(1 0 0 -1 0 64)" d="M0 0h64v32H0z"/></svg>';
  }
}


contract Svg {
  

  struct SVGContract {
    address svgContract;
    uint16 offset;
    uint16 size;
  }
  SVGContract[] svgs;
  string[] svg;
  

  function setSvg(string calldata _svg) external {
    //console.log("Changing greeting from '%s' to '%s'", greeting, _greeting);
    //greeting = _greeting;
    svg.push(_svg);    
  }

  function setSvgContract(string calldata _svg, uint[] memory sizes) external {
    // 61_00_00 -- PUSH2 (size)
    // 60_00 -- PUSH1 (code position)
    // 60_00 -- PUSH1 (mem position)    
    // 39 CODECOPY
    // 61_00_00 PUSH2 (size)
    // 60_00 PUSH1 (mem position)
    // f3 RETURN 
    bytes memory init = hex"610000_600e_6000_39_610000_6000_f3";                           
    byte size1 = byte(uint8(bytes(_svg).length));
    byte size2 = byte(uint8(bytes(_svg).length >> 8));
    init[2] = size1;
    init[1] = size2;
    init[10] = size1;
    init[9] = size2;    
    bytes memory code = abi.encodePacked(init, _svg);
        
    address newSvgContract;
    
    assembly {
      newSvgContract := create(0, add(code, 32), mload(code))
    }
    uint offset = 0;
    for(uint i; i < sizes.length; i++) {
      svgs.push(SVGContract(newSvgContract,uint16(offset),uint16(sizes[i])));
      offset += sizes[i];
    }
    
  }

  /*
   function setSvgContract(string calldata _svg) external {
    // 61_00_00 -- PUSH2 (size)
    // 60_00 -- PUSH1 (code position)
    // 60_00 -- PUSH1 (mem position)    
    // 39 CODECOPY
    // 61_00_00 PUSH2 (size)
    // 60_00 PUSH1 (mem position)
    // f3 RETURN 
    bytes memory init = hex"610000_600e_6000_39_610000_6000_f3";                           
    byte size1 = byte(uint8(bytes(_svg).length));
    byte size2 = byte(uint8(bytes(_svg).length >> 8));
    init[2] = size1;
    init[1] = size2;
    init[10] = size1;
    init[9] = size2;    
    bytes memory code = abi.encodePacked(init, _svg);
        
    address newSvgContract;
    
    assembly {
      newSvgContract := create(0, add(code, 32), mload(code))
    }
    
    svgContract[1] = newSvgContract;
  }
  */

  //function setSvgContract250() external {
    // 61_00_00 -- PUSH2 (size)
    // 60_00 -- PUSH1 (code position)
    // 60_00 -- PUSH1 (mem position)    
    // 39 CODECOPY
    // 61_00_00 PUSH2 (size)
    // 60_00 PUSH1 (mem position)
    // f3 RETURN 
    //bytes memory init = hex"610000_600e_6000_39_610000_6000_f3";                           
    //byte size1 = byte(uint8(bytes(_svg).length));
    //byte size2 = byte(uint8(bytes(_svg).length >> 8));
    //init[2] = size1;
    //init[1] = size2;
    //init[10] = size1;
    //init[9] = size2;
    //uint initLength = init.length;
    //uint newSize = init.length + bytes(_svg).length;
    //bytes memory code = abi.encodePacked(init, _svg);
    //assembly {
    //  _svg := sub(_svg, initLength)
    //}


    //string memory data = _svg;    
    //address newSvgContract;
    /*
    assembly {
      newSvgContract := create(0, add(_svg, 32), mload(_svg))
    }
    */
    //newSvgContract = address(new SvgLayer250());
    //svgContract[1] = newSvgContract;
  //}

  //function setSvgContract1K() external {
    // 61_00_00 -- PUSH2 (size)
    // 60_00 -- PUSH1 (code position)
    // 60_00 -- PUSH1 (mem position)    
    // 39 CODECOPY
    // 61_00_00 PUSH2 (size)
    // 60_00 PUSH1 (mem position)
    // f3 RETURN 
    //bytes memory init = hex"610000_600e_6000_39_610000_6000_f3";                           
    //byte size1 = byte(uint8(bytes(_svg).length));
    //byte size2 = byte(uint8(bytes(_svg).length >> 8));
    //init[2] = size1;
    //init[1] = size2;
    //init[10] = size1;
    //init[9] = size2;
    //uint initLength = init.length;
    //uint newSize = init.length + bytes(_svg).length;
    //bytes memory code = abi.encodePacked(init, _svg);
    //assembly {
    //  _svg := sub(_svg, initLength)
    //}


    //string memory data = _svg;    
    //address newSvgContract;
    /*
    assembly {
      newSvgContract := create(0, add(_svg, 32), mload(_svg))
    }
    */
    //newSvgContract = address(new SvgLayer1K());
    //svgContract[25] = newSvgContract;
  //}
  
  
}
