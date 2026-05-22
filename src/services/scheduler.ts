/**
 * MediSmart Scheduler Service.
 * Implements:
 * 1. IndexedDB / LocalStorage medication schedules and compliance history storage.
 * 2. Background compliance tracking (auto-logging missed doses).
 * 3. Dynamic synthesis of premium chime sounds via Web Audio API.
 * 4. HTML5 Web Notifications integration.
 */

export interface MedicationSchedule {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  timings: string[];
  durationDays?: number;
  timesPerDay: number;
  hourMap: number[];
  startDate: string; // YYYY-MM-DD
  isActive: boolean;
  createdAt: string; // ISO string
  rawText?: string;
}

export interface ComplianceRecord {
  id: string;
  scheduleId: string;
  drugName: string;
  dosage: string;
  scheduledTime: string; // YYYY-MM-DDTHH:00
  status: 'taken' | 'skipped' | 'missed';
  loggedTime?: string; // ISO string
}

// Local Storage Keys
const KEYS = {
  SCHEDULES: 'medismart_schedules',
  COMPLIANCE: 'medismart_compliance',
  NOTIFIED: 'medismart_notified_events',
  CHIME_PREFERENCE: 'medismart_chime_pref'
};

/**
 * Web Audio API Synth: Synthesizes professional-grade chime alarms without external audio files.
 */
export function playChime(style: 'zen' | 'energetic' | 'gentle_bell' | 'digital_chime' = 'zen'): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('[playChime] Web Audio API is not supported in this browser.');
      return;
    }

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (style === 'zen') {
      // Deep metallic singing bowl / zen chime
      const fundamental = 196.00; // G3
      const overtones = [1.0, 1.5, 2.7, 3.8, 4.4];
      const volumes = [0.45, 0.22, 0.15, 0.08, 0.04];
      const masterGain = ctx.createGain();
      
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.5, now + 0.1); // soft swell
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 3.8); // slow decay
      masterGain.connect(ctx.destination);

      overtones.forEach((ratio, index) => {
        const osc = ctx.createOscillator();
        const overtoneGain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamental * ratio, now);
        
        // Add subtle pitch variance for organic, rich texture
        osc.frequency.linearRampToValueAtTime(fundamental * ratio * 0.997, now + 3.0);

        overtoneGain.gain.setValueAtTime(volumes[index], now);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + (3.8 - index * 0.5));

        osc.connect(overtoneGain);
        overtoneGain.connect(masterGain);
        
        osc.start(now);
        osc.stop(now + 4.2);
      });

    } else if (style === 'gentle_bell') {
      // Wind-chime crystal bell sound
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.4, now + 0.005); // immediate click attack
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2); // long ringing decay
      masterGain.connect(ctx.destination);

      // Primary crystal high pitch
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.50, now); // C6
      osc1.connect(masterGain);

      // Harmonious minor third overtone (E-flat)
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1244.51, now); // D#6/Eb6
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.18, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      
      osc2.connect(gain2);
      gain2.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.5);
      osc2.stop(now + 2.5);

    } else if (style === 'energetic') {
      // Bright ascending triad arpeggio (C5 -> E5 -> G5)
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      const noteDuration = 0.14;
      const noteGap = 0.11;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const noteTime = now + (idx * noteGap);

        osc.type = 'triangle'; // pleasant, warm triangle wave
        osc.frequency.setValueAtTime(freq, noteTime);

        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.35, noteTime + 0.015);
        noteGain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDuration);

        osc.connect(noteGain);
        noteGain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + noteDuration + 0.1);
      });

    } else if (style === 'digital_chime') {
      // Rapid double pulse (classic high-tech notification)
      const frequencies = [987.77, 1975.53]; // B5, B6
      
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const noteTime = now + (idx * 0.07);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(450, noteTime);

        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.38, noteTime + 0.003);
        noteGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.12);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.2);
      });
    }
  } catch (err) {
    console.error('[playChime] Failed to play synthesized chime:', err);
  }
}

