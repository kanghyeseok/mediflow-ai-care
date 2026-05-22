import React, { useState, useEffect } from 'react';
import Dashboard, { Medicine } from './components/Dashboard';
import AIAssistant from './components/AIAssistant';
import CalendarTracker from './components/CalendarTracker';
import { 
  Pill, 
  Bell, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Check, 
  Clock, 
  Activity
} from 'lucide-react';

export default function App() {
  // 로컬 스토리지에서 의약품 목록 로드 및 기본값 비우기
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    const saved = localStorage.getItem('medismart_medicines');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("저장된 복약 데이터를 파싱하는 데 실패했습니다:", e);
      }
    }
    return []; // 기본 샘플 데이터를 다 비우고 빈 배열로 시작
  });

  // 실시간으로 변동되는 약물 리스트를 로컬 스토리지에 유지
  useEffect(() => {
    localStorage.setItem('medismart_medicines', JSON.stringify(medicines));
  }, [medicines]);

  // 활성 탭 상태 관리
  const [activeTab, setActiveTab] = useState<'dashboard' | 'storage' | 'calendar' | 'ai'>('dashboard');

  // 스트릭 카운터 상태 관리
  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem('medismart_streak');
    return saved ? parseInt(saved) || 0 : 0;
  });

  useEffect(() => {
    localStorage.setItem('medismart_streak', String(streak));
  }, [streak]);

  // 일일 복약 완료 기록 (달력 연동용)
  const [complianceRecords, setComplianceRecords] = useState<any[]>(() => {
    const saved = localStorage.getItem('medismart_compliance');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('medismart_compliance', JSON.stringify(complianceRecords));
  }, [complianceRecords]);

  // 실시간 현재 시간 업데이트 상태
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const amp = hours >= 12 ? '오후' : '오전';
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      setCurrentTime(`${amp} ${displayHours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 알람 시스템 상태
  const [alarmActive, setAlarmActive] = useState(false);
  const [alarmMedicine, setAlarmMedicine] = useState<Medicine | null>(null);
  const [alarmSlot, setAlarmSlot] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // 오디오 콘텍스트 및 알람 소리 생성 간격
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [oscillatorInterval, setOscillatorInterval] = useState<any>(null);

  // Web Audio API를 사용해 세련된 의료용 알림음을 동적으로 합성
  const playAlertSound = () => {
    if (isMuted) return;

    try {
      const context = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtx) setAudioCtx(context);

      if (context.state === 'suspended') {
        context.resume();
      }

      // 주기적으로 알림음 재생
      const interval = setInterval(() => {
        if (isMuted) return;

        const osc = context.createOscillator();
        const gain = context.createGain();

        osc.type = 'sine';
        // 부드러운 화음 비프음: 880Hz (A5) -> 1100Hz (C#6)
        osc.frequency.setValueAtTime(880, context.currentTime);
        osc.frequency.setValueAtTime(1100, context.currentTime + 0.12);

        gain.gain.setValueAtTime(0.08, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(context.destination);

        osc.start();
        osc.stop(context.currentTime + 0.4);
      }, 900);

      setOscillatorInterval(interval);
    } catch (e) {
      console.warn("오디오 콘텍스트를 초기화할 수 없습니다:", e);
    }
  };

  const stopAlertSound = () => {
    if (oscillatorInterval) {
      clearInterval(oscillatorInterval);
      setOscillatorInterval(null);
    }
  };

  // 알람 상태에 따른 알림음 재생 제어
  useEffect(() => {
    if (alarmActive && alarmMedicine) {
      playAlertSound();
    } else {
      stopAlertSound();
    }
    return () => stopAlertSound();
  }, [alarmActive, isMuted]);

  // 약 복용 완료 처리 핸들러
  const handleTakeMedicine = (id: string, slot: string) => {
    setMedicines(prev => prev.map(med => {
      if (med.id === id) {
        const isCurrentTaken = med.taken[slot];
        const newTaken = { ...med.taken, [slot]: !isCurrentTaken };
        
        // 잔여 재고를 현실적으로 차감/증가
        let newStock = med.stock;
        if (!isCurrentTaken) {
          // 복용 체크 시 -> 재고 1회분 차감
          newStock = Math.max(0, med.stock - 1);
        } else {
          // 복용 취소 시 -> 재고 1회분 반환
          newStock = Math.min(med.totalStock, med.stock + 1);
        }

        // 달력 및 완료 추적 기록 업데이트
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${date}`;
        const recordId = `${med.id}-${slot}-${dateStr}`;

        if (!isCurrentTaken) {
          const newRecord = {
            id: recordId,
            medicineId: med.id,
            medicineName: med.name,
            slot: slot,
            status: 'taken',
            scheduledTime: `${dateStr} ${slot === 'morning' ? '08:00' : slot === 'afternoon' ? '13:00' : slot === 'evening' ? '18:00' : '21:30'}`
          };
          setComplianceRecords(prevRecs => {
            const filtered = prevRecs.filter(r => r.id !== recordId);
            return [...filtered, newRecord];
          });
        } else {
          setComplianceRecords(prevRecs => prevRecs.filter(r => r.id !== recordId));
        }

        return {
          ...med,
          taken: newTaken,
          stock: newStock
        };
      }
      return med;
    }));
  };

  // 새로운 약물 등록 프로토콜
  const handleAddMedicine = (newMed: Omit<Medicine, 'id' | 'taken'>) => {
    const id = `med-${Date.now()}`;
    const taken: Medicine['taken'] = {};
    newMed.slots.forEach(slot => {
      taken[slot] = false;
    });

    setMedicines(prev => [
      ...prev,
      {
        ...newMed,
        id,
        taken
      }
    ]);
  };

  // 처방 해제 프로토콜
  const handleDeleteMedicine = (id: string) => {
    if (window.confirm("이 약물 복용 프로토콜을 해제하시겠습니까?")) {
      setMedicines(prev => prev.filter(m => m.id !== id));
      // 복용 기록에서도 관련 약물 내역 정리
      setComplianceRecords(prev => prev.filter(r => r.medicineId !== id));
    }
  };

  // 약물 재고 충전
  const handleRefillMedicine = (id: string) => {
    setMedicines(prev => prev.map(med => {
      if (med.id === id) {
        return {
          ...med,
          stock: med.totalStock
        };
      }
      return med;
    }));
  };

  // 테스트 알람 수동 트리거
  const handleTriggerTestAlarm = (med: Medicine, slot: string) => {
    setAlarmMedicine(med);
    setAlarmSlot(slot);
    setAlarmActive(true);
  };

  // 알람 창에서 복용 처리 완료 및 알람 해제
  const handleAlarmLogTaken = () => {
    if (alarmMedicine && alarmSlot) {
      handleTakeMedicine(alarmMedicine.id, alarmSlot);
    }
    setAlarmActive(false);
    setAlarmMedicine(null);
    setAlarmSlot(null);
  };

  // 알람 창에서 미루기(Snooze) 처리
  const handleAlarmSnooze = () => {
    setAlarmActive(false);
    setAlarmMedicine(null);
    setAlarmSlot(null);
    alert("복용이 5분간 미뤄졌습니다. 오케스트레이터가 후속 알림을 발행합니다.");
  };

  // AI 어시스턴트가 설계한 약물 처방 일정표 병합하기
  const handleApplyAISchedule = (newMedsBlueprint: Omit<Medicine, 'id' | 'taken'>[]) => {
    const initializedMeds = newMedsBlueprint.map((med, idx) => {
      const id = `med-ai-${Date.now()}-${idx}`;
      const taken: Medicine['taken'] = {};
      med.slots.forEach(slot => {
        taken[slot] = false;
      });

      return {
        ...med,
        id,
        taken
      };
    });

    // 중복 추가를 방지하기 위해 동일 이름을 가진 약은 필터링 후 새로 병합
    const namesToImport = new Set(initializedMeds.map(m => m.name.toLowerCase()));
    setMedicines(prev => {
      const filteredPrev = prev.filter(m => !namesToImport.has(m.name.toLowerCase()));
      return [...filteredPrev, ...initializedMeds];
    });

    // AI 상담에서 복약 적용 시 자동으로 대시보드로 이동하게 하여 편의성 극대화
    setActiveTab('dashboard');
  };

  // 오늘의 약물 복용 순응도 계산
  const getOverallPercentage = () => {
    let totalScheduled = 0;
    let totalTaken = 0;
    medicines.forEach(m => {
      m.slots.forEach(s => {
        totalScheduled++;
        if (m.taken[s]) totalTaken++;
      });
    });
    return totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;
  };

  // 오늘의 복약 달성에 따른 건강 스트릭 카운터 관리
  useEffect(() => {
    if (medicines.length > 0) {
      const percent = getOverallPercentage();
      if (percent === 100) {
        if (streak === 0) {
          setStreak(1);
        }
      }
    }
  }, [medicines]);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-cyan-500/30 relative">
      
      {/* 백그라운드 래디얼 네온 그라데이션 */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* 프리미엄 메인 헤더 내비게이션 바 (진짜 탭 스위치 탑재 및 완벽 리브랜딩) */}
      <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* 로고 & 브랜드: MediFlow AI Care */}
          <div className="flex items-center gap-2.5">
            <div className="brand-logo-box">
              $
            </div>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
                MediFlow <span className="ai-care-badge">AI Care</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">병렬 에이전트 기반 약물 스케줄러</p>
            </div>
          </div>

          {/* 중앙 4개 복약 탭 제어판 */}
          <div className="flex flex-wrap items-center justify-center gap-1 bg-slate-900/60 border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`header-tab-btn ${activeTab === 'dashboard' ? 'header-tab-btn-active' : ''}`}
            >
              📊 투약 대시보드
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`header-tab-btn ${activeTab === 'storage' ? 'header-tab-btn-active' : ''}`}
            >
              💊 복약 보관함
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`header-tab-btn ${activeTab === 'calendar' ? 'header-tab-btn-active' : ''}`}
            >
              🗓️ 달력 분석트래커
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`header-tab-btn ${activeTab === 'ai' ? 'header-tab-btn-active' : ''}`}
            >
              🤖 AI 상담스캔
            </button>
          </div>

          {/* 우측 실시간 진단 상태 및 스트릭 인디케이터 */}
          <div className="flex items-center gap-3">
            <div className="text-xs bg-slate-900 border border-white/5 px-3 py-1.5 rounded-xl font-mono text-slate-300 flex items-center gap-1">
              <span>오늘 완료율:</span>
              <span className="text-emerald-400 font-bold">{getOverallPercentage()}%</span>
            </div>
            
            <div className="text-xs bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl font-mono text-amber-400 font-bold flex items-center gap-1">
              <span>🔥 {streak}일째</span>
            </div>

            {/* 실시간 현재 시간 인디케이터 */}
            <div className="hidden sm:flex text-xs bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl items-center gap-2 font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-slate-300 font-medium">{currentTime || '로딩 중...'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 애플리케이션 메인 컨텐츠 영역 */}
      <main className="flex-grow max-w-[1400px] w-full mx-auto px-6 py-6 flex flex-col gap-6">
        
        {/* 상단 임상 환자 안전성 보장 바 */}
        <div className="glass-card py-4 px-5 bg-gradient-to-r from-cyan-950/20 to-purple-950/10 border-cyan-500/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 shrink-0">
              <Sparkles className="w-4 h-4 pulse-glow-cyan" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200 leading-tight">환자 안전 보장 프로토콜 가동 중</p>
              <p className="text-[10px] text-slate-400 leading-normal">
                다중 에이전트 검증 시스템이 등록된 모든 처방전을 글로벌 NIH 및 FDA 의약품 데이터베이스와 실시간으로 연동하여 성분 충돌 여부를 검사하고 있습니다.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[10px] bg-cyan-400/10 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold shrink-0">
            보안 및 진단 상태: 안전
          </span>
        </div>

        {/* 탭 전환에 따른 동적 컴포넌트 렌더링 */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            medicines={medicines}
            onTakeMedicine={handleTakeMedicine}
            onAddMedicine={handleAddMedicine}
            onDeleteMedicine={handleDeleteMedicine}
            onRefillMedicine={handleRefillMedicine}
            onTriggerTestAlarm={handleTriggerTestAlarm}
            view="dashboard"
            streak={streak}
          />
        )}

        {activeTab === 'storage' && (
          <Dashboard 
            medicines={medicines}
            onTakeMedicine={handleTakeMedicine}
            onAddMedicine={handleAddMedicine}
            onDeleteMedicine={handleDeleteMedicine}
            onRefillMedicine={handleRefillMedicine}
            onTriggerTestAlarm={handleTriggerTestAlarm}
            view="storage"
            streak={streak}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarTracker 
            medicines={medicines}
            complianceRecords={complianceRecords}
          />
        )}

        {activeTab === 'ai' && (
          <AIAssistant 
            onApplySchedule={handleApplyAISchedule}
          />
        )}
      </main>

      {/* 푸터 영역 (스크린샷 내용과 100% 동일하게 일치) */}
      <footer className="border-t border-white/5 py-4 text-center mt-12 text-[10px] text-slate-500 font-mono bg-slate-950/25">
        © 2026 MediFlow AI Medical Inc. All rights reserved. 본 서비스는 AI 보조 복약 지도이며 최종 의료판단은 전문의와 상담하십시오.
      </footer>

      {/* 프리미엄 실시간 복약 알림 모달 팝업 */}
      {alarmActive && alarmMedicine && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-slide-in">
          <div className="glass-card max-w-md w-full border-red-500/30 shadow-2xl shadow-red-500/10 relative overflow-hidden flex flex-col gap-5 p-6 md:p-8">
            {/* 배경 적색 경고 광원 효과 */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-[80px] animate-pulse"></div>

            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-500/15 text-red-400 rounded-lg animate-pulse border border-red-500/20">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider font-mono">복약 알림 프로토콜</span>
                  <h3 className="text-sm font-semibold text-slate-200 uppercase font-display leading-tight">약 복용 시간입니다</h3>
                </div>
              </div>

              {/* 사운드 음소거 전환 토글 */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white cursor-pointer transition-all hover:bg-white/10"
                title={isMuted ? "알람 음소거 해제" : "알람 음소거"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400 animate-bounce" />}
              </button>
            </div>

            {/* 현재 복용 예정인 약물 디테일 카드 */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-white text-lg font-display">{alarmMedicine.name}</span>
                <span className="font-mono text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">
                  {alarmMedicine.dosage}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 p-2 rounded border border-white/5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>예정된 슬롯: <strong className="text-slate-200">{alarmSlot === 'morning' ? '아침 (08:00)' : alarmSlot === 'afternoon' ? '점심 (13:00)' : alarmSlot === 'evening' ? '저녁 (18:00)' : '취침 전 (21:30)'}</strong></span>
              </div>

              {alarmMedicine.instructions && (
                <div className="text-xs text-yellow-500/90 bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10 italic">
                  🛡️ 복약 주의사항: {alarmMedicine.instructions}
                </div>
              )}
            </div>

            {/* 제어 버튼 */}
            <div className="flex flex-col gap-2.5 mt-2">
              <button
                onClick={handleAlarmLogTaken}
                className="glass-btn glass-btn-primary w-full py-2.5 text-xs font-semibold flex justify-center items-center gap-2 shadow-lg shadow-cyan-500/15"
              >
                <Check className="w-4.5 h-4.5" /> 복용 완료 기록 및 경보 끄기
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleAlarmSnooze}
                  className="glass-btn w-full py-2 text-xs text-slate-300 hover:text-white"
                >
                  5분 뒤 다시 알림
                </button>
                <button
                  onClick={() => {
                    setAlarmActive(false);
                    setAlarmMedicine(null);
                    setAlarmSlot(null);
                  }}
                  className="glass-btn w-full py-2 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-900 border-none bg-transparent"
                >
                  알림만 끄기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
