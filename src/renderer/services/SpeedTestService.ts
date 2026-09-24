/**
 * SpeedTestService - Real-time Network Throughput & Latency Engine
 * Supports Ping, Jitter, Download & Upload testing with live progress callbacks.
 * Works seamlessly on Electron Desktop and Capacitor Android.
 */

export type SpeedTestStage = 'idle' | 'ping' | 'download' | 'upload' | 'completed' | 'error';

export interface SpeedTestResult {
  id: string;
  timestamp: number;
  pingMs: number;
  jitterMs: number;
  downloadMbps: number;
  uploadMbps: number;
  ip?: string;
  serverLocation?: string;
  isp?: string;
}

export interface SpeedTestProgress {
  stage: SpeedTestStage;
  percent: number; // 0 - 100
  currentPing: number;
  currentJitter: number;
  currentDownload: number;
  currentUpload: number;
  instantSpeed: number; // For live speedometer gauge
  serverInfo?: {
    ip: string;
    city: string;
    country: string;
  };
  error?: string;
}

export type ProgressCallback = (progress: SpeedTestProgress) => void;

const HISTORY_STORAGE_KEY = 'wifiguard_speedtest_history';

export class SpeedTestService {
  private abortController: AbortController | null = null;
  private isRunning: boolean = false;

  public getHistory(): SpeedTestResult[] {
    try {
      const data = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public saveResult(result: SpeedTestResult): void {
    try {
      const history = this.getHistory();
      const updated = [result, ...history.slice(0, 19)]; // Keep latest 20
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save speed test result:', e);
    }
  }

  public clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear speed test history:', e);
    }
  }

