import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  
  // Mock return
  const updated = {
    id: parseInt(id),
    ...body,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  _props: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ success: true });
}
