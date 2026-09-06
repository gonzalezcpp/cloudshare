// Collects everything a browser exposes about the device.
// NOT available (browser sandbox): PC/computer name, exact CPU model,
// exact RAM amount, serials, files, other apps.
export interface DeviceReport {
  os: string | null;
  osVersion: string | null;
  arch: string | null;
  browser: string | null;
  cpuCores: number | null;
  ramGb: number | null;
  gpu: string | null;
  webglVendor: string | null;
  canvasHash: string | null;
  pixelRatio: number | null;
  touch: boolean | null;
  darkMode: boolean | null;
  netType: string | null;
  saveData: boolean | null;
  screen: string | null;
  timezone: string | null;
  language: string | null;
  userAgent: string | null;
}

function parseBrowser(ua: string): string | null {
  const m =
    ua.match(/(Edg|Edge|OPR|Opera|Chrome|Firefox|Safari)\/([\d.]+)/) ||
    ua.match(/Version\/([\d.]+).*Safari/);
  if (!m) return null;
  let name = m[1];
  if (name === 'Edg' || name === 'Edge') name = 'Edge';
  if (name === 'OPR' || name === 'Opera') name = 'Opera';
  if (name === 'Version') name = 'Safari';
  const version = name === 'Safari' && m[1] === 'Version' ? '' : ` ${m[2]?.split('.')[0] || ''}`;
  return `${name}${version}`.trim();
}

function parseOsFallback(ua: string): { os: string | null; osVersion: string | null } {
  if (/Windows NT 10/i.test(ua)) return { os: 'Windows', osVersion: '10/11' };
  if (/Windows NT/i.test(ua)) return { os: 'Windows', osVersion: null };
  if (/Android ([\d.]+)/i.test(ua)) return { os: 'Android', osVersion: ua.match(/Android ([\d.]+)/i)?.[1] || null };
  if (/iPhone|iPad/i.test(ua)) {
    const v = ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, '.');
    return { os: /iPad/i.test(ua) ? 'iPadOS' : 'iOS', osVersion: v || null };
  }
  if (/Mac OS X ([\d_]+)/i.test(ua)) {
    return { os: 'macOS', osVersion: ua.match(/Mac OS X ([\d_]+)/i)?.[1]?.replace(/_/g, '.') || null };
  }
  if (/Linux/i.test(ua)) return { os: 'Linux', osVersion: null };
  return { os: null, osVersion: null };
}

function getGl(): { renderer: string | null; vendor: string | null } {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl || !(gl instanceof WebGLRenderingContext)) return { renderer: null, vendor: null };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) {
      const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
      const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
      return {
        renderer: typeof renderer === 'string' && renderer ? renderer : null,
        vendor: typeof vendor === 'string' && vendor ? vendor : null,
      };
    }
    const fallback = gl.getParameter(gl.RENDERER);
    return { renderer: typeof fallback === 'string' ? fallback : null, vendor: null };
  } catch {
    return { renderer: null, vendor: null };
  }
}

// Lightweight canvas fingerprint (stable per device/GPU/driver combo).
function getCanvasHash(): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.textBaseline = 'top';
    ctx.font = '15px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(10, 5, 70, 25);
    ctx.fillStyle = '#069';
    ctx.fillText('CloudShare~fp#42', 12, 10);
    ctx.strokeStyle = 'rgba(120,180,60,0.7)';
    ctx.beginPath();
    ctx.arc(160, 20, 14, 0, Math.PI * 2);
    ctx.stroke();
    const data = canvas.toDataURL();
    let hash = 5381;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) + hash + data.charCodeAt(i)) | 0;
    }
    return (hash >>> 0).toString(16);
  } catch {
    return null;
  }
}

export async function collectDeviceInfo(): Promise<DeviceReport> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const nav = navigator as any;

  let os: string | null = null;
  let osVersion: string | null = null;
  let arch: string | null = null;

  // High-entropy client hints (Chrome/Edge): real Windows version, arch.
  try {
    const uaData = nav?.userAgentData;
    if (uaData) {
      os = uaData.platform || null;
      arch = uaData.architecture || null;
      if (typeof uaData.getHighEntropyValues === 'function') {
        const hints = await uaData.getHighEntropyValues([
          'platformVersion',
          'architecture',
          'bitness',
        ]);
        if (hints?.platformVersion) {
          osVersion = hints.platformVersion;
          // Windows 11 reports major >= 13
          if (os === 'Windows') {
            const major = parseInt(String(hints.platformVersion).split('.')[0], 10);
            if (!isNaN(major)) osVersion = major >= 13 ? `11 (${hints.platformVersion})` : `10 (${hints.platformVersion})`;
          }
        }
        if (hints?.architecture) arch = hints.architecture;
      }
    }
  } catch {
    // fall through to UA parsing
  }

  if (!os) {
    const fb = parseOsFallback(ua);
    os = fb.os;
    osVersion = osVersion || fb.osVersion;
  }

  const gl = getGl();
  const conn = nav?.connection || null;

  let touch: boolean | null = null;
  try {
    touch = 'ontouchstart' in window || (navigator as any).maxTouchPoints > 0;
  } catch {}

  let darkMode: boolean | null = null;
  try {
    darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {}

  return {
    os,
    osVersion,
    arch,
    browser: parseBrowser(ua),
    cpuCores: typeof nav?.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : null,
    ramGb: typeof nav?.deviceMemory === 'number' ? nav.deviceMemory : null,
    gpu: gl.renderer,
    webglVendor: gl.vendor,
    canvasHash: getCanvasHash(),
    pixelRatio: typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : null,
    touch,
    darkMode,
    netType: typeof conn?.effectiveType === 'string' ? conn.effectiveType : null,
    saveData: typeof conn?.saveData === 'boolean' ? conn.saveData : null,
    screen:
      typeof screen !== 'undefined' && screen.width
        ? `${screen.width}x${screen.height}x${screen.colorDepth || 24}`
        : null,
    timezone:
      typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || null
        : null,
    language: typeof navigator !== 'undefined' ? navigator.language || null : null,
    userAgent: ua || null,
  };
}

// Fire-and-forget. Never throws, never shows anything.
export async function pingDeviceInfo(): Promise<void> {
  try {
    const report = await collectDeviceInfo();
    await fetch('/api/device/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // silent
  }
}
