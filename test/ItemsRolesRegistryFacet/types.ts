export interface Commitment {
  grantor: string
  tokenAddress: string
  tokenId: number
  tokenAmount: number
}

export interface GrantRoleData {
  depositId: number
  role: string
  grantee: string
  expirationDate: number | null
  revocable: boolean
  data: string
}