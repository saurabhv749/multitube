const { execSync } = require("child_process");

const executeCommand = (cmd) => {
  const result = execSync(cmd, { encoding: "utf8" });
  return result;
};

const timeFormatter = (seconds) => {
  const result = new Date(seconds * 1000).toISOString().slice(11, 19);
  return result;
};

const fileTypes = {
  mp4: "video",
  mov: "video",
  avi: "video",
  webm: "video",
  flv: "video",
  mkv: "video",
  srt: "subtitle",
  sub: "subtitle",
  ssa: "subtitle",
  vtt: "subtitle",
  ssc: "subtitle",
  jpg: "image",
  jpeg: "image",
  png: "image",
  avif: "image",
  bmp: "image",
};

module.exports = { fileTypes, timeFormatter, executeCommand };
