export const extractClientIp = (req) => {
    let ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    if (typeof ip === 'string' && ip.includes(',')) {
        ip = ip.split(',')[0].trim();
    }
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        ip = '127.0.0.1 (Localhost)';
    }
    return ip;
};

export const parseUserAgent = (uaString = '') => {
    const ua = uaString.toLowerCase();

    // Determine OS
    let os = 'Unknown OS';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) os = 'iOS';
    else if (ua.includes('linux')) os = 'Linux';

    // Determine Browser
    let browser = 'Unknown Browser';
    if (ua.includes('edg/')) browser = 'Edge';
    else if (ua.includes('chrome') && !ua.includes('edg/')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';

    // Determine Device Type
    let deviceType = 'Desktop';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        deviceType = 'Mobile';
    } else if (ua.includes('ipad') || ua.includes('tablet')) {
        deviceType = 'Tablet';
    }

    const device = `${browser} on ${os}`;

    return {
        ipAddress: '',
        device,
        browser,
        os,
        deviceType
    };
};
