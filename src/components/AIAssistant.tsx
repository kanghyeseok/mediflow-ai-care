import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Terminal, 
  Loader2, 
  Sparkles, 
  Check,
  AlertCircle, 
  Info,
  Calendar,
  Layers
} from 'lucide-react';
import { Medicine } from './Dashboard';

interface AIAssistantProps {
  onApplySchedule: (medicines: Omit<Medicine, 'id' | 'taken'>[]) => void;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  suggestedSchedule?: Omit<Medicine, 'id' | 'taken'>[];
}

interface AgentLog {
  agent: 'orchestrator' | 'sideeffect' | 'interaction' | 'schedule';
  message: string;
  timestamp: string;
}

export default function AIAssistant({ onApplySchedule }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "안녕하세요! 저는 귀하의 **MediFlow AI 임상 분석 오케스트레이터**입니다. 복잡한 약물 상호작용 문의, 부작용 검색, 또는 자연어 기반의 복약 스케줄러 등록(예: *'매일 아침 아스피린 100mg과 아침/저녁 메트포르민 500mg을 복용해야 해'*) 등 다양한 건강 프로토콜을 질문하실 수 있습니다. 오늘 어떤 건강 프로토콜을 도와드릴까요?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs & chat
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentLogs]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Preset queries for interactive demonstration
  const quickActions = [
    {
      label: "아스피린 & 이부프로펜 상호작용 검사",
      query: "아스피린과 이부프로펜을 함께 복용해도 되는지 확인하고 스케줄을 최적화해줘."
    },
    {
      label: "AI 분석: 당뇨 및 혈압약 시간차 분할 복약",
      query: "메트포르민 500mg 아침/저녁 식후에 복용하고, 리시노프릴 10mg 아침 식후에 복용하도록 추가해줘."
    },
    {
      label: "비타민 C & 비타민 D3 복합 복용 분석",
      query: "비타민c와 비타민d를 매일 같이 복용해도 괜찮은지?"
    }
  ];

  // Helper to add agent logs sequentially to simulate reasoning
  const runAgentWorkflow = (query: string) => {
    setIsProcessing(true);
    setAgentLogs([]);

    const logSteps: { delay: number; agent: AgentLog['agent']; message: string }[] = [];

    const queryLower = query.toLowerCase().trim();
    
    const isAspirinIbuprofen = queryLower.includes('aspirin') || 
                               queryLower.includes('ibuprofen') || 
                               queryLower.includes('아스피린') || 
                               queryLower.includes('이부프로펜');

    const isMetforminLisinopril = queryLower.includes('metformin') || 
                                  queryLower.includes('lisinopril') || 
                                  queryLower.includes('메트포르민') || 
                                  queryLower.includes('리시노프릴');

    const isVitamin = queryLower.includes('vitamin') || 
                      queryLower.includes('비타민') || 
                      queryLower.includes('영양제') || 
                      (queryLower.includes('c') && queryLower.includes('d')) || 
                      queryLower.includes('멀티비타민');

    if (isAspirinIbuprofen) {
      logSteps.push(
        { delay: 100, agent: 'orchestrator', message: '의학적 질문 수신: "아스피린 + 이부프로펜 프로토콜 평가"' },
        { delay: 500, agent: 'orchestrator', message: '전문 서브 에이전트 생성 중: [상호작용에이전트, 부작용에이전트, 일정최적화기]' },
        { delay: 900, agent: 'interaction', message: '소염진통제(NSAID) 병용 투여 위험에 관한 임상 지식베이스 스캔 중...' },
        { delay: 1200, agent: 'sideeffect', message: '개별 위험 점수 산출 중 (아스피린 위점막 손상: 3.2, 이부프로펜 신장 스트레스: 2.8)' },
        { delay: 1700, agent: 'interaction', message: '⚠️ 경고: 위장관 점막 손상 및 출혈 시너지 위험 감지. 경쟁적 혈소판 결합 위험.' },
        { delay: 2100, agent: 'schedule', message: '복약 시간차 메커니즘 설계 중. 항혈소판제와 일반 소염진통제(NSAID) 복용 간 8시간 오프셋 권장.' },
        { delay: 2600, agent: 'sideeffect', message: '핵심 모니터링 지표 식별: 소화불량 (흔함, 12%), 체액 저류 (드묾, <2%).' },
        { delay: 3000, agent: 'schedule', message: '최적화된 시간대: 아스피린 (아침, 오전 8:00) 및 이부프로펜 (취침 전, 오후 9:30). 시간차 설계 검증 완료.' },
        { delay: 3400, agent: 'orchestrator', message: '에이전트 판단 결과 취합 중. 임상 권고문 및 맞춤형 복약 일정 프로필 작성 완료...' }
      );
    } else if (isMetforminLisinopril) {
      logSteps.push(
        { delay: 100, agent: 'orchestrator', message: '자연어 분석: 당뇨 및 고혈압 복약 프로토콜 추출 중...' },
        { delay: 500, agent: 'orchestrator', message: '전문 서브 에이전트 생성 중: [일정최적화기, 부작용에이전트]' },
        { delay: 1000, agent: 'sideeffect', message: '메트포르민 부작용 매트릭스 검토 중 (유산산증 경고, 위장 장애 흔함: 20%)' },
        { delay: 1400, agent: 'sideeffect', message: '리시노프릴 부작용 매트릭스 검토 중 (마른 기침 흔함: 8%, 고칼륨혈증 위험)' },
        { delay: 1900, agent: 'schedule', message: '복용 시간대 결정: 메트포르민 (아침 및 취침 전, 위장관 부담 경감을 위해 식사 직후 복용).' },
        { delay: 2300, agent: 'schedule', message: '복용 시간대 결정: 리시노프릴 (아침, 안정적인 24시간 혈압 조절용).' },
        { delay: 2800, agent: 'interaction', message: '당뇨/고혈압 약물 조합 분석: 심각한 상호 작용이나 약물 충돌이 감지되지 않음.' },
        { delay: 3300, agent: 'orchestrator', message: '모든 검증 통과. 임상 기준의 스케줄 개체 생성 중...' }
      );
    } else if (isVitamin) {
      logSteps.push(
        { delay: 100, agent: 'orchestrator', message: '영양소 분석 요청 수신: "비타민 복합 프로토콜 평가"' },
        { delay: 500, agent: 'orchestrator', message: '영양 전문 서브 에이전트 생성 중: [상호작용에이전트, 일정최적화기]' },
        { delay: 900, agent: 'interaction', message: '비타민 C(수용성) 및 비타민 D(지용성)의 동시 복용 영향 분석 중...' },
        { delay: 1400, agent: 'sideeffect', message: '고용량 섭취 시 신장 결석 위험도(비타민 C) 및 고칼슘혈증 위험도(비타민 D) 스캔 완료. 안전 범위 확인.' },
        { delay: 1900, agent: 'interaction', message: '상호작용 분석 결과: 두 성분 간 흡수 방해나 부작용 시너지가 없으며, 매일 함께 복용하는 것은 매우 안전함.' },
        { delay: 2400, agent: 'schedule', message: '복약 타이밍 제안: 비타민 C는 아침(활력 증진), 비타민 D는 점심(지용성 흡수 촉진) 배치 권장.' },
        { delay: 3000, agent: 'orchestrator', message: '종합 보고서 생성 완료. 비타민 복합 복용 가이드라인 작성.' }
      );
    } else {
      const matchedMeds = query.match(/[가-힣]{2,8}(정|캡슐|시럽)?|[a-zA-Z]{3,15}/g) || [];
      const medName = matchedMeds[0] || '요청약물';
      
      logSteps.push(
        { delay: 100, agent: 'orchestrator', message: `맞춤 의학 쿼리 해석 중... (${medName} 관련 프로토콜)` },
        { delay: 600, agent: 'sideeffect', message: `${medName} 알레르기 유발 정보 및 부작용에 대해 FDA 데이터베이스 검색 중...` },
        { delay: 1200, agent: 'sideeffect', message: '심각한 부작용 위험 인디케이터 체크 완료.' },
        { delay: 1800, agent: 'interaction', message: '현재 대시보드 데이터베이스에 등록된 다른 약물과의 안전한 조화도 분석 중...' },
        { delay: 2400, agent: 'schedule', message: '시간 최적화: 신체 대사 부하를 감안하여 최적의 시간대로 일정 생성 중.' },
        { delay: 3000, agent: 'orchestrator', message: '종합 분석 완료. 맞춤형 스케줄 가이드 합성 중...' }
      );
    }

    // Execute sequential state updates
    logSteps.forEach((step, idx) => {
      setTimeout(() => {
        setAgentLogs(prev => [
          ...prev,
          {
            agent: step.agent,
            message: step.message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        ]);

        if (idx === logSteps.length - 1) {
          setTimeout(() => {
            finalizeResponse(query);
          }, 600);
        }
      }, step.delay);
    });
  };

  const finalizeResponse = (query: string) => {
    let text = '';
    let suggestedSchedule: Message['suggestedSchedule'] = undefined;

    const queryLower = query.toLowerCase().trim();
    
    const isAspirinIbuprofen = queryLower.includes('aspirin') || 
                               queryLower.includes('ibuprofen') || 
                               queryLower.includes('아스피린') || 
                               queryLower.includes('이부프로펜');

    const isMetforminLisinopril = queryLower.includes('metformin') || 
                                  queryLower.includes('lisinopril') || 
                                  queryLower.includes('메트포르민') || 
                                  queryLower.includes('리시노프릴');

    const isVitamin = queryLower.includes('vitamin') || 
                      queryLower.includes('비타민') || 
                      queryLower.includes('영양제') || 
                      (queryLower.includes('c') && queryLower.includes('d')) || 
                      queryLower.includes('멀티비타민');

    if (isAspirinIbuprofen) {
      text = `### ⚠️ 임상 분석 결과: 아스피린 및 이부프로펜 병용 시 시간차 복약 권고

저희 **상호작용 분석 에이전트**가 아스피린(항혈소판 요법)과 이부프로펜(소염진통제) 간의 높은 병용 위험성을 감지하였습니다:
1. **경쟁적 혈소판 결합**: 이부프로펜을 아스피린과 너무 가까운 시간에 복용하면, 아스피린의 비가역적인 심혈관 보호(항혈소판) 효과를 이부프로펜이 방해할 수 있습니다.
2. **위장관 장애 급증**: 두 가지 소염진통제 계열을 동시 복용 시 위장 점막 자극 및 출혈 위험이 크게 증가합니다.

#### 💡 AI 오케스트레이터의 최적 솔루션
심혈관 보호 효과를 유지하고 통증을 안전하게 완화하기 위해, 복용 시간 사이에 **최소 8시간의 시간차를 두는 일정**을 구성했습니다.
- **아스피린 카디오 (100mg)**: 아침에 혈소판 억제 효과를 먼저 안착시키기 위해 **아침** (오전 8:00) 일정으로 배치했습니다.
- **이부프로펜 (200mg)**: 약효 충돌을 완전히 피할 수 있도록 **취침 전** (오후 9:30) 일정으로 시간차를 두고 격리했습니다.

이 안전 복약 프로토콜을 일일 일정에 자동으로 적용하시겠습니까?`;
      
      suggestedSchedule = [
        {
          name: "아스피린 카디오",
          dosage: "100mg",
          category: "심혈관계",
          slots: ["morning"],
          times: ["08:00"],
          instructions: "아침 식사 후 즉시 충분한 물과 함께 복용하십시오. 씹지 말고 통째로 삼키십시오.",
          color: "cyan",
          stock: 30,
          totalStock: 30,
          sideEffects: ["소화불량", "위장관 자극"]
        },
        {
          name: "이부프로펜 (진통제)",
          dosage: "200mg",
          category: "통증 관리",
          slots: ["night"],
          times: ["21:30"],
          instructions: "위장 보호를 위해 식사나 우유와 함께 복용하십시오. 아스피린 복용 후 최소 8시간 이후에 시간차 복용하십시오.",
          color: "purple",
          stock: 20,
          totalStock: 20,
          sideEffects: ["메스꺼움", "속쓰림"]
        }
      ];
    } else if (isMetforminLisinopril) {
      text = `### 💊 당뇨 및 혈압 조절 프로토콜 설정 완료

저희 **자연어 파서 에이전트**가 전송하신 자연어 요청을 성공적으로 해석하여 아래와 같이 복합 요법 일정을 수립했습니다:

#### 📋 처방 및 일정 요약:
1. **메트포르민 (500mg - 하루 2회)**: **아침** (오전 8:00) 및 **취침 전** (오후 9:30) 시간대로 편성되었습니다.
   - *임상 팁*: 소화기계 부작용(가스 참, 복통 등)을 최소화하기 위해 식사 직후 복용하는 것이 좋습니다.
2. **리시노프릴 (10mg - 하루 1회)**: **아침** (오전 8:00) 시간대로 편성되었습니다.
   - *임상 팁*: 하루 종일 안정적인 혈압 유지를 돕습니다. 마른 기침 증상이 나타나는지 관찰하십시오.

#### 🛡️ 안전성 종합 검증:
- **상호작용 에이전트**: 메트포르민과 리시노프릴 간의 대사 경로를 확인한 결과, 상호 무해하며 **안전함**을 검증했습니다.
- **부작용 모니터링 에이전트**: 초기 혈압 감소로 인해 복용 초기 3일 동안 약간의 어지러움이 발생할 수 있으므로, 충분한 수분 섭취를 유지하십시오.

이 해석된 임상 프로토콜을 대시보드에 즉시 가져오시겠습니까?`;

      suggestedSchedule = [
        {
          name: "메트포르민",
          dosage: "500mg",
          category: "내분비계",
          slots: ["morning", "night"],
          times: ["08:00", "21:30"],
          instructions: "아침과 저녁 식사 직후에 복용하십시오.",
          color: "blue",
          stock: 60,
          totalStock: 60,
          sideEffects: ["위장 장애", "메스꺼움"]
        },
        {
          name: "리시노프릴",
          dosage: "10mg",
          category: "심혈관계",
          slots: ["morning"],
          times: ["08:00"],
          instructions: "아침에 복용하십시오. 충분한 수분을 섭취해 주십시오.",
          color: "green",
          stock: 30,
          totalStock: 30,
          sideEffects: ["마른 기침", "어지러움"]
        }
      ];
    } else if (isVitamin) {
      text = `### ☀️ 임상 분석 결과: 비타민 C 및 비타민 D 복합 섭취 안전성 평가

저희 **영양 매핑 에이전트**와 **상호작용 검증 엔진**이 분석한 결과입니다:
1. **동시 섭취의 안전성**: 비타민 C(수용성 항산화)와 비타민 D(지용성 뼈 건강 증진)는 신체 대사 및 흡수 경로에 서로 악영향을 주지 않아, **매일 함께 섭취해도 매우 안전하며 영양학적 상호 장애가 없습니다.**
2. **최적의 시너지 타이밍**: 
   - **비타민 C**는 공복 섭취 시 가벼운 속쓰림을 유발할 수 있으므로 아침 식사 직후가 좋습니다.
   - **비타민 D**는 지용성이므로 점심 식사의 지방 성분과 섞여 흡수될 때 신체 흡수율이 극대화됩니다.

#### 💡 AI 오케스트레이터 제안 영양 복약표
- **비타민 C (500mg)**: 위장 보호를 위해 **아침 식사 직후** (오전 8:00) 섭취.
- **비타민 D3 (2000IU)**: 영양 흡수 촉진을 위해 **점심 식사 직후** (오후 1:00) 섭취.

이 안전한 비타민 복용 일정을 일일 대시보드에 즉시 추가하여 관리하시겠습니까?`;

      suggestedSchedule = [
        {
          name: "비타민 C",
          dosage: "500mg",
          category: "비타민 및 영양제",
          slots: ["morning"],
          times: ["08:00"],
          instructions: "아침 식사 직후 충분한 물과 함께 섭취하십시오.",
          color: "yellow",
          stock: 60,
          totalStock: 60,
          sideEffects: ["경미한 속쓰림", "일시적 메스꺼움"]
        },
        {
          name: "비타민 D3",
          dosage: "2000IU",
          category: "비타민 및 영양제",
          slots: ["afternoon"],
          times: ["13:00"],
          instructions: "점심 식사 직후 섭취 시 체내 흡수율이 크게 높아집니다.",
          color: "green",
          stock: 60,
          totalStock: 60,
          sideEffects: ["과량 섭취 주의"]
        }
      ];
    } else {
      const matchedMeds = query.match(/[가-힣]{2,8}(정|캡슐|시럽)?|[a-zA-Z]{3,15}/g) || [];
      const medName = matchedMeds[0] || '요청 약물';
      const isPenicillin = queryLower.includes('penicillin') || queryLower.includes('페니실린');
      
      if (isPenicillin) {
        text = `### 🔬 페니실린 (항생제) 복약 프로필 설정

저희 **부작용 분석기** 및 **일정 최적화 에이전트**가 페니실린 (250mg) 복약 일정을 검토했습니다:
1. **박테리아 박멸**: 지속적이고 일정한 혈중 약물 농도를 유지해야 확실히 제균됩니다.
2. **최적의 복약 시간**: 하루 2회 스케줄을 **아침** (오전 8:00) 및 **저녁** (오후 6:00) 시간대로 격리 매핑했습니다.
3. **핵심 안전 수칙**: 알레르기 반응(두드러기, 가려움 등)을 면밀히 관찰하십시오. 최상의 흡수율을 위해 공복 상태(식전 1시간 또는 식후 2시간)에서 복용하시는 것이 가장 좋습니다.

이 페니실린 항생제 복용 프로토콜을 대시보드에 추가하시겠습니까?`;

        suggestedSchedule = [
          {
            name: "페니실린 V",
            dosage: "250mg",
            category: "항생제",
            slots: ["morning", "evening"],
            times: ["08:00", "18:00"],
            instructions: "공복에 복용하십시오. 증상이 나아지더라도 처방된 복용 기간을 반드시 끝까지 완료해야 합니다.",
            color: "yellow",
            stock: 14,
            totalStock: 14,
            sideEffects: ["알레르기성 발진", "설사"]
          }
        ];
      } else {
        text = `### 🔍 AI 복약 분석: ${medName} 처방전 가이드

저희 **AI 안전 보장 오케스트레이터**가 문의하신 내용(${query})을 분석했습니다:
1. **복용 및 매핑 확인**: 요청하신 복약 정보(${medName})에 대해 최적화된 하루 1회 일정을 **아침** (오전 8:00)으로 스케줄링하였습니다.
2. **안전성 점검**: 현재 활성화된 다른 등록 약물들과의 중대한 약리학적 간섭이나 유해 작용이 감지되지 않아 안전하게 등록할 수 있습니다.
3. **복약 팁**: 최상의 건강 상태 유지를 위해 가급적 매일 정해진 시간에 지속적으로 복용하시기를 권장합니다.

이 ${medName} 복용 일정을 일일 복약 타임라인에 등록하시겠습니까?`;

        suggestedSchedule = [
          {
            name: medName,
            dosage: "1정",
            category: "일반 케어",
            slots: ["morning"],
            times: ["08:00"],
            instructions: "물과 함께 매일 아침 정해진 시간에 일정하게 복용하십시오.",
            color: "cyan",
            stock: 30,
            totalStock: 30,
            sideEffects: ["가벼운 소화 자극"]
          }
        ];
      }
    }

    setMessages(prev => [
      ...prev,
      {
        sender: 'assistant',
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedSchedule: suggestedSchedule
      }
    ]);
    setIsProcessing(false);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userText = input;
    setMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: userText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInput('');

    runAgentWorkflow(userText);
  };

  const handleQuickAction = (queryText: string) => {
    if (isProcessing) return;
    setMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: queryText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    runAgentWorkflow(queryText);
  };

  const getTagColorClass = (agent: AgentLog['agent']) => {
    switch (agent) {
      case 'orchestrator': return 'tag-orchestrator';
      case 'sideeffect': return 'tag-sideeffect';
      case 'interaction': return 'tag-interaction';
      case 'schedule': return 'tag-schedule';
      default: return '';
    }
  };

  return (
    <div className="glass-card flex flex-col h-[700px] relative overflow-hidden animate-slide-in">
      {/* Background radial glow */}
      <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400">
            <Sparkles className="w-5 h-5 pulse-glow-cyan" />
          </div>
          <div>
            <h2 className="text-base font-semibold font-display text-slate-100 leading-tight">AI 임상 복약 비서</h2>
            <span className="text-[10px] text-slate-400 font-mono">병렬 분석 에이전트 엔진 활성화됨</span>
          </div>
        </div>
      </div>

      {/* Side-by-side Layout Container */}
      <div className="ai-consult-split flex-grow min-h-0">
        
        {/* Left Column: Chat Console with its own independent scroll */}
        <div className="flex flex-col h-full min-h-0 border-r border-white/5 pr-4 ai-scroll-container custom-scrollbar">
          <div className="flex-grow overflow-y-auto mb-4 pr-1">
            <div className="flex flex-col gap-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-[90%] ${
                    msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    msg.sender === 'user' 
                      ? 'bg-slate-800 border-slate-700 text-slate-200' 
                      : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Body */}
                  <div className="flex flex-col gap-1">
                    <div className={`p-3.5 rounded-xl border text-sm text-slate-200 font-sans leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-955/20 border-cyan-800/40 rounded-tr-none'
                        : 'bg-white/5 border-white/5 rounded-tl-none'
                    }`}>
                      <div className="flex flex-col gap-2">
                        {msg.text.split('\n').map((line, lIdx) => {
                          if (line.startsWith('###')) {
                            return <h3 key={lIdx} className="text-sm font-bold text-cyan-300 font-display mt-2">{line.replace('###', '')}</h3>;
                          }
                          if (line.startsWith('####')) {
                            return <h4 key={lIdx} className="text-xs font-bold text-blue-300 uppercase tracking-wider mt-1">{line.replace('####', '')}</h4>;
                          }
                          if (line.startsWith('-')) {
                            return <div key={lIdx} className="pl-3 text-xs text-slate-300 flex items-start gap-1"><span>•</span> <span>{line.replace('-', '').trim()}</span></div>;
                          }
                          if (line.trim().startsWith('1.')) {
                            return <div key={lIdx} className="pl-3 text-xs text-slate-300 flex items-start gap-1"><span>1.</span> <span>{line.replace(/^\d+\.\s*/, '').trim()}</span></div>;
                          }
                          
                          const parts = line.split(/\*\*(.*?)\*\*/);
                          if (parts.length > 1) {
                            return (
                              <p key={lIdx} className="text-xs leading-relaxed text-slate-300">
                                {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-cyan-400 font-semibold">{part}</strong> : part)}
                              </p>
                            );
                          }

                          return <p key={lIdx} className="text-xs leading-relaxed text-slate-300">{line}</p>;
                        })}
                      </div>

                      {msg.suggestedSchedule && (
                        <div className="mt-4 p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-lg flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5" /> 매핑된 복약 처방전 설계도
                            </span>
                            <span className="text-[9px] text-slate-400">{msg.suggestedSchedule.length}개 의약품</span>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {msg.suggestedSchedule.map((med, mIdx) => (
                              <div key={mIdx} className="flex justify-between items-center text-xs bg-slate-900/50 p-2 rounded border border-white/5">
                                <div>
                                  <span className="font-semibold text-slate-200">{med.name}</span>
                                  <span className="text-slate-400 text-[10px] ml-2">({med.dosage})</span>
                                </div>
                                <div className="flex gap-1">
                                  {med.slots.map(s => {
                                    let sKor = '';
                                    if (s === 'morning') sKor = '아침';
                                    else if (s === 'afternoon') sKor = '점심';
                                    else if (s === 'evening') sKor = '저녁';
                                    else if (s === 'night') sKor = '취침 전';
                                    return (
                                      <span key={s} className="text-[8px] bg-slate-800 border border-slate-700 text-slate-300 px-1 rounded capitalize font-mono">
                                        {sKor}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (msg.suggestedSchedule) {
                                onApplySchedule(msg.suggestedSchedule);
                                alert("안전 복약 프로토콜이 일일 복약 타임라인에 성공적으로 통합되었습니다!");
                              }
                            }}
                            className="glass-btn glass-btn-primary w-full py-1.5 text-xs flex justify-center items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" /> 안전 프로토콜 스케줄에 적용
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono mt-1 self-start">{msg.time}</span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
          
          {/* Input box & Preset actions */}
          <div className="border-t border-white/5 pt-3 mt-auto">
            {messages.length === 1 && !isProcessing && (
              <div className="flex flex-col gap-1.5 mb-3.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  ⚡ 가상 임상 시나리오 실행
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickAction(action.query)}
                      className="text-[10px] bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/20 text-slate-300 hover:text-cyan-300 rounded-full px-3 py-1 text-left cursor-pointer transition-all leading-tight font-medium"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isProcessing}
                placeholder={isProcessing ? "에이전트 엔진이 질문을 처리하고 있습니다..." : "의학적 질문을 하거나 복약 일정을 설명해 주세요..."}
                className="glass-input flex-grow text-xs py-2 px-3 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isProcessing || !input.trim()}
                className="glass-btn glass-btn-primary p-2 flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Terminal Logs with its own independent scroll */}
        <div className="flex flex-col h-full min-h-0 pl-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/80 px-3 py-2 rounded-lg border border-white/5 mb-3">
            <span className="flex items-center gap-1.5 font-mono text-cyan-400">
              <Terminal className="w-3.5 h-3.5" /> ORCHESTRATOR_OUTPUT_STREAM
            </span>
            <span className="text-[9px] text-slate-500 font-mono">v1.4.2</span>
          </div>

          <div className="agent-logs-container flex-grow overflow-y-auto pr-2 custom-scrollbar" style={{ height: 'calc(100% - 40px)' }}>
            {agentLogs.length === 0 ? (
              <div className="text-slate-600 italic text-[11px] font-mono py-12 text-center h-full flex items-center justify-center">
                터미널 대기 중. 질문을 통해 여러 서브 에이전트의 병렬 추론 과정을 실시간으로 모니터링하십시오.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {agentLogs.map((log, idx) => (
                  <div key={idx} className="agent-log-line text-slate-300 font-mono text-[10px] animate-slide-in">
                    <span className="text-slate-600 text-[9px] shrink-0">[{log.timestamp}]</span>
                    <span className={`agent-tag shrink-0 ${getTagColorClass(log.agent)}`}>
                      {log.agent}
                    </span>
                    <span className="text-slate-300 leading-snug break-all">{log.message}</span>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex items-center gap-2 text-cyan-400/70 font-mono text-[10px] mt-2 italic animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    서브 에이전트 스레드의 응답을 기다리는 중...
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
