/* global ethers */
/* eslint-disable  prefer-const */
import axios from "axios";
import { PopulatedTransaction } from "ethers";

export async function sendToTenderly(
  to: string,
  from: string,
  transaction: PopulatedTransaction
) {
  const SIMULATE_API = `https://api.tenderly.co/api/v1/account/${process.env.TENDERLY_USER}/project/${process.env.TENDERLY_PROJECT}/simulate`;

  const txBody = {
    network_id: process.env.TENDERLY_NETWORK_ID,
    from,
    to,
    input: transaction.data,
    // tenderly specific
    save: true,
  };

  const opts = {
    headers: {
      "X-Access-Key": process.env.TENDERLY_ACCESS_KEY || "",
    },
  };

  return await axios.post(SIMULATE_API, txBody, opts);
}
