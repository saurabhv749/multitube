const QUALITIES = {
  "144p": { q: 1, resolution: [176, 144], audioBitrate: 64, videoBitrate: 300 },
  "240p": { q: 2, resolution: [320, 240], audioBitrate: 64, videoBitrate: 500 },
  "360p": { q: 3, resolution: [640, 360], audioBitrate: 96, videoBitrate: 700 },
  "480p": {
    q: 4,
    resolution: [720, 480],
    audioBitrate: 128,
    videoBitrate: 1200,
  },
  "720p": {
    q: 5,
    resolution: [1280, 720],
    audioBitrate: 128,
    videoBitrate: 3500,
  },
  "1080p": {
    q: 6,
    resolution: [1920, 1080],
    audioBitrate: 128,
    videoBitrate: 5500,
  },
};

module.exports = QUALITIES;
