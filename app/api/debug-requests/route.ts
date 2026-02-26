import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WalletCashbackRequest from '@/models/WalletCashbackRequest';

export async function GET() {
  await dbConnect();
  
  const requests = await WalletCashbackRequest.find({});
  
  return NextResponse.json({
    count: requests.length,
    requests
  });
}
