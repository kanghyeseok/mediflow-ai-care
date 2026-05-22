import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Clock, 
  Plus, 
  Check, 
  AlertCircle, 
  Trash2, 
  Activity, 
  Volume2, 
  Smile, 
  Sun, 
  Moon, 
  Sunrise, 
  Sunset,
  Heart,
  PlusCircle
} from 'lucide-react';

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  category: string;
  slots: ('morning' | 'afternoon' | 'evening' | 'night')[];
  times: string[]; // 예: ["08:00", "20:00"]
  instructions: string;
  color: 'cyan' | 'blue' | 'purple' | 'green' | 'yellow';
  stock: number;
  totalStock: number;
  taken: { [slot: string]: boolean };
  sideEffects?: string[];
}

interface DashboardProps {
  medicines: Medicine[];
  onTakeMedicine: (id: string, slot: string) => void;
  onAddMedicine: (med: Omit<Medicine, 'id' | 'taken'>) => void;
  onDeleteMedicine: (id: string) => void;
  onRefillMedicine: (id: string) => void;
  onTriggerTestAlarm: (med: Medicine, slot: string) => void;
  view?: 'dashboard' | 'storage';
  streak?: number;
}

export default function Dashboard({
  medicines,
  onTakeMedicine,
  onAddMedicine,
  onDeleteMedicine,
  onRefillMedicine,
  onTriggerTestAlarm,
  view = 'dashboard',
  streak = 0
}: DashboardProps) {
  // 양식 상태 관리
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [category, setCategory] = useState('일반 케어');
  const [selectedSlots, setSelectedSlots] = useState<('morning' | 'afternoon' | 'evening' | 'night')[]>([]);
  const [instructions, setInstructions] = useState('');
  const [color, setColor] = useState<'cyan' | 'blue' | 'purple' | 'green' | 'yellow'>('cyan');
  const [stock, setStock] = useState('30');

  // 복약 통계 산출
  const getComplianceStats = () => {
    let totalScheduled = 0;
    let totalTaken = 0;

    medicines.forEach(med => {
      med.slots.forEach(slot => {
        totalScheduled++;
        if (med.taken[slot]) {
          totalTaken++;
        }
      });
    });

    const percent = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;
    return { totalScheduled, totalTaken, percent };
  };

  const { totalScheduled, totalTaken, percent } = getComplianceStats();

  // 강조 색상 헥스 매핑 헬퍼
  const getColorHex = (c: Medicine['color']) => {
    switch (c) {
      case 'cyan': return 'var(--accent-cyan)';
      case 'blue': return 'var(--accent-blue)';
      case 'purple': return 'var(--accent-purple)';
      case 'green': return 'var(--accent-green)';
      case 'yellow': return 'var(--accent-yellow)';
      default: return 'var(--accent-cyan)';
    }
  };

  const getColorGlow = (c: Medicine['color']) => {
    switch (c) {
      case 'cyan': return 'var(--glow-cyan)';
      case 'blue': return 'var(--glow-blue)';
      case 'purple': return 'var(--glow-purple)';
      case 'green': return 'var(--glow-green)';
      case 'yellow': return '0 0 20px rgba(245, 158, 11, 0.25)';
      default: return 'var(--glow-cyan)';
    }
  };

  // 약물 등록 폼 서브밋 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage || selectedSlots.length === 0) {
      alert('약물 이름, 1회 복용량(Dosage)을 입력하고 최소 하나의 복용 시간대를 선택해주세요.');
      return;
    }

    const totalStockVal = parseInt(stock) || 30;

    // 슬롯에 매칭되는 복약 예정 시간 생성
    const times: string[] = [];
    if (selectedSlots.includes('morning')) times.push('08:00');
    if (selectedSlots.includes('afternoon')) times.push('13:00');
    if (selectedSlots.includes('evening')) times.push('18:00');
    if (selectedSlots.includes('night')) times.push('21:30');

    onAddMedicine({
      name,
      dosage,
      category,
      slots: selectedSlots,
      times,
      instructions: instructions || '지시대로 복용하십시오.',
      color,
      stock: totalStockVal,
      totalStock: totalStockVal
    });

    // 폼 상태 리셋
    setName('');
    setDosage('');
    setCategory('일반 케어');
    setSelectedSlots([]);
    setInstructions('');
    setColor('cyan');
    setStock('30');
    setShowAddForm(false);
  };

  const toggleFormSlot = (slot: 'morning' | 'afternoon' | 'evening' | 'night') => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  // 한국어 날짜 가져오기
  const getKoreanDateString = () => {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const dayName = days[now.getDay()];
    return `${year}년 ${month}월 ${date}일 ${dayName}`;
  };

  // 순응도 인덱스 도넛 링 SVG 계수
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  // TAB 1: 투약 대시보드 렌더링
  const renderDashboardView = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in">
        {/* 좌측 컬럼: 오늘의 복약 달성도 및 스트릭 카운터 */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* 복약 달성도 카드 */}
          <div className="glass-card flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all"></div>
            <h2 className="text-lg font-semibold font-display tracking-wide mb-4 self-start flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" /> 오늘의 복약 달성도
            </h2>

            <div className="relative w-36 h-36 flex items-center justify-center my-2">
              <svg className="compliance-ring w-full h-full" viewBox="0 0 130 130">
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  className="stroke-slate-800"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  className="compliance-ring-circle"
                  stroke={percent === 100 && totalScheduled > 0 ? 'var(--accent-green)' : 'var(--accent-cyan)'}
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    filter: percent === 100 && totalScheduled > 0 ? 'var(--glow-green)' : 'var(--glow-cyan)',
                  }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-bold font-display">{percent}%</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">{totalTaken} / {totalScheduled} 완료</span>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-400">
              {totalScheduled === 0 ? (
                <span>오늘 예정된 복약 일정이 없습니다. 약물을 새로 등록해 보세요!</span>
              ) : (
                <span>오늘의 스케줄에 맞춰 정시에 약물을 올바르게 복용하십시오.</span>
              )}
            </div>
          </div>

          {/* 스트릭 카운터 카드 */}
          <div className="glass-card flex flex-col relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all"></div>
            <h2 className="text-xs font-bold font-mono tracking-widest text-slate-400 mb-2 uppercase">
              STREAK COUNTER
            </h2>
            <div className="flex items-center gap-3 py-2">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500 shadow-md shadow-amber-500/5">
                <span className="text-2xl">🔥</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-200">{streak}일 연속</span>
                <span className="text-[10px] text-slate-500 font-mono">연속 복약 달성 스트릭</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              오늘 복약을 완료하고 새로운 건강 스트릭을 쏘아 올려 보세요!
            </p>
          </div>
        </div>

        {/* 우측 컬럼: 오늘의 복약 타임라인 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-card flex-grow flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col">
                <h2 className="text-xl font-semibold font-display tracking-wide text-white">
                  오늘의 복약 타임라인
                </h2>
                <span className="text-xs text-slate-400 font-mono mt-0.5">
                  {getKoreanDateString()}
                </span>
              </div>
            </div>

            {medicines.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                </div>
                <h3 className="text-sm font-semibold text-slate-300 mb-1">
                  오늘 등록된 복약 스케줄이 없습니다.
                </h3>
                <p className="text-xs text-slate-500 max-w-sm px-4 leading-relaxed">
                  "복약 관리" 탭이나 "AI 상담소"에서 편리하게 처방전을 파싱해 새 스케줄을 추가해 보세요!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                {[
                  { id: 'morning', title: '아침', time: '08:00', icon: Sunrise, colorClass: 'text-amber-400 bg-amber-400/5 border-amber-400/10' },
                  { id: 'afternoon', title: '점심', time: '13:00', icon: Sun, colorClass: 'text-cyan-400 bg-cyan-400/5 border-cyan-400/10' },
                  { id: 'evening', title: '저녁', time: '18:00', icon: Sunset, colorClass: 'text-indigo-400 bg-indigo-400/5 border-indigo-400/10' },
                  { id: 'night', title: '취침 전', time: '21:30', icon: Moon, colorClass: 'text-violet-400 bg-violet-400/5 border-violet-400/10' }
                ].map(period => {
                  const Icon = period.icon;
                  const slotMeds = medicines.filter(m => m.slots.includes(period.id as any));

                  return (
                    <div key={period.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col min-h-[220px]">
                      <div className="flex items-center gap-2 mb-2 pb-1 border-b border-white/5">
                        <div className={`p-1.5 rounded-lg ${period.colorClass.split(' ')[1]} ${period.colorClass.split(' ')[2]}`}>
                          <Icon className={`w-4 h-4 ${period.colorClass.split(' ')[0]}`} />
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold font-display text-slate-200 leading-tight">{period.title}</h3>
                          <span className="text-[9px] text-slate-500 font-mono">{period.time}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 flex-grow mt-2 overflow-y-auto max-h-[160px] pr-0.5">
                        {slotMeds.length === 0 ? (
                          <div className="text-[10px] text-slate-600 text-center py-10 italic flex-grow flex items-center justify-center">
                            예정된 일과 없음
                          </div>
                        ) : (
                          slotMeds.map(med => {
                            const isTaken = med.taken[period.id];
                            return (
                              <div 
                                key={`${med.id}-${period.id}`}
                                className={`p-2 rounded-lg border transition-all flex flex-col gap-1 ${
                                  isTaken 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-slate-300 opacity-75' 
                                    : 'bg-white/5 border-white/5 hover:border-white/10 text-slate-200'
                                }`}
                              >
                                <div className="flex justify-between items-start gap-1">
                                  <div className="flex flex-col min-w-0">
                                    <span className={`text-[11px] font-semibold leading-tight truncate ${isTaken ? 'line-through text-slate-500' : ''}`}>
                                      {med.name}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-mono leading-none mt-0.5">
                                      {med.dosage}
                                    </span>
                                  </div>
                                  
                                  <button
                                    onClick={() => onTakeMedicine(med.id, period.id)}
                                    className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-all border shrink-0 ${
                                      isTaken 
                                        ? 'bg-emerald-500 border-emerald-600 text-white' 
                                        : 'bg-transparent border-slate-700 hover:border-slate-500 text-transparent hover:text-slate-400'
                                    }`}
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                </div>

                                {!isTaken && (
                                  <button
                                    onClick={() => onTriggerTestAlarm(med, period.id)}
                                    className="text-[8px] text-yellow-500/80 hover:text-yellow-400 flex items-center gap-0.5 mt-1 hover:underline bg-transparent border-none cursor-pointer self-start"
                                  >
                                    <Volume2 className="w-2.5 h-2.5" /> 🔔 알람 테스트
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // TAB 2: 복약 보관함 렌더링
  const renderStorageView = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in">
        {/* 좌측 컬럼: 의약품 재고 상태 리포트 */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-card flex-grow min-h-[400px]">
            <h2 className="text-lg font-semibold font-display tracking-wide mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-purple-400" /> 의약품 공급 및 재고 관리
            </h2>
            <div className="flex flex-col gap-3.5 max-h-[500px] overflow-y-auto pr-1">
              {medicines.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  등록된 약물이 없습니다.
                </div>
              ) : (
                medicines.map(med => {
                  const isLow = med.stock <= 5;
                  const ratio = Math.max(0, Math.min(100, (med.stock / med.totalStock) * 100));
                  return (
                    <div key={med.id} className="p-3 bg-white/5 rounded-lg border border-white/5 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColorHex(med.color), boxShadow: getColorGlow(med.color) }}></span>
                          <span className="font-semibold text-slate-200">{med.name}</span>
                        </div>
                        <span className={`font-mono text-xs font-bold ${isLow ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                          {med.stock} / {med.totalStock}정 남음
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${ratio}%`,
                            backgroundColor: isLow ? 'var(--accent-red)' : getColorHex(med.color)
                          }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center mt-1">
                        {isLow ? (
                          <span className="text-[10px] text-red-400 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> ⚠️ 즉시 충전 요망 (재고 부족)!
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            공급량 잔여 비중: {Math.round(ratio)}%
                          </span>
                        )}
                        <button
                          onClick={() => onRefillMedicine(med.id)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium hover:underline bg-transparent border-none cursor-pointer"
                        >
                          재고 채우기
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 우측 컬럼: 처방전 등록 폼 및 처방전 목록 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* 의약품 등록 폼 */}
          <div className="glass-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold font-display tracking-wide flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-cyan-400" /> 복약 프로토콜 추가
              </h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="glass-btn glass-btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1"
              >
                {showAddForm ? '접기' : '등록 창 열기'}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleSubmit} className="p-4 bg-white/5 rounded-xl border border-white/10 animate-slide-in flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">약물 명칭</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="예: 아스피린, 타이레놀, 아두카누맙"
                      className="glass-input text-xs"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">1회 복용량</label>
                    <input
                      type="text"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      placeholder="예: 100mg, 1정, 2캡슐"
                      className="glass-input text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">의학 분류군 / 카테고리</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="glass-input text-xs py-2 bg-slate-950"
                    >
                      <option value="일반 케어">일반 케어</option>
                      <option value="심혈관계">심혈관계</option>
                      <option value="통증 관리">통증 관리 (소염진통)</option>
                      <option value="항생제">항생제</option>
                      <option value="내분비계">내분비계 (당뇨/갑상선)</option>
                      <option value="비타민 및 영양제">비타민 및 건강보조제</option>
                      <option value="호흡기계">호흡기계</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">최초 처방 재고 (정/캡슐 수)</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="30"
                      min="1"
                      className="glass-input text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">인터페이스 테마 색상</label>
                    <div className="flex gap-2 mt-2">
                      {(['cyan', 'blue', 'purple', 'green', 'yellow'] as const).map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`w-5 h-5 rounded-full cursor-pointer transition-all border-2 ${color === c ? 'border-white scale-110' : 'border-transparent opacity-60'}`}
                          style={{ 
                            backgroundColor: getColorHex(c),
                            boxShadow: color === c ? getColorGlow(c) : 'none'
                          }}
                        ></button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">복용 주기 및 스케줄 시간대 (중복 선택 가능)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { key: 'morning', label: '아침 (08:00)', icon: Sunrise },
                      { key: 'afternoon', label: '점심 (13:00)', icon: Sun },
                      { key: 'evening', label: '저녁 (18:00)', icon: Sunset },
                      { key: 'night', label: '취침 전 (21:30)', icon: Moon }
                    ].map(slot => {
                      const Icon = slot.icon;
                      const active = selectedSlots.includes(slot.key as any);
                      return (
                        <button
                          key={slot.key}
                          type="button"
                          onClick={() => toggleFormSlot(slot.key as any)}
                          className={`p-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            active 
                              ? 'bg-cyan-500/10 border-cyan-400/50 text-cyan-300' 
                              : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">복용 주의 지침 및 특별 처방 규칙</label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="예: 아침 식후 30분 뒤 충분한 물과 함께 복용"
                    className="glass-input text-xs"
                  />
                </div>

                <div className="flex gap-2 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="glass-btn text-xs py-1 px-3 text-slate-400"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="glass-btn glass-btn-primary text-xs py-1 px-3"
                  >
                    프로토콜 등록
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 활성 프로토콜 처방 목록 */}
          <div className="glass-card flex-grow">
            <h2 className="text-lg font-semibold font-display tracking-wide mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" /> 활성 복약 처방전 프로토콜 ({medicines.length}개)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicines.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-500 text-sm">
                  활성화된 처방전이 없습니다. "AI 상담스캔" 탭에서 편리하게 처방전을 파싱해 보세요.
                </div>
              ) : (
                medicines.map(med => (
                  <div 
                    key={med.id} 
                    className="p-4 rounded-xl border bg-white/5 border-white/5 hover:bg-white/10 transition-all flex flex-col justify-between gap-3 relative group"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getColorHex(med.color), boxShadow: getColorGlow(med.color) }}></span>
                          <span className="text-[9px] bg-white/5 border border-white/5 text-slate-400 rounded-full px-2 py-0.5 uppercase tracking-wide font-mono">
                            {med.category}
                          </span>
                        </div>
                        <button
                          onClick={() => onDeleteMedicine(med.id)}
                          className="p-1 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 cursor-pointer border-none bg-transparent transition-all"
                          title="처방 해제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h3 className="text-base font-bold font-display text-slate-100 mt-2">{med.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">1회 복용량: <span className="text-slate-200 font-semibold">{med.dosage}</span></p>

                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {med.slots.map(s => {
                          let slotName = '';
                          if (s === 'morning') slotName = '아침';
                          else if (s === 'afternoon') slotName = '점심';
                          else if (s === 'evening') slotName = '저녁';
                          else if (s === 'night') slotName = '취침 전';
                          return (
                            <span key={s} className="text-[9px] bg-slate-800 border border-slate-700/50 text-slate-300 rounded px-1.5 py-0.5 font-mono">
                              {slotName}
                            </span>
                          );
                        })}
                      </div>

                      {med.instructions && (
                        <p className="text-xs text-slate-400 italic mt-3 bg-white/5 p-2 rounded-lg border border-white/5">
                          💡 지침: {med.instructions}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500">남은 잔여 재고량</span>
                        <span className={`text-xs font-mono font-bold ${med.stock <= 5 ? 'text-red-400' : 'text-slate-300'}`}>
                          {med.stock}회분 공급 가능
                        </span>
                      </div>

                      {med.sideEffects && med.sideEffects.length > 0 && (
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-yellow-500 font-medium">부작용</span>
                          <div className="flex gap-1 mt-0.5">
                            {med.sideEffects.slice(0, 2).map((se, idx) => (
                              <span key={idx} className="text-[8px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full px-1.5 py-0.2">
                                {se}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return view === 'dashboard' ? renderDashboardView() : renderStorageView();
}
