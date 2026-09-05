// Maps GPU PCI device IDs (the 0xXXXX in WebGL renderer strings)
// to the chip family. Best-effort guess: one iGPU ID is shared by
// several CPU models, so this identifies the FAMILY, never the exact CPU.
const DEVICE_MAP: Record<string, string> = {
  // ---- AMD integrated (Ryzen APUs) ----
  '15dd': 'AMD Raven Ridge iGPU (Ryzen 2000 G-series class)',
  '15d8': 'AMD Picasso iGPU (Ryzen 3000 G-series class)',
  '1636': 'AMD Renoir iGPU (Ryzen 4000 laptop class)',
  '1638': 'AMD Cezanne iGPU (Ryzen 5000 G-series: 5600G/5700G class)',
  '1681': 'AMD Rembrandt iGPU 660M/680M (Ryzen 6000 laptop class)',
  '15bf': 'AMD Phoenix iGPU 740M/760M/780M (Ryzen 7040 laptop class)',
  '164e': 'AMD Raphael iGPU (Ryzen 7000 desktop class)',

  // ---- Intel integrated ----
  '5917': 'Intel UHD 620 (7th/8th-gen laptop class)',
  '3e9b': 'Intel UHD 630 (8th/9th-gen desktop class)',
  '3e92': 'Intel UHD 630 (8th/9th-gen desktop class)',
  '9bc5': 'Intel UHD (10th-gen Comet Lake class)',
  '9a49': 'Intel Iris Xe (11th-gen Tiger Lake class)',
  '9a59': 'Intel Iris Xe (11th-gen Tiger Lake class)',
  '4680': 'Intel UHD 770 (12th/13th-gen desktop class)',

  // ---- NVIDIA discrete ----
  '1c82': 'NVIDIA GTX 1050 Ti class',
  '1f82': 'NVIDIA GTX 1650 class',
  '1f08': 'NVIDIA RTX 2060 class',
  '2486': 'NVIDIA RTX 3060 Ti class',
  '2487': 'NVIDIA RTX 3060 (laptop) class',
  '2503': 'NVIDIA RTX 3060 class',
  '2484': 'NVIDIA RTX 3070 class',
  '2204': 'NVIDIA RTX 3090 class',
  '2684': 'NVIDIA RTX 4090 class',
  '2882': 'NVIDIA RTX 4060 class',
};

export function extractDeviceId(gpu: string | null): string | null {
  if (!gpu) return null;
  const m = gpu.match(/0x([0-9a-fA-F]{4,8})/);
  if (!m) return null;
  // take last 4 hex digits (full PCI ID), lowercase
  return m[1].slice(-4).toLowerCase();
}

export function guessGpuFamily(gpu: string | null): string | null {
  if (!gpu) return null;
  if (/apple\s+m\d/i.test(gpu)) {
    const m = gpu.match(/apple\s+(m\d[^,)]*)/i);
    return m ? `Apple ${m[1].trim()} GPU` : 'Apple Silicon GPU';
  }
  const id = extractDeviceId(gpu);
  if (id && DEVICE_MAP[id]) return DEVICE_MAP[id];
  return null;
}
