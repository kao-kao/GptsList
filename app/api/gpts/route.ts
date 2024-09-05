console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  console.log('GET request received');
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  let query = supabase.from('gpts').select(`
    *,
    categories(id, name)
  `);

  if (category) {
    query = query.eq('category_id', category);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching GPTs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // カテゴリ情報を整形
  const formattedData = data.map(gpt => ({
    ...gpt,
    category: gpt.categories ? gpt.categories.name : '未分類'
  }));

  console.log('Fetched GPTs:', formattedData);
  return NextResponse.json(formattedData);
}

export async function POST(request: Request) {
  const { name, description, url, category_id } = await request.json();
  if (!name || !description || !url) {
    return NextResponse.json({ error: '名前、説明、URLは必須です' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('gpts')
    .insert({ name, description, url, category_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: Request) {
  const { id, name, description, url, category_id } = await request.json();
  if (!id || !name || !description || !url) {
    return NextResponse.json({ error: 'ID、名前、説明、URLは必須です' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('gpts')
    .update({ name, description, url, category_id })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'GPTが見つかりません' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('gpts')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'GPT deleted successfully' });
}