/**
 * Web Notifications Helper: Requests permissions and displays rich system alerts.
 */
export const NotificationService = {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Web Notifications are not supported in this browser.');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  showNotification(title: string, options?: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💊</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💊</text></svg>',
        ...options
      });
    } else {
      console.log(`[Notification Fallback] ${title} - ${options?.body || ''}`);
    }
  }
};

/**
 * SchedulerService: Manages schedules, compliance database, and timers.
 */
export const SchedulerService = {
  // --- Schedules Management ---
  
  getSchedules(): MedicationSchedule[] {
    const data = localStorage.getItem(KEYS.SCHEDULES);
    return data ? JSON.parse(data) : [];
  },

  saveSchedule(schedule: Omit<MedicationSchedule, 'id' | 'createdAt' | 'isActive'>): MedicationSchedule {
    const schedules = this.getSchedules();
    const newSchedule: MedicationSchedule = {
      ...schedule,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      isActive: true,
      createdAt: new Date().toISOString()
    };

    schedules.push(newSchedule);
    localStorage.setItem(KEYS.SCHEDULES, JSON.stringify(schedules));
    return newSchedule;
  },

  toggleSchedule(id: string): void {
    const schedules = this.getSchedules();
    const index = schedules.findIndex(s => s.id === id);
    if (index !== -1) {
      schedules[index].isActive = !schedules[index].isActive;
      localStorage.setItem(KEYS.SCHEDULES, JSON.stringify(schedules));
    }
  },

  deleteSchedule(id: string): void {
    const schedules = this.getSchedules();
    const updated = schedules.filter(s => s.id !== id);
    localStorage.setItem(KEYS.SCHEDULES, JSON.stringify(updated));

    // Also cascade delete compliance records and notifications to clean storage
    const records = this.getComplianceRecords();
    const updatedRecords = records.filter(r => r.scheduleId !== id);
    localStorage.setItem(KEYS.COMPLIANCE, JSON.stringify(updatedRecords));
  },

  // --- Compliance Tracking ---

  getComplianceRecords(): ComplianceRecord[] {
    const data = localStorage.getItem(KEYS.COMPLIANCE);
    return data ? JSON.parse(data) : [];
  },

  logCompliance(scheduleId: string, status: 'taken' | 'skipped' | 'missed', scheduledTime: string): void {
    const schedules = this.getSchedules();
    const targetSchedule = schedules.find(s => s.id === scheduleId);
    if (!targetSchedule) return;

    const records = this.getComplianceRecords();
    
    // Check if record already exists for this exact schedule and time
    const existingIndex = records.findIndex(r => r.scheduleId === scheduleId && r.scheduledTime === scheduledTime);

    const record: ComplianceRecord = {
      id: existingIndex !== -1 ? records[existingIndex].id : (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)),
      scheduleId,
      drugName: targetSchedule.drugName,
      dosage: targetSchedule.dosage,
      scheduledTime,
      status,
      loggedTime: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }

    localStorage.setItem(KEYS.COMPLIANCE, JSON.stringify(records));
  },

  getComplianceRate(scheduleId?: string): number {
    const records = this.getComplianceRecords();
    const filtered = scheduleId ? records.filter(r => r.scheduleId === scheduleId) : records;
    
    // Skipped doses are excluded from compliance score to not unfairly penalize
    const validRecords = filtered.filter(r => r.status !== 'skipped');
    if (validRecords.length === 0) return 100; // Perfect score if no records exist yet

    const taken = validRecords.filter(r => r.status === 'taken').length;
    return Math.round((taken / validRecords.length) * 100);
  },

  // --- Background Timers and Compliance Updating ---

  getNotifiedEvents(): string[] {
    const data = localStorage.getItem(KEYS.NOTIFIED);
    return data ? JSON.parse(data) : [];
  },

  markEventAsNotified(eventKey: string): void {
    const notified = this.getNotifiedEvents();
    if (!notified.includes(eventKey)) {
      notified.push(eventKey);
      localStorage.setItem(KEYS.NOTIFIED, JSON.stringify(notified));
    }
  },

  getChimePreference(): 'zen' | 'energetic' | 'gentle_bell' | 'digital_chime' {
    const pref = localStorage.getItem(KEYS.CHIME_PREFERENCE);
    return (pref as any) || 'zen';
  },

  setChimePreference(style: 'zen' | 'energetic' | 'gentle_bell' | 'digital_chime'): void {
    localStorage.setItem(KEYS.CHIME_PREFERENCE, style);
  },

  /**
   * Scans active schedules and compares with local clock.
   * - Fires `onDue` callbacks when a dose is currently due, playing synthesized audio and displaying system notifications.
   * - Automatically marks historical unaddressed doses as "missed" (if older than 2 hours).
   */
  checkSchedulesDue(onDue?: (schedule: MedicationSchedule, scheduledTimeStr: string) => void): void {
    const schedules = this.getSchedules().filter(s => s.isActive);
    const records = this.getComplianceRecords();
    const notified = this.getNotifiedEvents();
    
    const now = new Date();
    const nowMs = now.getTime();
    
    // We scan schedules and trace from their start date to today
    schedules.forEach(schedule => {
      const startDate = new Date(schedule.startDate + 'T00:00:00');
      let daysLimit = schedule.durationDays ?? 30; // default cap of 30 days if indefinite
      
      // Calculate end date
      const endDate = new Date(startDate.getTime());
      endDate.setDate(endDate.getDate() + daysLimit);

      // If current date is past the full end date, we deactivate this schedule
      if (nowMs > endDate.getTime()) {
        this.deactivateExpiredSchedule(schedule.id);
        return;
      }

      // Check dates starting from schedule start date up to today
      const scanDate = new Date(startDate.getTime());
      const todayDateStr = now.toISOString().split('T')[0];
      
      while (scanDate.getTime() <= nowMs && scanDate.toISOString().split('T')[0] <= todayDateStr) {
        const dateStr = scanDate.toISOString().split('T')[0];

        schedule.hourMap.forEach(hour => {
          // Construct targeted scheduled time
          const hourStr = String(hour).padStart(2, '0');
          const scheduledTimeStr = `${dateStr}T${hourStr}:00`;
          const scheduledTimeMs = new Date(scheduledTimeStr).getTime();

          // Skip future scheduled events
          if (scheduledTimeMs > nowMs) return;

          // Find if compliance is already recorded for this event
          const hasRecord = records.some(r => r.scheduleId === schedule.id && r.scheduledTime === scheduledTimeStr);
          
          if (!hasRecord) {
            const timeDiffHrs = (nowMs - scheduledTimeMs) / (1000 * 60 * 60);

            if (timeDiffHrs >= 2.0) {
              // 1. More than 2 hours overdue -> Auto-log as missed to build statistics
              this.logCompliance(schedule.id, 'missed', scheduledTimeStr);
            } else {
              // 2. Within 2-hour window -> Trigger Active Due Alarm
              const eventKey = `${schedule.id}_${scheduledTimeStr}`;
              if (!notified.includes(eventKey)) {
                this.markEventAsNotified(eventKey);

                // Play synthesized chime
                const style = this.getChimePreference();
                playChime(style);

                // Send rich browser notification
                NotificationService.showNotification(`Time for ${schedule.drugName}`, {
                  body: `Please take ${schedule.dosage} of ${schedule.drugName} as scheduled.`,
                  tag: eventKey
                });

                if (onDue) {
                  onDue(schedule, scheduledTimeStr);
                }
              }
            }
          }
        });

        // Increment scan date by 1 day
        scanDate.setDate(scanDate.getDate() + 1);
      }
    });
  },

  deactivateExpiredSchedule(id: string): void {
    const schedules = this.getSchedules();
    const index = schedules.findIndex(s => s.id === id);
    if (index !== -1) {
      schedules[index].isActive = false;
      localStorage.setItem(KEYS.SCHEDULES, JSON.stringify(schedules));
    }
  }
};
