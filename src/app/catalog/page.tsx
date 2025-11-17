"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Button from "../components/ui/Button";
import { useToast } from "../contexts/ToastContext";

interface CatalogItem {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  category: string;
  price?: string;
  photo?: string;
  address?: string;
  whatsapp?: string;
  site?: string;
  created_at: string;
}

export default function CatalogPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    photo: "",
    address: "",
    whatsapp: "",
    site: "",
  });

  useEffect(() => {
    checkUser();
    loadItems();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
    }
  }

  async function loadItems() {
    try {
      const { data, error } = await supabase
        .from("catalog")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Erro ao carregar itens:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const itemData = {
        tenant_id: user.id,
        ...formData,
      };

      if (editingItem) {
        // Update
        const { error } = await supabase
          .from("catalog")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from("catalog")
          .insert([itemData]);

        if (error) throw error;
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        price: "",
        photo: "",
        address: "",
        whatsapp: "",
        site: "",
      });
      setShowForm(false);
      setEditingItem(null);
      showSuccess(editingItem ? "Item atualizado com sucesso!" : "Item criado com sucesso!");
      loadItems();
    } catch (error: any) {
      showError("Erro: " + error.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;

    try {
      const { error } = await supabase
        .from("catalog")
        .delete()
        .eq("id", id);

      if (error) throw error;
      showSuccess("Item excluído com sucesso!");
      loadItems();
    } catch (error: any) {
      showError("Erro ao excluir: " + error.message);
    }
  }

  function handleEdit(item: CatalogItem) {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      price: item.price || "",
      photo: item.photo || "",
      address: item.address || "",
      whatsapp: item.whatsapp || "",
      site: item.site || "",
    });
    setShowForm(true);
  }

  function handleCancel() {
    setFormData({
      title: "",
      description: "",
      category: "",
      price: "",
      photo: "",
      address: "",
      whatsapp: "",
      site: "",
    });
    setShowForm(false);
    setEditingItem(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
          >
            {showForm ? "Cancelar" : "+ Adicionar Item"}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingItem ? "Editar Item" : "Novo Item"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 h-24"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço
                  </label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="R$ 0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Foto (URL)
                  </label>
                  <input
                    type="text"
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="+55 11 99999-9999"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site
                  </label>
                  <input
                    type="text"
                    value={formData.site}
                    onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-black hover:bg-gray-800">
                  {editingItem ? "Atualizar" : "Criar"}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-200 hover:bg-gray-300 text-black"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Items List */}
        {items.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">Nenhum item no catálogo ainda.</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              Adicionar Primeiro Item
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition"
              >
                {item.photo && (
                  <img
                    src={item.photo}
                    alt={item.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}

                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>
                  {item.price && (
                    <span className="text-sm font-semibold text-gray-900">
                      {item.price}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {item.description}
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {item.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                {(item.address || item.whatsapp || item.site) && (
                  <div className="text-xs text-gray-600 mb-4 space-y-1">
                    {item.address && <p>📍 {item.address}</p>}
                    {item.whatsapp && <p>📱 {item.whatsapp}</p>}
                    {item.site && <p>🌐 {item.site}</p>}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 text-sm py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 text-sm py-2 px-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
