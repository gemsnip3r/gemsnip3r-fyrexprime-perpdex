// api/leaderboard.js
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // Get top 10 users (Email and Score)
    // zrange returns array like [email1, score1, email2, score2...]
    const rawData = await kv.zrange('leaderboard', 0, 9, { rev: true, withScores: true });
    
    const leaderboard = [];
    for (let i = 0; i < rawData.length; i += 2) {
      leaderboard.push({
        email: rawData[i],
        xp: rawData[i + 1]
      });
    }

    return res.status(200).json(leaderboard);
  } catch (error) {
    return res.status(500).json([]);
  }
}