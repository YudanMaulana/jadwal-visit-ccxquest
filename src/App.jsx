import React, { useState, useEffect } from 'react';
import { 
  getScheduleByDate, 
  saveScheduleByDate,
  getAllSchedules,
  deleteScheduleByDate
} from './services/scheduleService';
import { isFirebaseConfigured } from './config/firebase';
import { APP_SETTINGS } from './config/settings';
import { 
  Calendar, 
  Settings, 
  Lock, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Save, 
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';

function App() {
  // Real-time current date as default state (YYYY-MM-DD)
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Path routing state (handles / and /admin)
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Admin panel state
  const [passcode, setPasscode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminBatches, setAdminBatches] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [adminMessage, setAdminMessage] = useState({ type: '', text: '' });

  // Custom calendar state
  const [allSchedules, setAllSchedules] = useState({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  // Listen to popstate changes (back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch all schedules for calendar indicators
  const fetchSchedulesMap = async () => {
    try {
      const data = await getAllSchedules();
      setAllSchedules(data);
    } catch (err) {
      console.error('Error fetching schedules map:', err);
    }
  };

  useEffect(() => {
    fetchSchedulesMap();
  }, []);

  // Custom SPA navigator
  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Format YYYY-MM-DD into "Kamis, 11 Juni 2026"
  const formatDateIndonesian = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const dayName = days[dateObj.getDay()];
    const dayNum = dateObj.getDate();
    const monthName = months[dateObj.getMonth()];
    const fullYear = dateObj.getFullYear();
    
    return `${dayName}, ${dayNum} ${monthName} ${fullYear}`;
  };

  // Fetch schedule on date change
  // Default 5-batch template for admin when no Firestore data exists for a date
  const getDefaultAdminBatches = () => [
    { id: 1, batch: 'Batch 1', time: '08:45', status: 'tersedia', quota: null },
    { id: 2, batch: 'Batch 2', time: '09:45', status: 'tersedia', quota: null },
    { id: 3, batch: 'Batch 3', time: '12:45', status: 'tersedia', quota: null },
    { id: 4, batch: 'Batch 4', time: '13:45', status: 'tersedia', quota: null },
    { id: 5, batch: 'Batch 5', time: '14:45', status: 'tersedia', quota: null },
  ];

  const fetchSchedule = async (dateStr) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await getScheduleByDate(dateStr);
      
      // Ensure we have at most 5 batches
      let formattedBatches = data.batches || [];
      if (formattedBatches.length > 5) {
        formattedBatches = formattedBatches.slice(0, 5);
      }
      
      setBatches(formattedBatches);
      
      // Seed admin state: use fetched data if exists, else use default 5-batch template
      const adminSeed = formattedBatches.length > 0
        ? JSON.parse(JSON.stringify(formattedBatches))
        : getDefaultAdminBatches();
      setAdminBatches(adminSeed);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memuat jadwal kunjungan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(selectedDate);
  }, [selectedDate]);

  // Open calendar aligned with selected date
  const openCalendar = () => {
    const [year, month] = selectedDate.split('-').map(Number);
    setCalMonth(month - 1);
    setCalYear(year);
    setIsCalendarOpen(true);
  };

  // Handle WhatsApp Link Click
  const handleWhatsAppClick = () => {
    const formattedDate = formatDateIndonesian(selectedDate);
    const text =
`Isi dan kirimkan pesan berikut untuk reservasi:

Nama PIC/Penanggungjawab: 
Tanggal Kunjungan: ${formattedDate}
Batch: 
Jumlah Visitor: `;
    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${APP_SETTINGS.whatsappNumber}?text=${encodedText}`;
    window.open(url, '_blank');
  };

  // Unlock admin panel using passcode 'chocolatos!23'
  const handleUnlockAdmin = (e) => {
    e.preventDefault();
    if (passcode === 'chocolatos!23') {
      setIsUnlocked(true);
      setAdminMessage({ type: 'success', text: 'Login Admin Berhasil! Anda dapat mengubah jadwal sekarang.' });
      setTimeout(() => setAdminMessage({ type: '', text: '' }), 3000);
    } else {
      setAdminMessage({ type: 'error', text: 'Passcode salah. Silakan coba lagi.' });
    }
  };

  // Update batch field in admin panel (max 5 batches, max 54 people per batch)
  const updateAdminBatch = (index, field, value) => {
    const updated = [...adminBatches];
    let finalValue = value;
    
    // Validate and clamp quota to maximum of 54 people
    if (field === 'quota') {
      const parsed = parseInt(value);
      if (isNaN(parsed)) {
        finalValue = ''; // Allow emptying
      } else {
        // Enforce range: [0, 54]
        finalValue = Math.min(54, Math.max(0, parsed));
      }
    }
    
    updated[index][field] = finalValue;
    
    // Automatically generate statusLabel based on status and quota
    if (field === 'status' || field === 'quota') {
      const statusType = field === 'status' ? finalValue : updated[index].status;
      const quotaVal = field === 'quota' ? finalValue : updated[index].quota;
      
      if (statusType === 'tersedia_quota') {
        const booked = quotaVal === '' ? 0 : parseInt(quotaVal) || 0;
        const remaining = 54 - booked;
        updated[index].statusLabel = remaining <= 0 ? 'PENUH' : `TERSEDIA ${remaining} ORANG`;
      } else if (statusType === 'tersedia') {
        updated[index].statusLabel = 'TERSEDIA';
        updated[index].quota = null;
      } else if (statusType === 'penuh') {
        updated[index].statusLabel = 'PENUH';
        updated[index].quota = null;
      }
    }
    
    setAdminBatches(updated);
  };

  // Save changes to Firestore
  const handleSaveAdmin = async () => {
    setIsSaving(true);
    setAdminMessage({ type: '', text: '' });
    
    // Ensure we validate quota for all batches before saving
    const validatedBatches = adminBatches.slice(0, 5).map(b => {
      if (b.status === 'tersedia_quota') {
        const booked = Math.min(54, Math.max(0, parseInt(b.quota) || 0));
        const remaining = 54 - booked;
        return {
          ...b,
          quota: booked,
          statusLabel: remaining <= 0 ? 'PENUH' : `TERSEDIA ${remaining} ORANG`
        };
      }
      return b;
    });

    try {
      const result = await saveScheduleByDate(selectedDate, {
        batches: validatedBatches,
        whatsappNumber: APP_SETTINGS.whatsappNumber,
        whatsappDisplay: APP_SETTINGS.whatsappDisplay
      });
      
      if (result.success) {
        setAdminMessage({ 
          type: 'success', 
          text: result.mocked 
            ? 'Tersimpan lokal (Demo Mode)! Hubungkan Firebase untuk menyimpan permanen.' 
            : 'Jadwal berhasil diperbarui di Firestore!' 
        });
        
        // Refresh local data and map indicators
        setBatches(validatedBatches);
        setAdminBatches(validatedBatches);
        await fetchSchedulesMap();
      } else {
        setAdminMessage({ type: 'error', text: 'Gagal menyimpan ke Firestore: ' + result.error?.message });
      }
    } catch (err) {
      setAdminMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete/reset schedule from Firestore (CRUD: Delete)
  const handleDeleteAdmin = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin reset jadwal kunjungan untuk tanggal ${formatDateIndonesian(selectedDate)}? Jadwal akan kembali ke default.`)) {
      return;
    }
    setIsDeleting(true);
    setAdminMessage({ type: '', text: '' });
    
    try {
      const result = await deleteScheduleByDate(selectedDate);
      if (result.success) {
        setAdminMessage({
          type: 'success',
          text: result.mocked 
            ? 'Jadwal di-reset ke default (Demo Mode).' 
            : 'Jadwal berhasil di-reset ke default!'
        });
        
        // Refresh local details and schedules map
        await fetchSchedule(selectedDate);
        await fetchSchedulesMap();
      } else {
        setAdminMessage({ type: 'error', text: 'Gagal mereset jadwal: ' + result.error?.message });
      }
    } catch (err) {
      setAdminMessage({ type: 'error', text: 'Terjadi kesalahan saat mereset jadwal.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // --- CALENDAR MODAL COMPONENT ---
  const renderCalendarModal = () => {
    if (!isCalendarOpen) return null;

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    // Get number of days in viewed month
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    // Get start day offset (0 = Sunday, 6 = Saturday)
    const startOffset = new Date(calYear, calMonth, 1).getDay();

    // Prepare calendar cells
    const cells = [];
    // Blank padding cells for start offset
    for (let i = 0; i < startOffset; i++) {
      cells.push({ key: `blank-${i}`, isBlank: true });
    }

    const todayStr = getTodayDateString();
    
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(calMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${calYear}-${monthStr}-${dayStr}`;
      
      // Past date check
      const cellDateObj = new Date(calYear, calMonth, day);
      const todayDateObj = new Date();
      cellDateObj.setHours(0, 0, 0, 0);
      todayDateObj.setHours(0, 0, 0, 0);
      
      const isPast = cellDateObj < todayDateObj;
      const isSelected = dateStr === selectedDate;
      const isToday = dateStr === todayStr;

      // Check visit status in allSchedules
      const schedule = allSchedules[dateStr];
      const hasVisitData = !!schedule;
      let isFull = false;
      if (hasVisitData && schedule.batches) {
        isFull = schedule.batches.every(b => 
          b.status === 'penuh' || (b.status === 'tersedia_quota' && (parseInt(b.quota) || 0) >= 54)
        );
      }

      cells.push({
        key: `day-${day}`,
        day,
        dateStr,
        isPast,
        isSelected,
        isToday,
        hasVisitData,
        isFull,
        isBlank: false
      });
    }

    const handlePrevMonth = () => {
      const today = new Date();
      if (calYear < today.getFullYear() || 
         (calYear === today.getFullYear() && calMonth <= today.getMonth())) {
        return;
      }
      if (calMonth === 0) {
        setCalMonth(11);
        setCalYear(prev => prev - 1);
      } else {
        setCalMonth(prev => prev - 1);
      }
    };

    const handleNextMonth = () => {
      if (calMonth === 11) {
        setCalMonth(0);
        setCalYear(prev => prev + 1);
      } else {
        setCalMonth(prev => prev + 1);
      }
    };

    const handleSelectDay = (dateStr) => {
      setSelectedDate(dateStr);
      setIsCalendarOpen(false);
    };

    const todayVal = new Date();
    const isPrevDisabled = calYear < todayVal.getFullYear() || 
      (calYear === todayVal.getFullYear() && calMonth <= todayVal.getMonth());

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs transition-all duration-200">
        <div 
          className="bg-[#0b172a] border border-[#1e3d6b] rounded-2xl w-full max-w-[380px] shadow-[0_0_50px_rgba(0,149,255,0.25)] p-5 relative text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-[#1e3d6b] pb-3 mb-4">
            <h3 className="text-sm font-bold font-orbitron tracking-wider text-cyan-400">PILIH TANGGAL KUNJUNGAN</h3>
            <button 
              onClick={() => setIsCalendarOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between mb-4 px-1">
            <button
              onClick={handlePrevMonth}
              disabled={isPrevDisabled}
              className={`p-1.5 rounded-lg border border-slate-700 transition-all ${
                isPrevDisabled 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-[#1a385f] hover:border-cyan-400 text-slate-300 hover:text-white cursor-pointer'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            
            <span className="font-bold text-sm tracking-wide">
              {monthNames[calMonth]} {calYear}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-700 hover:bg-[#1a385f] hover:border-cyan-400 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {dayNames.map((n, idx) => (
              <span key={idx} className={`text-[10px] font-bold uppercase py-1 ${idx === 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                {n}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {cells.map((cell) => {
              if (cell.isBlank) {
                return <div key={cell.key} className="aspect-square" />;
              }

              let btnClass = "aspect-square flex flex-col items-center justify-center text-xs font-bold rounded-lg relative transition-all ";
              let marker = null;

              if (cell.isPast) {
                btnClass += "text-slate-600 cursor-not-allowed opacity-40 bg-transparent";
              } else {
                btnClass += "cursor-pointer ";
                
                if (cell.isSelected) {
                  btnClass += "bg-gradient-to-r from-blue-700 to-cyan-600 text-white shadow-[0_0_12px_rgba(0,149,255,0.4)] border border-cyan-400";
                } else if (cell.isToday) {
                  btnClass += "bg-slate-900 border border-yellow-500 text-yellow-550 hover:bg-slate-800";
                } else {
                  btnClass += "bg-black/20 text-slate-200 hover:bg-[#10243d] hover:text-white border border-transparent";
                }

                // Visit status markers
                if (cell.hasVisitData) {
                  if (cell.isFull) {
                    marker = (
                      <span 
                        className={`absolute bottom-1 w-1.5 h-1.5 rounded-full bg-red-500 ${cell.isSelected ? 'border border-white' : ''}`}
                        title="Kunjungan Penuh"
                      />
                    );
                    if (!cell.isSelected) {
                      btnClass += " text-red-200/80 hover:text-red-100";
                    }
                  } else {
                    marker = (
                      <span 
                        className={`absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-500 ${cell.isSelected ? 'border border-white' : ''}`} 
                        title="Ada Jadwal Visit"
                      />
                    );
                    if (!cell.isSelected) {
                      btnClass += " text-emerald-200/85 hover:text-emerald-100";
                    }
                  }
                }
              }

              return (
                <button
                  key={cell.key}
                  disabled={cell.isPast}
                  onClick={() => handleSelectDay(cell.dateStr)}
                  className={btnClass}
                >
                  <span>{cell.day}</span>
                  {marker}
                </button>
              );
            })}
          </div>

          {/* Calendar Legends */}
          <div className="mt-5 pt-3 border-t border-[#1e3d6b] flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-350 justify-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-900 border border-yellow-500" />
              <span>Hari Ini</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Ada Kunjungan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Penuh</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDERING ROUTE: ADMIN PANEL ---
  if (currentPath === '/admin') {
    return (
      <div className="min-h-screen bg-[#040811] flex items-center justify-center p-4 select-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0d213b] via-[#050c18] to-[#02040a]">
        
        {/* Background Grids for Desktop Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
          <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="bg-[#0b172a] border border-[#1e3d6b] rounded-2xl w-full max-w-[440px] shadow-[0_0_50px_rgba(0,149,255,0.15)] p-6 relative z-10">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b border-[#1e3d6b] pb-3">
            <div className="flex items-center gap-2">
              <Settings className="text-[#00f0ff]" size={20} />
              <h2 className="text-base md:text-lg font-bold text-white font-orbitron tracking-wider">PANEL KONTROL ADMIN</h2>
            </div>
            
            <button
              onClick={() => navigateTo('/')}
              className="text-xs text-cyan-400 hover:text-white flex items-center gap-1 bg-[#10243d] px-2.5 py-1 rounded-lg border border-[#1e3d6b] transition-all cursor-pointer"
            >
              <Eye size={12} />
              <span>Lihat Flyer</span>
            </button>
          </div>

          {/* Firebase configuration warning banner */}
          {!isFirebaseConfigured && (
            <div className="mb-4 bg-amber-950/20 border border-amber-500/20 p-3 rounded-lg flex gap-2.5 text-xs text-amber-200">
              <AlertTriangle size={24} className="flex-shrink-0 text-amber-400" />
              <div>
                <p className="font-bold">Mode Demo (Lokal)</p>
                <p>Firebase belum terkonfigurasi. Perubahan jadwal hanya disimpan sementara di memory untuk demonstrasi.</p>
              </div>
            </div>
          )}

          {/* Admin Message Banner */}
          {adminMessage.text && (
            <div className={`mb-4 p-3 rounded-lg text-xs flex gap-2 ${
              adminMessage.type === 'success' 
                ? 'bg-emerald-950/30 border border-emerald-500/35 text-emerald-200' 
                : 'bg-red-950/30 border border-red-500/35 text-red-200'
            }`}>
              {adminMessage.type === 'success' ? <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" /> : <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />}
              <span>{adminMessage.text}</span>
            </div>
          )}

          {/* PASCODE UNLOCK SCREEN */}
          {!isUnlocked ? (
            <form onSubmit={handleUnlockAdmin} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Silakan masukkan kata sandi admin untuk melakukan modifikasi jadwal pada database.
              </p>
              
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-semibold uppercase tracking-wider block">Kata Sandi</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-3.5 text-slate-500" />
                  <input 
                    type="password"
                    placeholder="Masukkan sandi admin"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-[#1e3d6b] rounded-xl text-white text-sm focus:border-cyan-400 focus:outline-none placeholder-slate-650"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-600 hover:to-cyan-500 text-white rounded-xl text-xs font-bold font-orbitron tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Lock size={14} />
                MASUK SEBAGAI ADMIN
              </button>
            </form>
          ) : (
            /* ADMIN PANEL MAIN EDITOR SCREEN */
            <div className="space-y-5">
              
              {/* Date Reference */}
              <div className="bg-[#10243d] p-3.5 rounded-xl border border-[#1a385f] flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">TANGGAL YANG DIEDIT</p>
                  <p className="text-sm font-bold text-white mt-0.5">{formatDateIndonesian(selectedDate)}</p>
                </div>
                
                {/* Datepicker trigger inside admin panel */}
                <button 
                  onClick={openCalendar}
                  className="bg-[#0b172a] hover:bg-[#1a385f] px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs text-slate-350 focus:outline-none"
                >
                  <Calendar size={13} className="text-cyan-400" />
                  <span>Ubah Tanggal</span>
                </button>
              </div>

              {/* Batch Editor List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider">DAFTAR BATCH (MAKS 5 BATCH)</h3>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {adminBatches.map((batch, index) => (
                    <div 
                      key={batch.id} 
                      className="p-3 bg-black/25 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{batch.batch}</span>
                        
                        {/* Batch Time input */}
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} className="text-slate-500" />
                          <input 
                            type="text" 
                            value={batch.time}
                            onChange={(e) => updateAdminBatch(index, 'time', e.target.value)}
                            placeholder="08:45"
                            className="w-[60px] text-center px-1.5 py-0.5 bg-black/50 border border-slate-700 rounded text-slate-200 text-xs font-bold focus:border-cyan-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Status Picker */}
                        <div>
                          <label className="text-[9px] text-slate-500 uppercase block mb-0.5">Status</label>
                          <select
                            value={batch.status}
                            onChange={(e) => updateAdminBatch(index, 'status', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-[11px] focus:outline-none focus:border-cyan-400"
                          >
                            <option value="tersedia">TERSEDIA</option>
                            <option value="tersedia_quota">TERSEDIA DENGAN KUOTA</option>
                            <option value="penuh">PENUH</option>
                          </select>
                        </div>

                        {/* Quota input (max 54 people) */}
                        <div>
                          <label className="text-[9px] text-slate-500 uppercase block mb-0.5">Terbooking (Maks 54)</label>
                          <input 
                            type="number"
                            disabled={batch.status !== 'tersedia_quota'}
                            value={batch.quota === null ? '' : batch.quota}
                            onChange={(e) => updateAdminBatch(index, 'quota', e.target.value)}
                            placeholder="Maks 54"
                            min="0"
                            max="54"
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-[11px] focus:outline-none focus:border-cyan-400 disabled:opacity-30 disabled:bg-slate-950"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save and Controls */}
              <div className="flex flex-col gap-2.5 pt-3 border-t border-[#1e3d6b]">
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAdmin}
                    disabled={isDeleting || isSaving}
                    className="flex-1 py-2.5 bg-red-950/40 hover:bg-red-900/40 text-red-200 rounded-xl text-xs font-bold border border-red-900/60 transition-all font-orbitron cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-30"
                  >
                    {isDeleting ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    RESET DEFAULT
                  </button>
                  
                  <button
                    onClick={handleSaveAdmin}
                    disabled={isSaving || isDeleting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-orbitron tracking-wider flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    SIMPAN JADWAL
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsUnlocked(false);
                    setPasscode('');
                    setAdminMessage({ type: '', text: '' });
                  }}
                  className="w-full py-2 bg-slate-850 hover:bg-slate-800 text-white rounded-xl text-xs font-bold border border-slate-700 transition-all font-orbitron cursor-pointer"
                >
                  LOGOUT
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Render calendar modal inside admin path */}
        {renderCalendarModal()}
      </div>
    );
  }

  // --- RENDERING ROUTE: PUBLIC FLYER ---
  return (
    <div className="min-h-screen bg-[#040811] flex items-center justify-center p-0 md:p-6 select-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0d213b] via-[#050c18] to-[#02040a]">
      
      {/* Background Grids for Desktop Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      {/* 
        Main Card Simulator with Locked Aspect Ratio matching the original poster (9:16).
        This makes the flyer look EXACTLY like the image, with all dynamic elements layered precisely on top.
      */}
      <div 
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        className="relative w-full md:w-[450px] aspect-[9/16] bg-[url('/bg-flyer.webp')] bg-cover bg-center overflow-hidden shadow-[0_0_50px_rgba(0,149,255,0.25)] border-0 md:border md:border-[#1a385f]/30 md:rounded-3xl select-none"
      >
        
        {/* --- DYNAMIC DATE OVERLAY --- */}
        {/* Positioned between X-Quest logo and the title at ~27% */}
        <div className="absolute top-[27%] left-0 w-full flex justify-center z-20">
          <button 
            onClick={openCalendar}
            className="relative bg-[#0d2138]/95 px-6 md:px-8 py-1.5 md:py-2 text-center border border-[#fbc02d]/35 hover:border-[#00f0ff] rounded-full shadow-[0_0_18px_rgba(0,240,255,0.15)] flex items-center gap-3 cursor-pointer transition-all duration-200 hover:scale-102 focus:outline-none"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
            <div className="flex flex-col items-center">
              <span className="font-sans font-black tracking-wider text-[#fbc02d] text-[11px] md:text-xs uppercase leading-tight">
                {formatDateIndonesian(selectedDate)}
              </span>
              <span className="text-[8px] text-[#00f0ff] font-bold font-orbitron tracking-widest uppercase mt-0.5 animate-pulse leading-none">
                KLIK UNTUK PILIH TANGGAL
              </span>
            </div>
          </button>
        </div>

        {/* --- DYNAMIC TABLE OVERLAY --- */}
        {/* Table area on the new flyer: top=34%, left=8%, width=84%, height=27% */}
        <div className="absolute top-[34%] left-[8%] w-[84%] h-[27%] z-20 bg-[#0c1f3d] border border-white/20 rounded-lg overflow-hidden flex flex-col justify-start">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-[10px] text-cyan-400 tracking-widest font-orbitron animate-pulse">LOADING...</p>
            </div>
          ) : errorMsg ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 bg-red-950/10">
              <AlertTriangle className="text-red-500 mb-1" size={24} />
              <p className="text-[10px] font-bold text-red-200">{errorMsg}</p>
            </div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Clock className="text-slate-500 mb-2" size={24} />
              <p className="text-[10px] font-bold text-slate-400">Jadwal belum diisi.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full w-full">
              {/* Header Row */}
              <div className="flex w-full h-[16%] bg-[#10346b] border-b border-[#ffffff]/20">
                <div className="w-[30%] border-r border-[#ffffff]/20 flex items-center justify-center text-[10px] md:text-xs font-black uppercase text-white font-orbitron tracking-wider">
                  Batch
                </div>
                <div className="w-[30%] border-r border-[#ffffff]/20 flex items-center justify-center text-center text-[10px] md:text-xs font-black uppercase text-white font-orbitron tracking-wider">
                  Jam kunjungan
                </div>
                <div className="w-[40%] flex items-center justify-center text-[10px] md:text-xs font-black uppercase text-white font-orbitron tracking-wider">
                  Status Booking
                </div>
              </div>
              
              {/* Batch Rows (Max 5 Batches) */}
              <div className="flex flex-col h-[84%] w-full">
                {batches.map((batch, index) => {
                  let statusBgClass = 'bg-[#0bb75c]';
                  let statusTextClass = 'text-white font-extrabold text-[9px] md:text-xs tracking-wider';
                  let displayLabel = 'TERSEDIA';

                  if (batch.status === 'tersedia_quota') {
                    const booked = parseInt(batch.quota) || 0;
                    const remaining = 54 - booked;
                    if (remaining <= 0) {
                      statusBgClass = 'bg-[#ef4444]';
                      displayLabel = 'PENUH';
                    } else {
                      statusBgClass = 'bg-[#f0a53b]';
                      displayLabel = `TERSEDIA ${remaining} ORANG`;
                    }
                  } else if (batch.status === 'penuh') {
                    statusBgClass = 'bg-[#ef4444]';
                    displayLabel = 'PENUH';
                  }

                  return (
                    <div 
                      key={batch.id || index}
                      className="flex w-full h-[20%] border-b border-[#ffffff]/20 last:border-b-0"
                    >
                      <div className="w-[30%] border-r border-[#ffffff]/20 flex items-center justify-center text-[10px] md:text-xs font-bold text-white bg-[#0c1f3d]">
                        {batch.batch}
                      </div>
                      <div className="w-[30%] border-r border-[#ffffff]/20 flex items-center justify-center text-[10px] md:text-xs font-bold text-white bg-[#0c1f3d]">
                        {batch.time}
                      </div>
                      <div className={`w-[40%] flex flex-col items-center justify-center p-1 text-center ${statusBgClass}`}>
                        <span className={statusTextClass}>
                          {displayLabel}
                        </span>
                        {batch.status === 'tersedia' && (
                          <span className="text-white/80 font-bold text-[7px] md:text-[8px] tracking-wide leading-tight mt-0.5">
                            maks 54 orang
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* --- WHATSAPP CALL-TO-ACTION BUTTON --- */}
        {/* Aligned with "Catatan:" text: top=65%, left=5%, width=50% */}
        <div className="absolute top-[67%] left-[3%] w-[50%] z-20">
          <button
            onClick={handleWhatsAppClick}
            className="w-full py-1 flex items-center justify-center gap-1.5 rounded-lg cursor-pointer focus:outline-none transition-all duration-200 hover:scale-102 active:scale-98"
            style={{
              background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
              boxShadow: '0 0 20px rgba(37,211,102,0.45)',
              border: '1px solid rgba(37,211,102,0.5)'
            }}
            title="Hubungi WhatsApp Admin"
          >
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.121 1.535 5.849L.057 23.625a.75.75 0 0 0 .92.92l5.776-1.478A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.718 9.718 0 0 1-4.953-1.352l-.355-.211-3.68.941.957-3.594-.232-.37A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
            </svg>
            <span className="text-white font-black text-[9px] font-orbitron tracking-wider uppercase">
              Booking via WhatsApp
            </span>
          </button>
        </div>



      </div>

      {/* Render calendar modal inside public path */}
      {renderCalendarModal()}
    </div>
  );
}

export default App;
