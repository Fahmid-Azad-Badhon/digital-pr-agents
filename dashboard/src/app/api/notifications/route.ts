// GET /api/notifications - List notifications
import { NextResponse } from 'next/server';

const notifications = [
  { id: '1', type: 'success', title: 'Campaign Created', message: 'Test campaign ready', timestamp: new Date().toISOString(), read: false },
  { id: '2', type: 'warning', title: 'Angle Selection Required', message: 'Please select angle', timestamp: new Date().toISOString(), read: false },
];

export async function GET() {
  return NextResponse.json(notifications);
}