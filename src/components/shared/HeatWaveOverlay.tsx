
'use client';

import { useState, useEffect, useMemo } from 'react';
import { ThermometerSun, AlertTriangle, Clock, ShieldAlert, Truck, Timer } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Emergency overlay for extreme heat or high delivery demand.
 * Controlled manually by Admin from Dashboard or via Automatic Scheduler.
 */
export function HeatWaveOverlay() {
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

  // Fetch dynamic settings from Firestore
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: settings } = useDoc<any>(brandingRef);

  useEffect(() => {
    setMounted(true);
    // Track time for auto-mode
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    };
    updateTime();
    const interval = setInterval(updateTime, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Time Comparison Helper
  const isInRange = useMemo(() => {
    if (!settings?.heatWaveStartTime || !settings?.heatWaveEndTime) return false;

    const parseTimeToMinutes = (timeStr: string) => {
      try {
        if (!timeStr || typeof timeStr !== 'string') return -1;
        const parts = timeStr.trim().split(' ');
        if (parts.length < 2) return -1;
        
        const [time, modifier] = parts;
        let [hours, minutes] = time.split(':').map(Number);
        
        if (isNaN(hours)) return -1;
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + (isNaN(minutes) ? 0 : minutes);
      } catch (e) {
        return -1;
      }
    };

    const start = parseTimeToMinutes(settings.heatWaveStartTime);
    const end = parseTimeToMinutes(settings.heatWaveEndTime);

    if (start === -1 || end === -1) return false;

    if (start < end) {
      return currentTimeMinutes >= start && currentTimeMinutes <= end;
    } else {
      // Handles ranges crossing midnight
      return currentTimeMinutes >= start || currentTimeMinutes <= end;
    }
  }, [settings, currentTimeMinutes]);

  // Show overlay IF Manual Toggle is ON OR (Auto Mode is ON AND Time is in range)
  const isManualActive = settings?.isHeatWaveEnabled === true;
  const isAutoActive = settings?.heatWaveAutoMode === true && isInRange;
  
  const isActive = isManualActive || isAutoActive;

  if (!mounted || !isActive) return null;

  const isHeat = settings?.emergencyType === 'heat';
  const displayTitle = isHeat ? "HEAT WAVE" : "HIGH DEMAND";
  const displaySubtitle = isHeat ? "DELIVERY PAUSED." : "BUSY NOW.";
  const displayReason = isHeat 
    ? "EXTREME TEMPERATURE DETECTED. FOR THE SAFETY OF OUR PARTNERS, SERVICES ARE TEMPORARILY SUSPENDED."
    : "WE ARE EXPERIENCING UNUSUALLY HIGH VOLUME. ALL DELIVERY PARTNERS ARE CURRENTLY BUSY.";

  return (
    <div className="fixed inset-0 z-[1000] bg-[#0B0B0B] h-screen w-screen flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background Heat/Rush Animation */}
      <div className="absolute inset-0 opacity-20">
        <div className={cn(
          "absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] animate-pulse",
          isHeat ? "from-orange-600 via-transparent to-transparent" : "from-blue-600 via-transparent to-transparent"
        )} />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center space-y-10 animate-in fade-in zoom-in duration-700">
        
        {/* Visual Identity */}
        <div className="relative">
          <div className={cn(
            "absolute inset-0 blur-3xl rounded-full animate-ping",
            isHeat ? "bg-orange-600/20" : "bg-blue-600/20"
          )} />
          <div className={cn(
            "relative h-32 w-32 rounded-[3rem] flex items-center justify-center shadow-2xl border-4 border-white/10",
            isHeat ? "bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/30" : "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30"
          )}>
            {isHeat ? (
              <ThermometerSun className="h-16 w-16 text-white animate-bounce" style={{ animationDuration: '3s' }} />
            ) : (
              <Truck className="h-16 w-16 text-white animate-bounce" style={{ animationDuration: '3s' }} />
            )}
          </div>
          
          <div className={cn(
            "absolute -top-4 -right-4 bg-white p-3 rounded-2xl shadow-2xl font-black italic text-xl border-2",
            isHeat ? "text-red-600 border-red-50" : "text-blue-600 border-blue-50"
          )}>
            {isHeat ? "48°C" : "BUSY"}
          </div>
        </div>

        <div className="space-y-4">
          <div className={cn(
            "inline-flex items-center gap-2 text-white px-5 py-1.5 rounded-full shadow-lg animate-pulse",
            isHeat ? "bg-red-600" : "bg-blue-600"
          )}>
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isHeat ? 'Heat Emergency' : 'Service Alert'}</span>
          </div>
          
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-[0.9]">
            {displayTitle}<br /><span className={isHeat ? "text-orange-500" : "text-blue-400"}>{displaySubtitle}</span>
          </h1>
          
          <div className={cn(
            "border px-6 py-3 rounded-2xl",
            isHeat ? "bg-orange-500/10 border-orange-500/20" : "bg-blue-500/10 border-blue-500/20"
          )}>
             <p className="text-[12px] font-black text-white uppercase tracking-widest italic">
                From <span className={isHeat ? "text-orange-500" : "text-blue-400"}>{settings?.heatWaveStartTime || '1:00 PM'}</span> To <span className={isHeat ? "text-orange-500" : "text-blue-400"}>{settings?.heatWaveEndTime || '3:00 PM'}</span>
             </p>
          </div>

          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] leading-relaxed max-w-[280px] mx-auto mt-4">
            {displayReason}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-4 w-full pt-6">
           <div className="bg-white/5 backdrop-blur-md p-5 rounded-[2.5rem] border border-white/10 flex items-center gap-4 text-left">
              <div className={cn(
                "p-3 rounded-2xl",
                isHeat ? "bg-orange-500/20 text-orange-500" : "bg-blue-500/20 text-blue-400"
              )}>
                 <Clock className="h-6 w-6" />
              </div>
              <div>
                 <h4 className="text-xs font-black uppercase text-white">ETA</h4>
                 <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Resuming at {settings?.heatWaveEndTime || '3:00 PM'}</p>
              </div>
           </div>

           <div className="bg-white/5 backdrop-blur-md p-5 rounded-[2.5rem] border border-white/10 flex items-center gap-4 text-left">
              <div className="bg-green-500/20 p-3 rounded-2xl text-green-400">
                 <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                 <h4 className="text-xs font-black uppercase text-white">Status</h4>
                 <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Security Check Active</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
