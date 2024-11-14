import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const CALENDAR_URL = process.env.CALENDAR_URL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {

  try {
    //const now = Date.now();

    if (!CALENDAR_URL) {
      throw new Error("Calendar URL is not configured");
    }

    // 新しいデータを取得
    const response = await axios.get(CALENDAR_URL, {
      responseType: "text",
    });
    res.status(200).send(response.data);
    
  } catch (error) {
    console.error("Calendar fetch error:", error);
    res.status(500).json({ error: "Failed to fetch calendar data" });
  }

  
}