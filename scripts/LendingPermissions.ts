const noPermissionModifiers = {
  noPermissionsAllowed: 0,
  otherPermissionsAllowed: 1,
};

const channellingModifiers = {
  none: 0,
  channellingAllowedForAllBorrowers: 1,
  //new channelling permission modifiers can be added here up to 8
};

interface LendingPermissions {
  noPermissions: 0 | 1;
  channellingAllowed: 0 | 1;

  //new lending permissions can be added here up to 32
}

export function constructPermissionsBitMap(permissions: LendingPermissions) {
  let permissionsBitMap = BigInt(0);

  if (permissions.noPermissions == 0) {
    return 0;
  } else {
    //loop through all object keys and set the permissions
    const totalKeys = Object.keys(permissions).length;

    for (let i = 0; i < totalKeys; i++) {
      permissionsBitMap = storeValueInBitmap(
        Object.values(permissions)[i],
        i,
        permissionsBitMap
      );
    }
  }

  return permissionsBitMap;
}

function storeValueInBitmap(value: number, position: number, bitmap: any) {
  bitmap &= ~(BigInt(0xff) << (BigInt(position) * BigInt(8)));

  // Set the value in the specified position
  bitmap |= BigInt(value) << (BigInt(position) * BigInt(8));

  return bitmap;
}
