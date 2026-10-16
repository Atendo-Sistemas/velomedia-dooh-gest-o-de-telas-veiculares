export function buildKioskUrl(origin: string, deviceCode?: string): string {
  const url = new URL('/', origin);
  url.searchParams.set('tab', 'player');
  url.searchParams.set('kiosk', 'true');
  url.searchParams.set('pwa', '1');
  url.searchParams.set('simple', '1');
  if (deviceCode) url.searchParams.set('device', deviceCode);
  return url.toString();
}
