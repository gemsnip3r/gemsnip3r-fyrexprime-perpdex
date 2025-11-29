export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Invalid email' });
  }

  // Burada logluyoruz (Vercel Logs kısmında görünür)
  console.log('NEW LEAD:', email, new Date().toISOString());

  return res.status(200).json({ message: 'Success' });
}