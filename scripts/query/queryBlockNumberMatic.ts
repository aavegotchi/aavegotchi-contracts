import { blockllamaUrl } from "./queryAavegotchis";
import axios from "axios";

export interface ResponseData {
  height: number;
  timestamp: number;
}
export async function getDataForTimestamp(timestamp: number): Promise<any> {
  const url = `${blockllamaUrl}/${timestamp}`;
  try {
    const response = await axios.get(url);
    const res = response.data;
    return res.height;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
