'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Trash2, Edit2, Search, X, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase';

interface Category {
  id: number;
  name: string;
}

interface GPT {
  id: string;
  name: string;
  description: string;
  url: string;
  category_id: number | null;
}

export function GpTs推奨リスト() {
  const [gpts, setGpts] = useState<GPT[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [newGpt, setNewGpt] = useState<Omit<GPT, 'id'>>({ name: '', description: '', url: '', category_id: null });
  const [editingGpt, setEditingGpt] = useState<GPT | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCode, setAuthCode] = useState('');

  const filteredAndGroupedGpts = useMemo(() => {
    console.log('Filtering and grouping GPTs. Current gpts:', gpts);
    console.log('Current categories:', categories);
    console.log('Current searchTerm:', searchTerm);

    const filtered = gpts.filter(gpt => 
      gpt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gpt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gpt.category_id !== null && categories.find(cat => cat.id === gpt.category_id)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    console.log('Filtered GPTs:', filtered);

    const grouped = filtered.reduce((acc, gpt) => {
      const category = gpt.category_id !== null ? categories.find(cat => cat.id === gpt.category_id)?.name || '未分類' : '未分類';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(gpt);
      return acc;
    }, {} as Record<string, GPT[]>);
    console.log('Grouped GPTs:', grouped);

    return grouped;
  }, [gpts, categories, searchTerm]);

  const addGpt = async () => {
    if (newGpt.name && newGpt.description && newGpt.url && newGpt.category_id !== null) {
      try {
        const response = await fetch('/api/gpts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newGpt),
        });

        if (!response.ok) {
          throw new Error('Failed to add GPT');
        }

        const addedGpt = await response.json();
        setGpts([...gpts, addedGpt]);
        setNewGpt({ name: '', description: '', url: '', category_id: null });
        setActiveTab('browse');
      } catch (error) {
        console.error('Error adding GPT:', error);
      }
    }
  };

  const removeGpt = async (id: string) => {
    try {
      const response = await fetch(`/api/gpts?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete GPT');
      }

      setGpts(gpts.filter(gpt => gpt.id !== id));
    } catch (error) {
      console.error('Error deleting GPT:', error);
    }
  };

  const addCategory = async () => {
    if (newCategory && !categories.some(cat => cat.name === newCategory)) {
      try {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newCategory }),
        });

        if (!response.ok) {
          throw new Error('カテゴリの追加に失敗しました');
        }

        const addedCategory = await response.json();
        setCategories(prevCategories => [...prevCategories, addedCategory]);
        setNewCategory('');
      } catch (error) {
        console.error('カテゴリの追加中にエラーが発生しました:', error);
      }
    }
  };

  const updateCategory = async () => {
    if (editingCategory && newCategory) {
      try {
        const response = await fetch('/api/categories', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: editingCategory.id, name: newCategory }),
        });

        if (!response.ok) {
          throw new Error('カテゴリの更新に失敗しました');
        }

        setCategories(prevCategories => prevCategories.map(c => c.id === editingCategory.id ? { ...c, name: newCategory } : c));
        setGpts(prevGpts => prevGpts.map(gpt => gpt.category_id === editingCategory.id ? {...gpt, category_id: editingCategory.id} : gpt));
        setEditingCategory(null);
        setNewCategory('');
      } catch (error) {
        console.error('カテゴリの更新中にエラーが発生しました:', error);
      }
    }
  };

  const removeCategory = async (categoryId: number) => {
    try {
      const response = await fetch(`/api/categories?id=${categoryId}`, {
        method: 'DELETE',
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'カテゴリの削除に失敗しました');
      }

      setCategories(prevCategories => prevCategories.filter(c => c.id !== categoryId));
      setGpts(prevGpts => prevGpts.map(gpt => gpt.category_id === categoryId ? {...gpt, category_id: null} : gpt));
    } catch (error) {
      console.error('カテゴリの削除中にエラーが発生しました:', error);
      alert('カテゴリの削除中にエラーが発生しました: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const fetchData = async () => {
    try {
      console.log('Fetching GPTs...');
      const gptsResponse = await fetch('/api/gpts');
      if (!gptsResponse.ok) {
        throw new Error('Failed to fetch GPTs');
      }
      const gptsData = await gptsResponse.json();
      console.log('Fetched GPTs:', gptsData);
      setGpts(gptsData);

      console.log('Fetching categories...');
      const categoriesResponse = await fetch('/api/categories');
      if (!categoriesResponse.ok) {
        throw new Error('Failed to fetch categories');
      }
      const categoriesData = await categoriesResponse.json();
      console.log('Fetched categories:', categoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.log('Current gpts:', gpts);
    console.log('Current categories:', categories);
  }, [gpts, categories]);

  // GPTを編集モードにする関数
  const startEditingGpt = (gpt: GPT) => {
    setEditingGpt(gpt);
    setActiveTab('manage');
  };

  // GPTを更新する関数
  const updateGpt = async () => {
    if (editingGpt) {
      try {
        const response = await fetch('/api/gpts', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editingGpt),
        });

        if (!response.ok) {
          throw new Error('GPTの更新に失敗しました');
        }

        const updatedGpt = await response.json();
        setGpts(gpts.map(gpt => gpt.id === updatedGpt.id ? updatedGpt : gpt));
        setEditingGpt(null);
        setActiveTab('browse');
      } catch (error) {
        console.error('GPTの更新中にエラーが発生しました:', error);
      }
    }
  };

  // GPTを削除する関数
  const deleteGpt = async (id: string) => {
    try {
      const response = await fetch(`/api/gpts?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('GPTの削除に失敗しました');
      }

      setGpts(gpts.filter(gpt => gpt.id !== id));
    } catch (error) {
      console.error('GPTの削除中にエラーが発生しました:', error);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (authCode === '0411') {
      setIsAuthenticated(true);
    } else {
      alert('認証コードが正しくありません。');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-4xl font-bold mb-8 text-center">ChatGPT GPTs おすすめリスト</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">閲覧</TabsTrigger>
          <TabsTrigger value="manage">管理</TabsTrigger>
        </TabsList>
        <TabsContent value="browse">
          <Card>
            <CardHeader>
              <CardTitle>GPTs一覧</CardTitle>
              <CardDescription>おすすめのGPTsを探索しましょう</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-6">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="GPTsを検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <AnimatePresence>
                {Object.entries(filteredAndGroupedGpts).map(([category, categoryGpts]) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="mb-8"
                  >
                    <h2 className="text-2xl font-bold mb-4">{category}</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {categoryGpts.map((gpt) => (
                        <Card key={gpt.id} className="h-full flex flex-col">
                          <CardHeader>
                            <CardTitle className="text-2xl font-bold text-primary">{gpt.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground mb-2">{gpt.description}</p>
                          </CardContent>
                          <CardFooter>
                            <a
                              href={gpt.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
                            >
                              GPTを開く
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="manage">
          {isAuthenticated ? (
            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>GPT管理</CardTitle>
                  <CardDescription>新しいGPTの追加や既存のGPTの編集ができます</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); editingGpt ? updateGpt() : addGpt(); }} className="space-y-4">
                    <div>
                      <Label htmlFor="name">名前</Label>
                      <Input 
                        id="name" 
                        value={editingGpt ? editingGpt.name : newGpt.name}
                        onChange={(e) => editingGpt ? setEditingGpt({...editingGpt, name: e.target.value}) : setNewGpt({...newGpt, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">説明</Label>
                      <Textarea 
                        id="description" 
                        value={editingGpt ? editingGpt.description : newGpt.description}
                        onChange={(e) => editingGpt ? setEditingGpt({...editingGpt, description: e.target.value}) : setNewGpt({...newGpt, description: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="url">URL</Label>
                      <Input 
                        id="url" 
                        value={editingGpt ? editingGpt.url : newGpt.url}
                        onChange={(e) => editingGpt ? setEditingGpt({...editingGpt, url: e.target.value}) : setNewGpt({...newGpt, url: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">カテゴリ</Label>
                      <Select 
                        value={editingGpt ? String(editingGpt.category_id) : String(newGpt.category_id)}
                        onValueChange={(value) => editingGpt ? setEditingGpt({...editingGpt, category_id: Number(value)}) : setNewGpt({...newGpt, category_id: Number(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="カテゴリを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit">
                      {editingGpt ? '更新' : '追加'}
                    </Button>
                    {editingGpt && (
                      <Button type="button" variant="outline" onClick={() => setEditingGpt(null)}>
                        キャンセル
                      </Button>
                    )}
                  </form>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>カテゴリ管理</CardTitle>
                  <CardDescription>カテゴリの追加、編集、削除ができます</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); editingCategory ? updateCategory() : addCategory(); }} className="space-y-4">
                    <div>
                      <Label htmlFor="category">カテゴリ名</Label>
                      <Input 
                        id="category" 
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit">
                      {editingCategory ? '更新' : '追加'}
                    </Button>
                  </form>
                  <div className="mt-4 space-y-2">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between">
                        <span>{category.name}</span>
                        <div>
                          <Button variant="ghost" size="sm" onClick={() => { setEditingCategory(category); setNewCategory(category.name); }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>カテゴリの削除</DialogTitle>
                                <DialogDescription>
                                  本当に「{category.name}」カテゴリを削除しますか？この操作は取り消せません。
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="destructive" onClick={() => removeCategory(category.id)}>削除</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>登録済みGPTs</CardTitle>
                  <CardDescription>既存のGPTsを編集または削除できます</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {gpts.map((gpt) => (
                      <div key={gpt.id} className="flex items-center justify-between">
                        <span>{gpt.name}</span>
                        <div>
                          <Button variant="ghost" size="sm" onClick={() => startEditingGpt(gpt)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>GPTの削除</DialogTitle>
                                <DialogDescription>
                                  本当に「{gpt.name}」を削除しますか？この操作は取り消せません。
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="destructive" onClick={() => deleteGpt(gpt.id)}>削除</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>認証が必要です</CardTitle>
                <CardDescription>管理機能を使用するには認証コードを入力してください。</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAuth} className="space-y-4">
                  <div>
                    <Label htmlFor="authCode">認証コード</Label>
                    <Input 
                      id="authCode" 
                      type="password"
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit">認証</Button>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}