import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // En yüksek 50 kişiyi çek
    const rawData = await kv.zrange('leaderboard', 0, 49, { rev: true, withScores: true });
    
    const leaderboard = [];
    for (let i = 0; i < rawData.length; i += 2) {
      // E-postayı maskele (ali***@gmail.com -> al***)
      let email = rawData[i];
      let name = email.split('@')[0];
      if (name.length > 3) name = name.substring(0, 3) + '***';
      
      leaderboard.push({
        name: name,
        xp: rawData[i + 1]
      });
    }

    return res.status(200).json(leaderboard);
  } catch (error) {
    return res.status(500).json([]);
  }
}