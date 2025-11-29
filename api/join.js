import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email, referrerCode } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    // 1. Kullanıcı zaten var mı kontrol et
    const existingUser = await kv.hget('users', email);
    if (existingUser) return res.status(200).json(existingUser);

    // 2. Yeni Kişiye Özel Kod Üret (Gerçek)
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    const myCode = `MONA-${randomPart}`;
    
    let xp = 100; // Başlangıç XP

    // 3. Referans Kontrolü (Varsa Davet Edene XP ver)
    if (referrerCode) {
      const referrerEmail = await kv.hget('codes', referrerCode);
      if (referrerEmail) {
        // Davet edene +150 XP (Invite Bonusu)
        await kv.zincrby('leaderboard', 150, referrerEmail);
        
        // Davet eden kullanıcının metadata'sını güncelle
        const refUser = await kv.hget('users', referrerEmail);
        if (refUser) {
          refUser.xp += 150;
          refUser.inviteCount = (refUser.inviteCount || 0) + 1;
          await kv.hset('users', { [referrerEmail]: refUser });
        }
        xp += 50; // Referansla gelene ekstra 50 XP
      }
    }

    // 4. Yeni Kullanıcıyı Kaydet
    const newUser = { 
      email, 
      myCode, 
      xp, 
      inviteCount: 0,
      tasks: { twitter: false, telegram: false } // Görev durumu
    };

    await kv.hset('users', { [email]: newUser });
    await kv.hset('codes', { [myCode]: email });
    await kv.zadd('leaderboard', { score: xp, member: email });

    return res.status(200).json(newUser);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}