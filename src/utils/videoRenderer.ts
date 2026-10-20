// Cinematic AI Video Generation Engine
// Renders procedural motion graphics, typography, audio synthesis, and exports MP4/WebM video files

export interface VideoConfig {
  prompt: string;
  durationSeconds: number; // 10, 30, 50, 60
  aspectRatio: '16:9' | '9:16' | '1:1';
  style: 'cyberpunk' | 'space' | 'sunset' | 'nature' | 'luxury' | 'matrix';
  title?: string;
  subtitle?: string;
  resolution?: '1080p' | '720p';
}

export interface VideoRenderProgress {
  percent: number;
  currentSecond: number;
  totalSeconds: number;
  status: string;
}

export class AIVideoGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioCtx: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false })!;
  }

  public async generateVideo(
    config: VideoConfig,
    onProgress?: (progress: VideoRenderProgress) => void
  ): Promise<{ videoUrl: string; blob: Blob; mimeType: string }> {
    const { durationSeconds, aspectRatio, style, title = "Mian's AI Video", subtitle = config.prompt } = config;

    // Set dimensions based on aspect ratio
    let width = 1280;
    let height = 720;
    if (aspectRatio === '9:16') {
      width = 720;
      height = 1280;
    } else if (aspectRatio === '1:1') {
      width = 800;
      height = 800;
    }

    this.canvas.width = width;
    this.canvas.height = height;

    // Setup Web Audio synthesizer for ambient cinematic sound
    const audioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    let audioDest: MediaStreamAudioDestinationNode | null = null;
    let audioStream: MediaStream | null = null;

    try {
      this.audioCtx = new audioContextClass();
      audioDest = this.audioCtx.createMediaStreamDestination();
      audioStream = audioDest.stream;
      this.playCinematicAudio(this.audioCtx, audioDest, durationSeconds);
    } catch (e) {
      console.warn('Audio synthesis unavailable, video will be silent:', e);
    }

    // Capture canvas stream
    const canvasStream = this.canvas.captureStream(30); // 30 FPS
    const combinedStream = new MediaStream();

    canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
    if (audioStream) {
      audioStream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
    }

    // Determine supported mime type
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }
    }

    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : '',
      videoBitsPerSecond: 3000000, // 3 Mbps for crisp quality
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) return reject('MediaRecorder initialization failed');

      this.mediaRecorder.onstop = () => {
        const finalBlob = new Blob(this.recordedChunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(finalBlob);
        if (this.audioCtx) {
          try {
            this.audioCtx.close();
          } catch (e) {}
        }
        resolve({ videoUrl, blob: finalBlob, mimeType });
      };

      this.mediaRecorder.start(100);

      // Animation loop over time
      const startTime = performance.now();
      const totalDurationMs = durationSeconds * 1000;
      const ctx = this.ctx;

      // Particle system state
      const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; color: string }> = [];
      const particleCount = 70;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          size: Math.random() * 4 + 1.5,
          color: this.getParticleColor(style),
        });
      }

      const renderFrame = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / totalDurationMs, 1);
        const currentSec = Math.min(Math.floor(elapsed / 1000), durationSeconds);

        if (onProgress) {
          onProgress({
            percent: Math.floor(progress * 100),
            currentSecond: currentSec,
            totalSeconds: durationSeconds,
            status: `Rendering frame ${Math.floor(elapsed / 33)} (${currentSec}s / ${durationSeconds}s)...`,
          });
        }

        // Draw style scene
        this.drawScene(ctx, width, height, progress, elapsed, style, particles, title, subtitle);

        if (progress < 1) {
          requestAnimationFrame(renderFrame);
        } else {
          // Finish recording
          setTimeout(() => {
            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
              this.mediaRecorder.stop();
            }
          }, 300);
        }
      };

      requestAnimationFrame(renderFrame);
    });
  }

  private getParticleColor(style: VideoConfig['style']): string {
    switch (style) {
      case 'cyberpunk':
        return Math.random() > 0.5 ? '#06b6d4' : '#ec4899';
      case 'sunset':
        return Math.random() > 0.5 ? '#f59e0b' : '#ef4444';
      case 'luxury':
        return '#fbbf24';
      case 'matrix':
        return '#10b981';
      case 'nature':
        return Math.random() > 0.5 ? '#10b981' : '#38bdf8';
      case 'space':
      default:
        return Math.random() > 0.5 ? '#818cf8' : '#c084fc';
    }
  }

  private drawScene(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number,
    elapsed: number,
    style: VideoConfig['style'],
    particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; color: string }>,
    title: string,
    subtitle: string
  ) {
    const t = elapsed / 1000;

    // Background gradient based on style with cinematic camera zoom
    const zoom = 1 + progress * 0.08;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    const bgGrad = ctx.createRadialGradient(
      width / 2 + Math.sin(t * 0.5) * 50,
      height / 2 + Math.cos(t * 0.5) * 30,
      50,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.8
    );

    if (style === 'cyberpunk') {
      bgGrad.addColorStop(0, '#1e0b36');
      bgGrad.addColorStop(0.5, '#0b0f24');
      bgGrad.addColorStop(1, '#03050c');
    } else if (style === 'sunset') {
      bgGrad.addColorStop(0, '#451a03');
      bgGrad.addColorStop(0.4, '#1c1917');
      bgGrad.addColorStop(1, '#09090b');
    } else if (style === 'luxury') {
      bgGrad.addColorStop(0, '#2e1c0c');
      bgGrad.addColorStop(0.6, '#0f0c08');
      bgGrad.addColorStop(1, '#050402');
    } else if (style === 'matrix') {
      bgGrad.addColorStop(0, '#062817');
      bgGrad.addColorStop(0.5, '#02120a');
      bgGrad.addColorStop(1, '#000502');
    } else if (style === 'nature') {
      bgGrad.addColorStop(0, '#062e2c');
      bgGrad.addColorStop(0.5, '#041724');
      bgGrad.addColorStop(1, '#02090f');
    } else {
      bgGrad.addColorStop(0, '#15143a');
      bgGrad.addColorStop(0.5, '#090a1a');
      bgGrad.addColorStop(1, '#030408');
    }

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Glowing horizon / grid
    if (style === 'cyberpunk') {
      this.drawCyberpunkGrid(ctx, width, height, t);
    } else if (style === 'sunset') {
      this.drawSunDisk(ctx, width, height, t);
    } else if (style === 'matrix') {
      this.drawMatrixRain(ctx, width, height, t);
    }

    // Dynamic floating particles
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color;
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Geometric accent ring
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(t * 0.15);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(width, height) * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // restore zoom transform

    // Vignette
    const vig = ctx.createRadialGradient(width / 2, height / 2, width * 0.35, width / 2, height / 2, width * 0.7);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);

    // Dynamic Title & Cinematic Subtitles
    this.drawCinematicTitles(ctx, width, height, progress, t, title, subtitle);

    // Brand Watermark & Timecode
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px monospace';
    ctx.fillText("MIAN'S AI CINEMA", 28, 36);

    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    const timecode = `REC ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(ms).padStart(2, '0')}`;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(width - 140, 30, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(timecode, width - 125, 35);
  }

  private drawCyberpunkGrid(ctx: CanvasRenderingContext2D, width: number, height: number, t: number) {
    const horizon = height * 0.65;
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.25)';
    ctx.lineWidth = 1.5;

    // Perspective lines
    for (let x = -width; x <= width * 2; x += 60) {
      ctx.beginPath();
      ctx.moveTo(width / 2, horizon);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Moving horizontal grid lines
    const offset = (t * 50) % 30;
    for (let y = horizon; y <= height; y += (y - horizon) * 0.35 + 8) {
      ctx.beginPath();
      ctx.moveTo(0, y + offset);
      ctx.lineTo(width, y + offset);
      ctx.stroke();
    }
  }

  private drawSunDisk(ctx: CanvasRenderingContext2D, width: number, height: number, t: number) {
    const sunGrad = ctx.createLinearGradient(0, height * 0.2, 0, height * 0.65);
    sunGrad.addColorStop(0, '#fef08a');
    sunGrad.addColorStop(0.5, '#f97316');
    sunGrad.addColorStop(1, '#dc2626');

    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.45, Math.min(width, height) * 0.2, 0, Math.PI * 2);
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawMatrixRain(ctx: CanvasRenderingContext2D, width: number, height: number, t: number) {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.font = '14px monospace';
    for (let x = 20; x < width; x += 40) {
      const y = ((t * 80 + x * 7) % height);
      ctx.fillText(String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96)), x, y);
    }
  }

  private drawCinematicTitles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number,
    t: number,
    title: string,
    subtitle: string
  ) {
    // Opacity pulse or smooth fade
    let alpha = 1;
    if (progress < 0.1) {
      alpha = progress / 0.1;
    } else if (progress > 0.9) {
      alpha = (1 - progress) / 0.1;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // Title in center or bottom third
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 3;

    const fontSize = Math.floor(Math.min(width, height) * 0.055);
    ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(title.toUpperCase(), width / 2, height * 0.76);

    // Subtitle / Prompt
    const subFontSize = Math.floor(fontSize * 0.45);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `500 ${subFontSize}px system-ui, sans-serif`;
    const cleanSub = subtitle.length > 70 ? subtitle.slice(0, 68) + '...' : subtitle;
    ctx.fillText(cleanSub, width / 2, height * 0.82);

    ctx.restore();
  }

  private playCinematicAudio(
    audioCtx: AudioContext,
    dest: MediaStreamAudioDestinationNode,
    duration: number
  ) {
    // Synthesize warm cinematic drone + subtle rhythm
    const now = audioCtx.currentTime;

    // Sub bass drone oscillator
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, now); // A1 note
    osc.frequency.exponentialRampToValueAtTime(82.4, now + duration * 0.6); // E2

    // Low pass filter
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(440, now + duration * 0.5);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 1.5);
    gain.gain.linearRampToValueAtTime(0.18, now + duration - 1.5);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + duration);
  }
}
