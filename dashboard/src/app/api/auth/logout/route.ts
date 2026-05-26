import { NextRequest, NextResponse } from 'next/server';
import { fail, ok } from '@/lib/apiResponse';
import { getCsrfCookieName, getSessionCookieName } from '@/lib/sessionAuth';

export async function POST(_request: NextRequest) {
  try {
    const response = ok({ loggedOut: true }) as NextResponse;
    response.cookies.set({
      name: getSessionCookieName(),
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(0),
    });
    response.cookies.set({
      name: getCsrfCookieName(),
      value: '',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(0),
    });
    return response;
  } catch (error) {
    return fail(
      'LOGOUT_FAILED',
      'Failed to clear session.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}
