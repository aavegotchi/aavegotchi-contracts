export interface Record {
  grantor: string
  tokenAddress: string
  tokenId: number
  tokenAmount: number
}

export interface GrantRoleData {
  recordId: number
  role: string
  grantee: string
  expirationDate: number | null
  revocable: boolean
  data: string
}