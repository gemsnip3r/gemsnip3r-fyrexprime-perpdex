import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email, taskID } = req.body;
  // taskID örn: 'twitter' veya 'telegram'
  const REWARDS = { 'twitter': 200, 'telegram': 200 };

  try {
    const user = await kv.hget('users', email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Görev daha önce yapıldı mı?
    if (user.tasks && user.tasks[taskID]) {
      return res.status(400).json({ error: 'Task already completed' });
    }

    // Puanı Ekle
    const reward = REWARDS[taskID] || 0;
    user.xp += reward;
    user.tasks = { ...user.tasks, [taskID]: true };

    // Güncelle
    await kv.hset('users', { [email]: user });
    await kv.zadd('leaderboard', { score: user.xp, member: email });

    return res.status(200).json({ success: true, newXP: user.xp });

  } catch (error) {
    return res.status(500).json({ error: 'Error updating task' });
  }
}