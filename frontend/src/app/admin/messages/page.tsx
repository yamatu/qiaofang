'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Mail, Phone, Building2 } from 'lucide-react';
import api from '@/lib/api';

interface Message {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);

  const fetchMessages = async () => {
    const res = await api.get('/admin/messages');
    setMessages(res.data || []);
  };

  useEffect(() => { fetchMessages(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    await api.delete(`/admin/messages/${id}`);
    fetchMessages();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">留言管理</h1>
        <span className="text-sm text-gray-500">{messages.length} 条留言</span>
      </div>
      <div className="space-y-4">
        {messages.map((msg, i) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-semibold text-gray-900">{msg.name}</span>
                  {msg.email && <span className="flex items-center gap-1 text-sm text-gray-500"><Mail size={14} />{msg.email}</span>}
                  {msg.phone && <span className="flex items-center gap-1 text-sm text-gray-500"><Phone size={14} />{msg.phone}</span>}
                  {msg.company && <span className="flex items-center gap-1 text-sm text-gray-500"><Building2 size={14} />{msg.company}</span>}
                </div>
                <p className="text-gray-600 mt-3 whitespace-pre-wrap">{msg.message}</p>
                <span className="text-xs text-gray-400 mt-2 block">{new Date(msg.created_at).toLocaleString()}</span>
              </div>
              <button onClick={() => handleDelete(msg.id)} className="p-2 text-gray-400 hover:text-red-600 flex-shrink-0">
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
        {messages.length === 0 && <div className="text-center py-12 text-gray-400">暂无留言</div>}
      </div>
    </div>
  );
}
