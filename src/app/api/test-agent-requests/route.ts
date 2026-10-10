import { NextResponse } from 'next/server';
import { fetchAgentRequests } from '@/api/agent-requests';

export async function GET(request: Request) {
  try {
    const data = await fetchAgentRequests({ search: '', dateFrom: '', dateTo: '', staff: '' });
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
