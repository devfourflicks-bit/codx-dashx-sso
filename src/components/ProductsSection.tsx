/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';
import { PlusCircle, ShoppingBag, Trash2, Tag, Loader2, Sparkles, Box, AlertCircle } from 'lucide-react';
import { useConfirm } from './ConfirmDialog';

interface ProductsSectionProps {
  products: Product[];
  onRefresh: () => void;
}

export default function ProductsSection({ products, onRefresh }: ProductsSectionProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('civil');
  const [icon, setIcon] = useState('🧱');
  const [desc, setDesc] = useState('');
  
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { confirm } = useConfirm();

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    confirm({
      title: 'Add New Product',
      message: `Are you sure you want to add "${name}" to the products collection?`,
      type: 'save',
      onConfirm: async () => {
        setAdding(true);
        setError(null);
        try {
          try {
            await addDoc(collection(db, 'products'), {
              name,
              category,
              icon,
              desc
            });
          } catch (dbErr) {
            handleFirestoreError(dbErr, OperationType.WRITE, 'products');
          }
          setName('');
          setCategory('civil');
          setIcon('🧱');
          setDesc('');
          onRefresh();
        } catch (err) {
          console.error('Error adding product:', err);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setAdding(false);
        }
      }
    });
  };

  const handleDeleteProduct = (id: string) => {
    confirm({
      title: 'Delete Product',
      message: 'Are you sure you want to permanently delete this product from the database?',
      type: 'delete',
      onConfirm: async () => {
        setDeletingId(id);
        setError(null);
        try {
          try {
            await deleteDoc(doc(db, 'products', id));
          } catch (dbErr) {
            handleFirestoreError(dbErr, OperationType.DELETE, `products/${id}`);
          }
          onRefresh();
        } catch (err) {
          console.error('Error deleting product:', err);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  return (
    <div className="space-y-10 animate-fade-in max-w-4xl">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 p-4 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold">Product Operation Failed</h4>
            <p className="text-xs mt-1 leading-relaxed break-words font-mono">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Existing Products Grid */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            Our Product Range
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Display and manage product supply catalog list in your Firestore catalog collection.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl">
            <Box className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No products available.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Fill out the form below to append items.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-750 rounded-2xl flex gap-4 items-start hover:border-slate-300 dark:hover:border-slate-700 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 flex items-center justify-center text-2xl shadow-sm shrink-0">
                  {p.icon || '🧱'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white truncate">{p.name}</h4>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-violet-50 dark:bg-violet-950/40 text-[10px] font-bold text-violet-600 dark:text-violet-400 rounded-full border border-violet-100/50 dark:border-violet-900/40 capitalize">
                      <Tag className="w-2.5 h-2.5" />
                      {p.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">{p.desc}</p>
                </div>
                
                <button
                  onClick={() => handleDeleteProduct(p.id)}
                  disabled={deletingId === p.id}
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/30 rounded-lg transition-all cursor-pointer disabled:opacity-50 shrink-0 self-center"
                  title="Delete Product"
                >
                  {deletingId === p.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Product Form */}
      <form onSubmit={handleAddProduct} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-700 pb-5">
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            Add New Product
          </h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Create and append a new product entry to your database range.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Premium White Granite Slabs"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-violet-500"
            >
              <option value="civil">Civil Materials</option>
              <option value="mechanical">Mechanical</option>
              <option value="electrical">Electrical</option>
              <option value="ppe">PPE items</option>
              <option value="equipment">Heavy Equipment</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Emoji Icon / Badge</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="e.g. 🔩, 🧱, 🦺"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Short Description</label>
            <input
              type="text"
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Provide a 1-sentence product summary description..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={adding}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {adding ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Appending Product...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Add Product</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
