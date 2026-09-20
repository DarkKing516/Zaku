import { DestroySession } from '@/utils/session';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await DestroySession();
    return NextResponse.json({ success: true, message: 'Sesión cerrada correctamente' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Error al cerrar sesión', error: error.message },
      { status: 500 },
    );
  }
}
