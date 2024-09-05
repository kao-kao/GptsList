import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase.from('categories').select('*').order('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: 'カテゴリ名は必須です' }, { status: 400 });

  const { data, error } = await supabase.from('categories').insert({ name }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: Request) {
  const { id, name } = await request.json();
  if (!id || !name) return NextResponse.json({ error: 'IDとカテゴリ名は必須です' }, { status: 400 });

  const { data, error } = await supabase.from('categories').update({ name }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'カテゴリが見つかりません' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'IDは必須です' }, { status: 400 });

  try {
    const { data, error } = await supabase.rpc('delete_category_and_update_gpts', { target_category_id: parseInt(id) });

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json({ error: error.message || 'カテゴリの削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ message: 'カテゴリが正常に削除され、関連するGPTsが更新されました' });
  } catch (error) {
    console.error('カテゴリ削除中に予期せぬエラーが発生しました:', error);
    return NextResponse.json({ error: '予期せぬエラーが発生しました: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}