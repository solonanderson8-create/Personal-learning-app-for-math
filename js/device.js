// A rough device name, shown next to saved items so you can see which device saved them.
export function deviceName() {
  const ua = navigator.userAgent;
  if (/OculusBrowser|Quest/i.test(ua)) return 'Quest';
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad';
  if (/iPhone/.test(ua)) return 'iPhone';
  return 'Other device';
}
