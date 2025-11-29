// api/join.js
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email, referrerCode } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    // 1. Kullanıcı zaten var mı?
    const existingUser = await kv.hget('users', email);
    if (existingUser) {
      return res.status(200).json(existingUser);
    }

    // 2. Yeni Kullanıcı Oluştur (Gerçek Kod Üretimi)
    // Emailin baş harfleri + Rastgele sayı (Örn: MONA-X92A)
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const myCode = `MONA-${randomPart}`;
    
    let xp = 100; // Başlangıç puanı

    // 3. Referans Kontrolü (Biri davet ettiyse)
    if (referrerCode) {
      const referrerEmail = await kv.hget('codes', referrerCode);
      if (referrerEmail) {
        // Davet edene +100 XP ver
        const referrerData = await kv.hget('users', referrerEmail);
        if (referrerData) {
          referrerData.xp += 100;
          referrerData.inviteCount = (referrerData.inviteCount || 0) + 1;
          await kv.hset('users', { [referrerEmail]: referrerData });
          
          // Leaderboard'u güncelle
          await kv.zadd('leaderboard', { score: referrerData.xp, member: referrerEmail });
        }
        // Yeni gelene de ekstra bonus (Opsiyonel)
        xp += 50; 
      }
    }

    const newUser = { email, myCode, xp, inviteCount: 0 };

    // 4. Veritabanına Kaydet
    await kv.hset('users', { [email]: newUser }); // Kullanıcı verisi
    await kv.hset('codes', { [myCode]: email });  // Kod -> Email eşleşmesi
    await kv.zadd('leaderboard', { score: xp, member: email }); // Sıralama

    return res.status(200).json(newUser);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Database connection failed' });
  }
}