import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeSoundService {
  private audioCtx: AudioContext | null = null;

  public play(isDark: boolean): void {
    // Lazy initialize context (browsers require user interaction first)
    if (!this.audioCtx) {
      const AudioContextClass = (window.AudioContext || 
        (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      this.audioCtx = new AudioContextClass();
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    // Day: bright chime (600Hz-800Hz) | Night: deep pulse (100Hz-200Hz)
    const frequency = isDark ? 220 : 880;
    const duration = isDark ? 0.4 : 0.2;

    oscillator.type = isDark ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency / 2, this.audioCtx.currentTime + duration);

    gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

    oscillator.start();
    oscillator.stop(this.audioCtx.currentTime + duration);
  }
}
