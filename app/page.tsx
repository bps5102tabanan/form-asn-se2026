'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { DAFTAR_OPD, ROOSTER_WILAYAH } from '@/data/rooster';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

const toTitleCase = (str: string) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

// ================= KOMPONEN MODAL =================
type ModalType = 'success' | 'error' | 'confirm';

interface ModalConfig {
  type: ModalType;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmLabel?: string;
  showCancel?: boolean;
  onCancel?: () => void;
}

const Modal = ({ config, onClose }: { config: ModalConfig; onClose: () => void }) => {
  const icons: Record<ModalType, React.ReactNode> = {
    success: (
      <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    confirm: (
      <svg className="w-12 h-12 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  };

  const bgColors: Record<ModalType, string> = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    confirm: 'bg-neutral-50 border-neutral-200',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={config.showCancel ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative w-full max-w-md bg-white rounded-2xl shadow-2xl border ${bgColors[config.type]}
        animate-in zoom-in-95 fade-in duration-200
      `}>
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-sm border border-neutral-100 mb-4">
            {icons[config.type]}
          </div>
          
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            {config.title}
          </h3>
          
          <p className="text-sm text-neutral-600 leading-relaxed">
            {config.message}
          </p>
        </div>

        <div className={`flex items-center justify-center gap-3 px-6 pb-6 ${config.showCancel ? '' : ''}`}>
          {config.showCancel && (
            <button
              type="button"
              onClick={() => {
                config.onCancel?.();
                onClose();
              }}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 bg-neutral-100 
                rounded-xl hover:bg-neutral-200 transition-all duration-200
                focus:outline-none focus:ring-4 focus:ring-neutral-900/10"
            >
              Batal
            </button>
          )}
          
          <button
            type="button"
            onClick={() => {
              config.onConfirm?.();
              onClose();
            }}
            className={`
              flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl
              transition-all duration-200 active:scale-[0.98]
              focus:outline-none focus:ring-4
              ${config.type === 'success' 
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-600/20' 
                : config.type === 'error'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600/20'
                : 'bg-neutral-900 hover:bg-neutral-800 focus:ring-neutral-900/20'
              }
            `}
          >
            {config.confirmLabel || (config.type === 'error' ? 'Tutup' : 'OK')}
          </button>
        </div>

        {/* Close button (X) */}
        {!config.showCancel && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-neutral-400 hover:text-neutral-600 
              rounded-lg hover:bg-neutral-100 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            aria-label="Tutup"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// ================= KOMPONEN CUSTOM SEARCHABLE DROPDOWN =================
const SearchableSelect = ({ 
  options, value, onChange, placeholder, disabled, error 
}: { 
  options: string[], value: string, onChange: (val: string) => void, placeholder: string, disabled?: boolean, error?: string 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedIndex = value ? filteredOptions.indexOf(value) : -1;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative w-full flex items-center gap-3 px-4 py-3
          text-left text-sm rounded-xl border-2 transition-all duration-200
          ${error 
            ? 'border-red-400 bg-red-50/50 focus:ring-red-400/20' 
            : 'border-neutral-200 hover:border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900/10'
          }
          ${disabled ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-white cursor-pointer'}
          focus:outline-none focus:ring-4
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`flex-1 truncate ${!value ? 'text-neutral-400' : 'text-neutral-900'}`}>
          {value || placeholder}
        </span>
        <svg 
          className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-neutral-100">
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400
                  placeholder:text-neutral-400 transition-all"
                placeholder="Ketik untuk mencari..."
              />
            </div>
          </div>
          
          <div className="max-h-56 overflow-y-auto py-1" role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <div
                  key={idx}
                  role="option"
                  aria-selected={idx === selectedIndex}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`
                    px-4 py-2.5 text-sm cursor-pointer transition-colors duration-100
                    hover:bg-neutral-100 active:bg-neutral-200
                    ${idx === selectedIndex ? 'bg-neutral-100 font-medium' : 'text-neutral-700'}
                  `}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-sm text-neutral-500 text-center">
                <svg 
                  className="w-8 h-8 mx-auto mb-2 text-neutral-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Data tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ================= KOMPONEN INPUT TEXT =================
const InputField = ({ 
  label, name, value, onChange, placeholder, error, type = 'text', maxLength, hint 
}: {
  label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  placeholder?: string, error?: string, type?: string, maxLength?: number, hint?: string
}) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-neutral-900 mb-1.5">
      {label}
    </label>
    {hint && <p className="text-xs text-neutral-500 mb-2">{hint}</p>}
    <input
      id={name}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      placeholder={placeholder}
      className={`
        w-full px-4 py-3 text-sm rounded-xl border-2 transition-all duration-200
        placeholder:text-neutral-400
        ${error 
          ? 'border-red-400 bg-red-50/50 focus:ring-red-400/20' 
          : 'border-neutral-200 hover:border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900/10'
        }
        focus:outline-none focus:ring-4
      `}
    />
    {error && <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {error}
    </p>}
  </div>
);

// ================= KOMPONEN TEXTAREA =================
const TextAreaField = ({ label, name, value, onChange, placeholder, error, rows = 3 }: {
  label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
  placeholder?: string, error?: string, rows?: number
}) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-neutral-900 mb-1.5">
      {label}
    </label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      className={`
        w-full px-4 py-3 text-sm rounded-xl border-2 transition-all duration-200 resize-none
        placeholder:text-neutral-400
        ${error 
          ? 'border-red-400 bg-red-50/50 focus:ring-red-400/20' 
          : 'border-neutral-200 hover:border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900/10'
        }
        focus:outline-none focus:ring-4
      `}
    />
    {error && <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {error}
    </p>}
  </div>
);

// ================= KOMPONEN RADIO GROUP =================
const RadioGroup = ({ label, name, value, onChange, options, error }: {
  label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  options: { value: string; label: string }[], error?: string
}) => (
  <div>
    <label className="block text-sm font-medium text-neutral-900 mb-3">
      {label}
    </label>
    <div className="flex gap-3 flex-wrap">
      {options.map(opt => (
        <label
          key={opt.value}
          className={`
            relative flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 cursor-pointer
            transition-all duration-200 select-none
            ${value === opt.value 
              ? 'border-neutral-900 bg-neutral-900 text-white' 
              : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700'
            }
          `}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={onChange}
            className="sr-only"
          />
          <span className={`
            w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
            ${value === opt.value ? 'border-white' : 'border-neutral-300'}
          `}>
            {value === opt.value && (
              <span className="w-2 h-2 rounded-full bg-white animate-in zoom-in duration-150" />
            )}
          </span>
          <span className="text-sm font-medium">{opt.label}</span>
        </label>
      ))}
    </div>
    {error && <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {error}
    </p>}
  </div>
);

// ================= KOMPONEN FILE UPLOAD =================
const FileUpload = ({ label, name, onChange, value, error, hint, icon }: {
  label: string, name: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  value: string, error?: string, hint?: string, icon: React.ReactNode
}) => (
  <div className="flex flex-col">
    <label className="block text-sm font-medium text-neutral-900 mb-1.5">
      {label}
    </label>
    {hint && <p className="text-xs text-neutral-500 mb-3">{hint}</p>}
    
    {value ? (
      <div className="relative group rounded-xl overflow-hidden border-2 border-neutral-200">
        <img src={value} alt="Preview" className="w-full h-40 object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
          <label className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer px-4 py-2 bg-white/90 text-neutral-900 text-sm font-medium rounded-lg hover:bg-white">
            Ganti Foto
            <input type="file" accept="image/*" onChange={onChange} className="hidden" />
          </label>
        </div>
      </div>
    ) : (
      <label className={`
        flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed
        cursor-pointer transition-all duration-200
        ${error 
          ? 'border-red-400 bg-red-50/50' 
          : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50'
        }
      `}>
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
          {icon}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-700">Klik untuk upload</p>
          <p className="text-xs text-neutral-400 mt-1">JPG, PNG, atau WebP</p>
        </div>
        <input type="file" accept="image/*" onChange={onChange} className="hidden" />
      </label>
    )}
    {error && <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {error}
    </p>}
  </div>
);

// ================= MAIN COMPONENT =================
export default function FormASN() {
  const [currentBlock, setCurrentBlock] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [daftarDesa, setDaftarDesa] = useState<string[]>([]);
  const [daftarBanjar, setDaftarBanjar] = useState<string[]>([]);

  // Modal state
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
  
  const [formData, setFormData] = useState({
    namaPegawai: '', noKK: '', nik: '', namaKepalaKeluarga: '', namaAnggotaKeluargaLain: '',
    asalOPD: '', nip: '', noHP: '', email: '',
    alamatLengkap: '', kabupaten: 'Di Dalam Kabupaten Tabanan', kecamatan: '', desa: '', slsBanjar: '', latitude: '', longitude: '',
    memilikiUsaha: '', noMeteranPLN: '', fotoRumah: '', fotoRuangTamu: '', sudahDidataSE: ''
  });

  // Helper untuk show modal
  const showModal = (config: ModalConfig) => {
    setModalConfig(config);
  };

  useEffect(() => {
    const savedData = localStorage.getItem('form_asn_se2026');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setFormData(parsedData);
      
      if (parsedData.kecamatan && ROOSTER_WILAYAH[parsedData.kecamatan]) {
        setDaftarDesa(Object.keys(ROOSTER_WILAYAH[parsedData.kecamatan]));
        if (parsedData.desa && ROOSTER_WILAYAH[parsedData.kecamatan]?.[parsedData.desa]) {
          setDaftarBanjar(ROOSTER_WILAYAH[parsedData.kecamatan][parsedData.desa]);
        }
      }
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) localStorage.setItem('form_asn_se2026', JSON.stringify(formData));
  }, [formData, isMounted]);

  const validateField = (name: string, value: string) => {
    let errorMsg = '';
    if (['noKK', 'nik'].includes(name)) {
      if (value && !/^\d{16}$/.test(value)) errorMsg = 'Wajib 16 digit angka';
    }
    if (name === 'nip') {
      if (value && !/^\d{18}$/.test(value)) errorMsg = 'Wajib 18 digit angka';
    }
    if (name === 'noHP') {
      if (value && !/^08\d{8,12}$/.test(value)) errorMsg = 'Wajib diawali 08 (10-14 digit)';
    }
    if (name === 'email' && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errorMsg = 'Format email tidak valid';
    }
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (['namaPegawai', 'namaKepalaKeluarga', 'namaAnggotaKeluargaLain'].includes(name)) {
      finalValue = toTitleCase(value);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    validateField(name, finalValue);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'fotoRumah' | 'fotoRuangTamu') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; 
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setFormData(prev => ({ ...prev, [fieldName]: compressedBase64 }));
        setErrors(prev => ({ ...prev, [fieldName]: '' }));
      };
    };
  };

  const validateBlock = () => {
    const blockErrors: Record<string, string> = {};
    let isValid = true;

    if (currentBlock === 1) {
      const requiredFields = ['namaPegawai', 'noKK', 'nik', 'namaKepalaKeluarga', 'namaAnggotaKeluargaLain', 'asalOPD', 'nip', 'noHP'];
      requiredFields.forEach(field => {
        if (!formData[field as keyof typeof formData]) blockErrors[field] = 'Kolom ini wajib diisi';
      });
      ['noKK', 'nik', 'nip', 'noHP'].forEach(field => {
        if (errors[field]) blockErrors[field] = errors[field];
      });
    }

    if (currentBlock === 2) {
      if (!formData.alamatLengkap) blockErrors['alamatLengkap'] = 'Wajib diisi';
      if (formData.kabupaten === 'Di Dalam Kabupaten Tabanan') {
        const requiredFields2 = ['kecamatan', 'desa', 'slsBanjar', 'latitude'];
        requiredFields2.forEach(field => {
          if (!formData[field as keyof typeof formData]) {
            blockErrors[field] = field === 'latitude' ? 'Wajib tandai lokasi di peta' : 'Wajib dipilih';
          }
        });
      }
    }

    if (currentBlock === 3) {
      if (formData.kabupaten === 'Di Dalam Kabupaten Tabanan') {
        if (!formData.memilikiUsaha) blockErrors['memilikiUsaha'] = 'Wajib dipilih';
        if (!formData.noMeteranPLN) blockErrors['noMeteranPLN'] = 'Wajib diisi';
        if (!formData.fotoRumah) blockErrors['fotoRumah'] = 'Wajib upload foto';
        if (!formData.fotoRuangTamu) blockErrors['fotoRuangTamu'] = 'Wajib upload foto';
      }
      if (!formData.sudahDidataSE) blockErrors['sudahDidataSE'] = 'Wajib dipilih';
    }

    setErrors(blockErrors);
    if (Object.keys(blockErrors).length > 0) isValid = false;
    return isValid;
  };

  const handleNext = () => {
    if (validateBlock()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (currentBlock === 1) setCurrentBlock(2);
      else if (currentBlock === 2) setCurrentBlock(3);
    } else {
      showModal({
        type: 'error',
        title: 'Data Belum Lengkap',
        message: 'Mohon perbaiki atau lengkapi isian yang ditandai merah sebelum melanjutkan.',
        confirmLabel: 'Perbaiki',
      });
    }
  };

  const handlePrev = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentBlock(prev => (prev > 1 ? prev - 1 : prev));
  };

  const resetForm = () => {
    setFormData({
      namaPegawai: '', noKK: '', nik: '', namaKepalaKeluarga: '', namaAnggotaKeluargaLain: '',
      asalOPD: '', nip: '', noHP: '', email: '',
      alamatLengkap: '', kabupaten: 'Di Dalam Kabupaten Tabanan', kecamatan: '', desa: '', slsBanjar: '', latitude: '', longitude: '',
      memilikiUsaha: '', noMeteranPLN: '', fotoRumah: '', fotoRuangTamu: '', sudahDidataSE: ''
    });
    localStorage.removeItem('form_asn_se2026');
    setDaftarDesa([]);
    setDaftarBanjar([]);
    setCurrentBlock(1);
    setErrors({});
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateBlock()) {
      showModal({
        type: 'error',
        title: 'Data Belum Lengkap',
        message: 'Mohon perbaiki isian yang masih kosong atau salah sebelum submit.',
        confirmLabel: 'Perbaiki',
      });
      return;
    }

    // Show confirmation modal
    showModal({
      type: 'confirm',
      title: 'Konfirmasi Pengiriman',
      message: 'Apakah Anda yakin data yang diisi sudah benar? Data yang sudah dikirim tidak dapat diubah kembali.',
      confirmLabel: 'Ya, Kirim Data',
      showCancel: true,
      onConfirm: async () => {
        setIsSubmitting(true);
        const dataToSubmit = { ...formData };
        
        if (formData.kabupaten === 'Di Luar Kabupaten Tabanan') {
          dataToSubmit.kecamatan = '-';
          dataToSubmit.desa = '-';
          dataToSubmit.slsBanjar = '-';
          dataToSubmit.latitude = '-';
          dataToSubmit.longitude = '-';
          dataToSubmit.memilikiUsaha = '-';
          dataToSubmit.noMeteranPLN = '-';
          dataToSubmit.fotoRumah = '-';
          dataToSubmit.fotoRuangTamu = '-';
        }

        try {
          const res = await fetch('/api/submit-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSubmit),
          });

          if (res.ok) {
            showModal({
              type: 'success',
              title: 'Berhasil Tersimpan!',
              message: 'Data Anda berhasil tersimpan di sistem Sensus Ekonomi 2026. Terima kasih atas partisipasi Anda.',
              confirmLabel: 'Selesai',
              onConfirm: () => {
                resetForm();
              },
            });
          } else {
            showModal({
              type: 'error',
              title: 'Gagal Menyimpan',
              message: 'Gagal menyimpan data ke server. Silakan coba beberapa saat lagi.',
              confirmLabel: 'Coba Lagi',
            });
          }
        } catch (err) {
          console.error(err);
          showModal({
            type: 'error',
            title: 'Kesalahan Jaringan',
            message: 'Terjadi kesalahan jaringan. Periksa koneksi internet Anda dan coba kembali.',
            confirmLabel: 'Tutup',
          });
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  if (!isMounted) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-4">
        <svg className="w-8 h-8 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <p className="text-sm text-neutral-500">Memuat formulir...</p>
      </div>
    </div>
  );

  return (
    <>
      {/* MODAL */}
      {modalConfig && (
        <Modal 
          config={modalConfig} 
          onClose={() => setModalConfig(null)} 
        />
      )}

      <div className="min-h-screen bg-neutral-50 py-8 px-4 sm:py-12">
        <div className="max-w-2xl mx-auto">
          
          {/* MAIN CARD */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            
            {/* BANNER */}
            <div className="w-full aspect-[3/1] bg-neutral-100 relative overflow-hidden">
              <img 
                src="/banner-se2026.png" 
                alt="Banner Sensus Ekonomi 2026 Tabanan" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/1200x400/171717/fafafa?text=Sensus+Ekonomi+2026";
                }}
              />
            </div>

            <div className="p-6 sm:p-8">
              {/* HEADER DI DALAM CARD */}
              <div className="text-center mb-8">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                  Sensus Ekonomi 2026
                </h1>
                <p className="mt-1.5 text-sm text-neutral-500">
                  Form Registrasi Sensus Ekonomi 2026 ASN Pemerintah Kabupaten Tabanan
                </p>
              </div>

              {/* PROGRESS BAR */}
              <div className="flex items-center gap-3 mb-10">
                {[1, 2, 3].map((step, idx) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300
                      ${currentBlock >= step 
                        ? 'bg-neutral-900 text-white' 
                        : 'bg-neutral-100 text-neutral-400'
                      }
                    `}>
                      {currentBlock > step ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : step}
                    </div>
                    <span className={`
                      ml-2 text-sm font-medium hidden sm:inline transition-colors duration-300
                      ${currentBlock >= step ? 'text-neutral-900' : 'text-neutral-400'}
                    `}>
                      {step === 1 ? 'Identitas' : step === 2 ? 'Tempat' : 'Tambahan'}
                    </span>
                    {idx < 2 && (
                      <div className={`flex-1 h-0.5 mx-3 transition-all duration-300 ${currentBlock > step ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={(e) => e.preventDefault()}>
                
                {/* ================= BLOK I ================= */}
                {currentBlock === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-900 text-white text-xs font-bold">1</span>
                      <h3 className="text-lg font-semibold text-neutral-900">Identitas Umum</h3>
                    </div>

                    <InputField
                      label="101. Nama Pegawai (Tanpa Gelar) *"
                      name="namaPegawai"
                      value={formData.namaPegawai}
                      onChange={handleInputChange}
                      placeholder="Masukkan nama tanpa gelar"
                      error={errors.namaPegawai}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField
                        label="102. Nomor Kartu Keluarga (KK) *"
                        name="noKK"
                        value={formData.noKK}
                        onChange={handleInputChange}
                        placeholder="16 digit angka"
                        maxLength={16}
                        error={errors.noKK}
                      />
                      <InputField
                        label="103. Nomor Induk Kependudukan (NIK) *"
                        name="nik"
                        value={formData.nik}
                        onChange={handleInputChange}
                        placeholder="16 digit angka"
                        maxLength={16}
                        error={errors.nik}
                      />
                    </div>

                    <InputField
                      label="104. Nama Kepala Keluarga *"
                      name="namaKepalaKeluarga"
                      value={formData.namaKepalaKeluarga}
                      onChange={handleInputChange}
                      error={errors.namaKepalaKeluarga}
                    />

                    <InputField
                      label="105. Nama Anggota Keluarga Lain dalam 1 KK *"
                      name="namaAnggotaKeluargaLain"
                      value={formData.namaAnggotaKeluargaLain}
                      onChange={handleInputChange}
                      hint="Isi dengan '-' jika tidak ada"
                      error={errors.namaAnggotaKeluargaLain}
                    />

                    <div>
                      <label className="block text-sm font-medium text-neutral-900 mb-1.5">
                        106. Asal Instansi/OPD *
                      </label>
                      <SearchableSelect
                        options={DAFTAR_OPD}
                        value={formData.asalOPD}
                        onChange={(val) => {
                          setFormData(prev => ({ ...prev, asalOPD: val }));
                          validateField('asalOPD', val);
                        }}
                        placeholder="Pilih atau cari OPD..."
                        error={errors.asalOPD}
                      />
                      {errors.asalOPD && <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.asalOPD}
                      </p>}
                    </div>

                    <InputField
                      label="107. Nomor Induk Kepegawaian (NIP) *"
                      name="nip"
                      value={formData.nip}
                      onChange={handleInputChange}
                      placeholder="18 digit angka"
                      maxLength={18}
                      error={errors.nip}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField
                        label="108. Nomor HP (WhatsApp) *"
                        name="noHP"
                        value={formData.noHP}
                        onChange={handleInputChange}
                        placeholder="08123456789"
                        error={errors.noHP}
                      />
                      <InputField
                        label="109. Alamat Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="contoh@email.com"
                        error={errors.email}
                      />
                    </div>
                  </div>
                )}

                {/* ================= BLOK II ================= */}
                {currentBlock === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-900 text-white text-xs font-bold">2</span>
                      <h3 className="text-lg font-semibold text-neutral-900">Keterangan Tempat</h3>
                    </div>

                    <TextAreaField
                      label="201. Alamat Lengkap *"
                      name="alamatLengkap"
                      value={formData.alamatLengkap}
                      onChange={handleInputChange}
                      placeholder="Tuliskan nama jalan, no rumah, banjar, dll..."
                      error={errors.alamatLengkap}
                    />

                    <div>
                      <label htmlFor="kabupaten" className="block text-sm font-medium text-neutral-900 mb-1.5">
                        202. Kabupaten Tempat Tinggal Saat Ini *
                      </label>
                      <div className="relative">
                        <select
                          id="kabupaten"
                          name="kabupaten"
                          value={formData.kabupaten}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 text-sm rounded-xl border-2 border-neutral-200 bg-white
                            appearance-none cursor-pointer
                            hover:border-neutral-300 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/10
                            focus:outline-none transition-all duration-200"
                        >
                          <option value="Di Dalam Kabupaten Tabanan">Di Dalam Kabupaten Tabanan</option>
                          <option value="Di Luar Kabupaten Tabanan">Di Luar Kabupaten Tabanan</option>
                        </select>
                        <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>

                    {formData.kabupaten === 'Di Dalam Kabupaten Tabanan' && (
                      <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-900 mb-1.5">
                              203. Kecamatan *
                            </label>
                            <SearchableSelect
                              options={Object.keys(ROOSTER_WILAYAH)}
                              value={formData.kecamatan}
                              onChange={(val) => {
                                setFormData(prev => ({ ...prev, kecamatan: val, desa: '', slsBanjar: '' }));
                                if (val && ROOSTER_WILAYAH[val]) setDaftarDesa(Object.keys(ROOSTER_WILAYAH[val]));
                                else setDaftarDesa([]);
                                setDaftarBanjar([]);
                                setErrors(prev => ({ ...prev, kecamatan: '' }));
                              }}
                              placeholder="Pilih atau cari..."
                              error={errors.kecamatan}
                            />
                            {errors.kecamatan && <p className="mt-1.5 text-xs text-red-600">{errors.kecamatan}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-900 mb-1.5">
                              204. Desa *
                            </label>
                            <SearchableSelect
                              options={daftarDesa}
                              value={formData.desa}
                              disabled={!formData.kecamatan}
                              onChange={(val) => {
                                setFormData(prev => ({ ...prev, desa: val, slsBanjar: '' }));
                                if (formData.kecamatan && val && ROOSTER_WILAYAH[formData.kecamatan]?.[val]) {
                                  setDaftarBanjar(ROOSTER_WILAYAH[formData.kecamatan][val]);
                                } else {
                                  setDaftarBanjar([]);
                                }
                                setErrors(prev => ({ ...prev, desa: '' }));
                              }}
                              placeholder="Pilih atau cari..."
                              error={errors.desa}
                            />
                            {errors.desa && <p className="mt-1.5 text-xs text-red-600">{errors.desa}</p>}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-900 mb-1.5">
                            205. SLS / Banjar *
                          </label>
                          <SearchableSelect
                            options={daftarBanjar}
                            value={formData.slsBanjar}
                            disabled={!formData.desa}
                            onChange={(val) => {
                              setFormData(prev => ({ ...prev, slsBanjar: val }));
                              validateField('slsBanjar', val);
                            }}
                            placeholder="Pilih atau cari..."
                            error={errors.slsBanjar}
                          />
                          {errors.slsBanjar && <p className="mt-1.5 text-xs text-red-600">{errors.slsBanjar}</p>}
                        </div>

                        <div className="pt-2">
                          <label className="block text-sm font-medium text-neutral-900 mb-1.5">
                            206. Geotagging Lokasi Tempat Tinggal *
                          </label>
                          <p className="text-xs text-neutral-500 mb-4">
                            Tandai lokasi rumah Anda pada peta untuk memudahkan petugas lapangan.
                          </p>
                          
                          <div className="rounded-xl overflow-hidden border-2 border-neutral-200">
                            <MapPicker 
                              savedLat={formData.latitude}
                              savedLng={formData.longitude}
                              onLocationSelect={(lat, lng) => {
                                setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                                setErrors(prev => ({ ...prev, latitude: '' }));
                              }} 
                            />
                          </div>
                          {errors.latitude && <p className="mt-1.5 text-xs text-red-600">{errors.latitude}</p>}
                          
                          {formData.latitude && (
                            <div className="mt-3 flex items-center gap-4 px-4 py-3 bg-neutral-900 text-white rounded-xl text-xs font-mono">
                              <div className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Lat: {formData.latitude}
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Lng: {formData.longitude}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ================= BLOK III ================= */}
                {currentBlock === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-900 text-white text-xs font-bold">3</span>
                      <h3 className="text-lg font-semibold text-neutral-900">Keterangan Tambahan</h3>
                    </div>

                    {formData.kabupaten === 'Di Dalam Kabupaten Tabanan' && (
                      <div className="space-y-6">
                        <RadioGroup
                          label="301. Apakah memiliki usaha di tempat tinggal? *"
                          name="memilikiUsaha"
                          value={formData.memilikiUsaha}
                          onChange={handleInputChange}
                          options={[
                            { value: 'Ya', label: 'Ya' },
                            { value: 'Tidak', label: 'Tidak' }
                          ]}
                          error={errors.memilikiUsaha}
                        />

                        <InputField
                          label="302. Nomor/ID Meteran PLN *"
                          name="noMeteranPLN"
                          value={formData.noMeteranPLN}
                          onChange={handleInputChange}
                          hint="Isi dengan '-' jika tidak menggunakan meteran PLN"
                          error={errors.noMeteranPLN}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FileUpload
                            label="303. Foto Rumah Tampak Depan *"
                            name="fotoRumah"
                            value={formData.fotoRumah}
                            onChange={(e) => handleFileChange(e, 'fotoRumah')}
                            hint="Foto tampak depan untuk verifikasi lapangan"
                            error={errors.fotoRumah}
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                              </svg>
                            }
                          />

                          <FileUpload
                            label="304. Foto Ruang Tamu *"
                            name="fotoRuangTamu"
                            value={formData.fotoRuangTamu}
                            onChange={(e) => handleFileChange(e, 'fotoRuangTamu')}
                            hint="Foto ruang tamu untuk data kesejahteraan"
                            error={errors.fotoRuangTamu}
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                              </svg>
                            }
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-neutral-200">
                      <RadioGroup
                        label="305. Apakah sudah dilakukan pendataan Sensus Ekonomi 2026 di rumah Anda? *"
                        name="sudahDidataSE"
                        value={formData.sudahDidataSE}
                        onChange={handleInputChange}
                        options={[
                          { value: 'Ya', label: 'Ya, sudah didata' },
                          { value: 'Tidak', label: 'Belum didata' }
                        ]}
                        error={errors.sudahDidataSE}
                      />
                    </div>
                  </div>
                )}

                {/* NAVIGATION BUTTONS */}
                <div className="flex items-center justify-between mt-10 pt-6 border-t border-neutral-200">
                  {currentBlock > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="group inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-neutral-700 
                        bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-all duration-200
                        focus:outline-none focus:ring-4 focus:ring-neutral-900/10"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      Kembali
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentBlock < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white
                        bg-neutral-900 rounded-xl hover:bg-neutral-800 active:scale-[0.98]
                        transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-neutral-900/20"
                    >
                      Selanjutnya
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white
                        bg-neutral-900 rounded-xl hover:bg-neutral-800 active:scale-[0.98]
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-neutral-900 disabled:active:scale-100
                        transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-neutral-900/20"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Submit Data
                        </>
                      )}
                    </button>
                  )}
                </div>

              </form>
            </div>
          </div>

          {/* FOOTER */}
          <p className="text-center text-xs text-neutral-400 mt-8">
            Data Anda aman dan hanya digunakan untuk keperluan Sensus Ekonomi 2026
          </p>
        </div>
      </div>
    </>
  );
}