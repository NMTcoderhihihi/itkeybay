import { cookies } from 'next/headers';

export type SessionPayload = {
  id: string;
  phone: string;
  role: string;
  name: string;
  avatar: string | null;
};

export async function createSession(payload: SessionPayload) {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(23, 59, 59, 999);

  // Mã hóa tĩnh dạng Base64 (có thể nâng cấp lên JWT sau này nếu cần bảo mật cao hơn)
  // Tuy nhiên theo thiết kế nội bộ nhà xưởng, điều này là đủ để xác định người dùng.
  const sessionValue = Buffer.from(JSON.stringify(payload)).toString('base64');
  
  const cookieStore = await cookies();
  cookieStore.set('auth_session', sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: midnight,
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('auth_session')?.value;
  if (!session) return null;
  try {
    return JSON.parse(Buffer.from(session, 'base64').toString('utf-8'));
  } catch (e) {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_session');
}
