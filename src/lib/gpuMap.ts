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

const ADRENO_MAP: Record<string, string> = {
  '610': 'Snapdragon 665/680-class',
  '616': 'Snapdragon 700-series class',
  '618': 'Snapdragon 730-class',
  '619': 'Snapdragon 750G-class',
  '620': 'Snapdragon 765-class',
  '630': 'Snapdragon 845/850-class',
  '640': 'Snapdragon 855/860-class',
  '650': 'Snapdragon 865/870-class',
  '660': 'Snapdragon 888-class',
  '730': 'Snapdragon 8 Gen 1-class',
  '740': 'Snapdragon 8 Gen 2-class',
  '750': 'Snapdragon 8 Gen 3-class',
  '830': 'Snapdragon 8 Elite-class',
};

const MALI_MAP: Record<string, string> = {
  g31: 'Mali entry (Helio A/G25-class)',
  g52: 'Mali-G52 (Helio G80/G85-class)',
  g57: 'Mali-G57 (Dimensity 700/Helio G88-class)',
  g68: 'Mali-G68 (Dimensity 900/920-class)',
  g610: 'Mali-G610 (Dimensity 8000-series class)',
  g710: 'Mali-G710 (Dimensity 9000-class)',
  g715: 'Mali-G715 flagship (Dimensity 9200-class)',
};

export function guessGpuFamily(gpu: string | null): string | null {
  if (!gpu) return null;
  if (/apple\s+m\d/i.test(gpu)) {
    const m = gpu.match(/apple\s+(m\d[^,)]*)/i);
    return m ? `Apple ${m[1].trim()} GPU` : 'Apple Silicon GPU';
  }
  if (/apple\s+gpu/i.test(gpu)) return 'Apple mobile GPU (iPhone/iPad)';
  const adreno = gpu.match(/adreno[^0-9]*(\d{3})/i);
  if (adreno) {
    const chip = ADRENO_MAP[adreno[1]];
    return chip ? `Qualcomm Adreno ${adreno[1]} (${chip})` : `Qualcomm Adreno ${adreno[1]}`;
  }
  const mali = gpu.match(/mali-([a-z0-9]+)/i);
  if (mali) {
    const key = mali[1].toLowerCase();
    const chip = MALI_MAP[key];
    return chip ? `ARM ${chip}` : `ARM Mali-${mali[1]}`;
  }
  if (/xclipse/i.test(gpu)) return 'Samsung Xclipse (Exynos 2200/2400-class)';
  const id = extractDeviceId(gpu);
  if (id && DEVICE_MAP[id]) return DEVICE_MAP[id];
  return null;
}
