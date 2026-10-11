import React, { useState, useRef } from 'react';
import { X, Check, Upload, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_AVATAR_PRESETS, MALE_AVATAR_SVG, FEMALE_AVATAR_SVG } from '../utils/avatars';
import { uploadUserAvatar } from '../lib/supabase';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserProfile } = useApp();
  const [selectedUrl, setSelectedUrl] = useState(user.avatar_url || MALE_AVATAR_SVG);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('لطفاً یک فایل تصویری معتبر (PNG, JPG, WebP) انتخاب فرمایید.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('حداکثر حجم مجاز تصویر نمایه ۵ مگابایت است.');
      return;
    }

    setError(null);
    setCustomFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setError(null);
    setIsUploading(true);

    try {
      let finalAvatarUrl = selectedUrl;

      // If user uploaded a custom file, save to Supabase Storage 'avatars' bucket
      if (customFile) {
        const uploadRes = await uploadUserAvatar(customFile, user.id, customFile.name);
        if (uploadRes.url) {
          finalAvatarUrl = uploadRes.url;
        } else if (uploadRes.error) {
          setError(uploadRes.error);
          setIsUploading(false);
          return;
        }
      }

      await updateUserProfile({ avatar_url: finalAvatarUrl });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'خطا در ذخیره تصویر نمایه');
    } finally {
      setIsUploading(false);
    }
  };

  const currentDisplayUrl = previewUrl || selectedUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-cairo">
      <div
        id="avatar-modal-card"
        className="w-full max-w-md bg-white dark:bg-[#0F1512] rounded-3xl shadow-2xl border border-[#E2E8E4] dark:border-[#1A2621] overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-5"
      >
        <div className="flex items-center justify-between border-b border-[#E2E8E4] dark:border-[#1A2621] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-[#15271E] dark:text-emerald-300">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100">
              تصویر نمایه کاربری (آواتار)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Selected Active Avatar Preview */}
        <div className="flex flex-col items-center justify-center py-2 space-y-2">
          <div className="relative">
            <img
              src={currentDisplayUrl}
              alt="پیش‌نمایش تصویر نمایه"
              className="w-24 h-24 rounded-full border-4 border-emerald-600 object-cover shadow-lg bg-zinc-100 dark:bg-zinc-900"
            />
            {previewUrl && (
              <span className="absolute bottom-0 right-0 px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold shadow-xs">
                فایل جدید
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {previewUrl ? 'تصویر اختصاصی آپلود شده' : 'پیش‌نمایش نمایه فعلی شما'}
          </p>
        </div>

        {/* Strict 2 Presets: Male & Female */}
        <div className="space-y-2">
          <label className="text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 block">
            انتخاب از دو آواتار پیش‌فرض سامانه:
          </label>
          <div className="grid grid-cols-2 gap-3">
            {DEFAULT_AVATAR_PRESETS.map((preset) => {
              const isSelected = selectedUrl === preset.url && !previewUrl;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedUrl(preset.url);
                    setCustomFile(null);
                    setPreviewUrl(null);
                  }}
                  className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition cursor-pointer relative ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30'
                      : 'border-[#E2E8E4] dark:border-[#1A2621] hover:border-emerald-400'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-12 h-12 rounded-full object-cover shrink-0 border border-emerald-600/40"
                  />
                  <div className="text-right">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 block font-cairo">
                      {preset.gender === 'مرد' ? 'طرح اختصاصی آقا' : 'طرح اختصاصی خانم'}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="mr-auto w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Picture Direct Upload */}
        <div className="space-y-2 pt-2 border-t border-[#E2E8E4] dark:border-[#1A2621]">
          <label className="text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 block">
            یا بارگذاری مستقیم عکس از دستگاه (فضای ابری اختصاصی):
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-[#CBD5CD] dark:border-[#273830] hover:border-emerald-600 bg-zinc-50 dark:bg-[#141F1A] text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-2.5 transition cursor-pointer group"
          >
            <Upload className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
            <span className="text-xs font-bold">
              {customFile ? `فایل انتخاب شد: ${customFile.name}` : 'انتخاب و آپلود فایل عکس دلخواه'}
            </span>
          </button>
          <p className="text-[10px] text-zinc-400 text-center">
            فایل‌های مجاز: JPG, PNG, WEBP (حداکثر ۵ مگابایت) • به صورت خودکار در باکت امن ذخیره می‌شود.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8E4] dark:border-[#1A2621]">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl text-xs font-cairo font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isUploading}
            className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-cairo font-bold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>در حال آپلود و ذخیره...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تایید و ذخیره آواتار</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
