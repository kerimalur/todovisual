import { NextRequest } from 'next/server';
import { POST as runWhatsAppTest } from '@/app/api/reminders/whatsapp/test/route';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return runWhatsAppTest(request);
}
