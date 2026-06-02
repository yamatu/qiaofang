'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Download, RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import api from '@/lib/api';
import { refreshAllSiteCache } from '@/lib/cache';
import { API_BASE_URL } from '@/lib/constants';

interface Backup {
  filename: string;
  size: string;
  date: string;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);

  const fetchBackups = async () => {
    const res = await api.get('/admin/backups');
    setBackups(res.data || []);
  };

  useEffect(() => { fetchBackups(); }, []);

  const handleBackup = async () => {
    setCreating(true);
    try {
      await api.post('/admin/backup');
      fetchBackups();
    } catch {
      alert('备份失败');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      await api.post(`/admin/restore/${restoreTarget}`);
      await refreshAllSiteCache();
      alert('还原成功！数据库和图片已恢复。');
    } catch {
      alert('还原失败，请检查备份文件是否完整。');
    } finally {
      setRestoring(false);
      setRestoreTarget(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">数据备份与还原</h1>
        <button onClick={handleBackup} disabled={creating} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          <Database size={18} /> {creating ? '备份中...' : '创建备份'}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">备份说明</p>
          <p className="mt-1">备份包含完整数据库数据和所有上传的图片文件（.tar.gz格式）。还原操作会覆盖当前数据，请谨慎操作。</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">备份列表 ({backups.length})</span>
          <button onClick={fetchBackups} className="text-gray-400 hover:text-gray-600"><RefreshCw size={16} /></button>
        </div>
        {backups.length === 0 ? (
          <div className="p-12 text-center text-gray-400">暂无备份记录</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {backups.map((b, i) => (
              <motion.div key={b.filename} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{b.filename}</p>
                  <p className="text-xs text-gray-500">{b.date} · {(parseInt(b.size) / 1024).toFixed(1)} KB</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setRestoreTarget(b.filename)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                    <RotateCcw size={14} /> 还原
                  </button>
                  <a href={`${API_BASE_URL}/backups/${b.filename}`} download className="p-2 text-gray-400 hover:text-blue-600">
                    <Download size={18} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog.Root open={!!restoreTarget} onOpenChange={() => setRestoreTarget(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 w-full max-w-md z-50">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-2">确认还原</Dialog.Title>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 font-medium">此操作将覆盖当前所有数据！</p>
              <p className="text-sm text-red-700 mt-1">数据库内容和上传的图片都会被还原为备份时的状态，当前数据将丢失且无法恢复。</p>
            </div>
            <p className="text-sm text-gray-600 mb-4">还原文件: <span className="font-mono text-gray-900">{restoreTarget}</span></p>
            <div className="flex justify-end gap-3">
              <Dialog.Close className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</Dialog.Close>
              <button onClick={handleRestore} disabled={restoring} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {restoring ? '还原中...' : '确认还原'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
