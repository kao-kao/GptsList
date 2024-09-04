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
  console.log('POST request received');
  const body = await request.json();
  console.log('Request body:', body);
  const { name, description, url, category_id } = body;

  const { data, error } = await supabase
    .from('gpts')
    .insert({ name, description, url, category_id })
    .select();

  if (error) {
    console.error('Error inserting GPT:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('Inserted GPT:', data);
  return NextResponse.json(data[0]);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, name, description, url, category_id } = body;

  const { data, error } = await supabase
    .from('gpts')
    .update({ name, description, url, category_id })
    .eq('id', id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]);
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