  public stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isRunning = false;
  }

  public async runTest(onProgress: ProgressCallback): Promise<SpeedTestResult> {
    if (this.isRunning) {
      this.stop();
    }

    this.isRunning = true;
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    const progress: SpeedTestProgress = {
      stage: 'ping',
      percent: 0,
      currentPing: 0,
      currentJitter: 0,
      currentDownload: 0,
      currentUpload: 0,
      instantSpeed: 0
    };

    try {
      // Step 0: Fetch IP & Server Info via Cloudflare trace
      let clientIp = 'Unknown';
      let serverCity = 'Jakarta, ID';
      let serverCountry = 'ID';

      try {
        const traceRes = await fetch('https://1.1.1.1/cdn-cgi/trace', { signal, cache: 'no-store' });
        if (traceRes.ok) {
          const text = await traceRes.text();
          const ipMatch = text.match(/ip=(.+)/);
          const locMatch = text.match(/loc=(.+)/);
          const coloMatch = text.match(/colo=(.+)/);
          if (ipMatch) clientIp = ipMatch[1].trim();
          if (coloMatch) serverCity = `${coloMatch[1].trim()} Node`;
          if (locMatch) serverCountry = locMatch[1].trim();
        }
      } catch {
        // Fallback silently if trace fails
      }

      progress.serverInfo = {
        ip: clientIp,
        city: serverCity,
        country: serverCountry
      };
      onProgress({ ...progress });

      // Step 1: Measure Ping & Jitter
      progress.stage = 'ping';
      onProgress({ ...progress });

      const pings: number[] = [];
      const pingIterations = 6;

      for (let i = 0; i < pingIterations; i++) {
        if (signal.aborted) throw new Error('Test cancelled');

        const pingStart = performance.now();
        await fetch(`https://speed.cloudflare.com/__down?bytes=0&t=${Date.now()}_${i}`, {
          signal,
          cache: 'no-store'
        });
        const latency = Math.round(performance.now() - pingStart);

        if (i > 0) {
          // Skip first warmup sample
          pings.push(latency);
        }

        // Running stats
        if (pings.length > 0) {
          const sorted = [...pings].sort((a, b) => a - b);
          progress.currentPing = sorted[Math.floor(sorted.length / 2)];

          // Calculate jitter (mean difference between successive samples)
          let jitterSum = 0;
          for (let j = 1; j < pings.length; j++) {
            jitterSum += Math.abs(pings[j] - pings[j - 1]);
          }
          progress.currentJitter = pings.length > 1 ? Math.round(jitterSum / (pings.length - 1)) : 1;
        }

        progress.percent = Math.round((i / pingIterations) * 20);
        onProgress({ ...progress });
        await new Promise((r) => setTimeout(r, 60));
      }

      // Step 2: Measure Download Speed
      progress.stage = 'download';
      progress.percent = 20;
      onProgress({ ...progress });

      const downloadDurationMs = 6000;
      const downloadStart = performance.now();
      let totalDownloadedBytes = 0;
      let downloadMbps = 0;

      // Parallel download streams for maximum saturation
      const chunkSize = 15000000; // 15MB chunks
      const downloadController = new AbortController();
      const cancelStreams = () => downloadController.abort();

      const runDownloadWorker = async () => {
        while (performance.now() - downloadStart < downloadDurationMs && !signal.aborted && !downloadController.signal.aborted) {
          try {
            const url = `https://speed.cloudflare.com/__down?bytes=${chunkSize}&t=${Date.now()}_${Math.random()}`;
            const res = await fetch(url, { signal: downloadController.signal, cache: 'no-store' });
            if (!res.body) break;

            const reader = res.body.getReader();
            while (true) {
              if (performance.now() - downloadStart >= downloadDurationMs || signal.aborted || downloadController.signal.aborted) {
                break;
              }
              const { done, value } = await reader.read();
              if (done) break;
              if (value) {
                totalDownloadedBytes += value.length;
              }
            }
          } catch {
            break;
          }
        }
      };

      // Interval ticker for live progress updates
      const downloadInterval = setInterval(() => {
        const elapsed = (performance.now() - downloadStart) / 1000;
        if (elapsed > 0.3) {
          downloadMbps = parseFloat(((totalDownloadedBytes * 8) / (elapsed * 1000000)).toFixed(2));
          progress.currentDownload = downloadMbps;
          progress.instantSpeed = downloadMbps;
        }

        const elapsedMs = performance.now() - downloadStart;
        const subPercent = Math.min(1, elapsedMs / downloadDurationMs);
        progress.percent = 20 + Math.round(subPercent * 40); // 20% to 60%
        onProgress({ ...progress });
      }, 100);

      // Launch 2 parallel streams
      await Promise.allSettled([runDownloadWorker(), runDownloadWorker()]);
      clearInterval(downloadInterval);
      cancelStreams();

      const totalDownloadElapsed = (performance.now() - downloadStart) / 1000;
      downloadMbps = parseFloat(((totalDownloadedBytes * 8) / (totalDownloadElapsed * 1000000)).toFixed(2));
      progress.currentDownload = downloadMbps;
      progress.instantSpeed = 0;
      progress.percent = 60;
      onProgress({ ...progress });

      // Step 3: Measure Upload Speed
      progress.stage = 'upload';
      onProgress({ ...progress });

      const uploadDurationMs = 5000;
      const uploadStart = performance.now();
      let totalUploadedBytes = 0;
      let uploadMbps = 0;

      // 512KB payload chunk
      const uploadPayload = new Uint8Array(512 * 1024);
      for (let i = 0; i < uploadPayload.length; i++) {
        uploadPayload[i] = (i % 255) ^ 0x5a;
      }

      const uploadController = new AbortController();

      const runUploadWorker = async () => {
        while (performance.now() - uploadStart < uploadDurationMs && !signal.aborted && !uploadController.signal.aborted) {
          try {
            const url = `https://speed.cloudflare.com/__up?t=${Date.now()}_${Math.random()}`;
            await fetch(url, {
              method: 'POST',
              body: uploadPayload,
              signal: uploadController.signal,
              cache: 'no-store'
            });
            totalUploadedBytes += uploadPayload.length;
          } catch {
            break;
          }
        }
      };

      const uploadInterval = setInterval(() => {
        const elapsed = (performance.now() - uploadStart) / 1000;
        if (elapsed > 0.3) {
          uploadMbps = parseFloat(((totalUploadedBytes * 8) / (elapsed * 1000000)).toFixed(2));
          progress.currentUpload = uploadMbps;
          progress.instantSpeed = uploadMbps;
        }

        const elapsedMs = performance.now() - uploadStart;
        const subPercent = Math.min(1, elapsedMs / uploadDurationMs);
        progress.percent = 60 + Math.round(subPercent * 38); // 60% to 98%
        onProgress({ ...progress });
      }, 100);

      // Launch 2 parallel upload workers
      await Promise.allSettled([runUploadWorker(), runUploadWorker()]);
      clearInterval(uploadInterval);
      uploadController.abort();

      const totalUploadElapsed = (performance.now() - uploadStart) / 1000;
      uploadMbps = parseFloat(((totalUploadedBytes * 8) / (totalUploadElapsed * 1000000)).toFixed(2));
      progress.currentUpload = uploadMbps;
      progress.instantSpeed = 0;
      progress.percent = 100;
      progress.stage = 'completed';
      onProgress({ ...progress });

      const finalResult: SpeedTestResult = {
        id: `test_${Date.now()}`,
        timestamp: Date.now(),
        pingMs: progress.currentPing || 15,
        jitterMs: progress.currentJitter || 1,
        downloadMbps: downloadMbps || 0.1,
        uploadMbps: uploadMbps || 0.1,
        ip: clientIp,
        serverLocation: `${serverCity} (${serverCountry})`
      };

      this.saveResult(finalResult);
      this.isRunning = false;
      return finalResult;
    } catch (err: any) {
      this.isRunning = false;
      progress.stage = 'error';
      progress.error = err?.message || 'Uji kecepatan dibatalkan atau terputus';
      onProgress({ ...progress });
      throw err;
    }
  }
}

export const speedTestService = new SpeedTestService();
