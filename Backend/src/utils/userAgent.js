/** Order matters: e.g. Edge and Opera user agents also contain "Chrome" */
const BROWSERS = [
  ['Edge', /Edg(?:e|A|iOS)?\/(\d+)/],
  ['Opera', /(?:OPR|Opera)\/(\d+)/],
  ['Samsung Internet', /SamsungBrowser\/(\d+)/],
  ['Chrome', /(?:Chrome|CriOS)\/(\d+)/],
  ['Firefox', /(?:Firefox|FxiOS)\/(\d+)/],
  ['Safari', /Version\/(\d+).*Safari/],
  ['Postman', /PostmanRuntime\/(\d+)/],
  ['curl', /curl\/(\d+)/],
];

const OPERATING_SYSTEMS = [
  ['iOS', /iPhone|iPad|iPod/],
  ['Android', /Android/],
  ['Windows', /Windows/],
  ['ChromeOS', /CrOS/],
  ['macOS', /Mac OS X|Macintosh/],
  ['Linux', /Linux/],
];

const deviceTypeOf = (ua) => {
  if (/iPad|Tablet/i.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) return 'tablet';
  if (/Mobi|iPhone|iPod/.test(ua)) return 'mobile';
  if (/Windows|Macintosh|Mac OS X|CrOS|X11|Linux/.test(ua)) return 'desktop';
  return 'other';
};

/** Readable browser / OS / device type from a User-Agent header, for login history */
const parseUserAgent = (userAgent) => {
  if (typeof userAgent !== 'string' || !userAgent.trim()) {
    return { browser: undefined, os: undefined, deviceType: undefined };
  }

  const browserMatch = BROWSERS.map(([name, regex]) => [name, userAgent.match(regex)]).find(
    ([, match]) => match
  );
  const os = OPERATING_SYSTEMS.find(([, regex]) => regex.test(userAgent));

  return {
    browser: browserMatch ? `${browserMatch[0]} ${browserMatch[1][1]}` : 'Unknown',
    os: os ? os[0] : 'Unknown',
    deviceType: deviceTypeOf(userAgent),
  };
};

module.exports = { parseUserAgent };
