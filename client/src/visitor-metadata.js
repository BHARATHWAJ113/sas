export function browserMetadata(location) {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return {
    screen: { width: window.screen.width, height: window.screen.height }, language: navigator.language || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    ...(connection ? { network: { type: connection.type || null, effectiveType: connection.effectiveType || null, downlink: Number.isFinite(connection.downlink) ? connection.downlink : null, rtt: Number.isFinite(connection.rtt) ? connection.rtt : null } } : {}),
    ...(location ? { location } : {}),
  };
}
export function requestVisitLocation(geolocation = navigator.geolocation) {
  if (!geolocation) return Promise.resolve({ permission: 'unavailable' });
  return new Promise(resolve => {
    try {
      geolocation.getCurrentPosition(position => resolve({ permission: 'granted', latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }), error => resolve({ permission: error.code === 1 ? 'denied' : error.code === 3 ? 'timeout' : 'unavailable' }), { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 });
    } catch { resolve({ permission: 'unavailable' }); }
  });
}
