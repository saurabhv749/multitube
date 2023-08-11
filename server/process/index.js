const path = require("path");
const fs = require("fs");
const CONVERSION = require("./Conversion");
/** UPLOADED FILES STRUCTURE
 *  -Video_Title
 *     [eng].srt
 *     [jap].srt
 *     Video_Title.[video_ext]
 *     poster.jpeg
 */

const uploads_folder = path.join(__dirname, "..", "uploaded_videos");
const processed_folder = path.join(__dirname, "..", "processed_videos");

const uploaded_files = fs.readdirSync(uploads_folder);

uploaded_files.forEach((video) => {
  const output_folder_path = path.join(processed_folder, video);
  if (!fs.existsSync(output_folder_path)) {
    //process video
    const input_folder = path.join(uploads_folder, video);
    console.log("🚀 processing:  ", video);
    new CONVERSION(input_folder, output_folder_path);
  }
});

// update database
const db = [];
const processed_files = fs.readdirSync(processed_folder);
processed_files.map((vid_folder) => {
  const meta = {
    master: `/${vid_folder}/master.m3u8`,
    textTracks: {
      subtitles: [],
    },
    vid: `/${vid_folder}`,
  };
  const metaFile = path.join(processed_folder, vid_folder, "meta.txt");
  fs.readFileSync(metaFile, "utf-8")
    .split("\n")
    .map((x) => {
      const m = x.split("=");
      meta[m[0].trim()] = m[1].trim();
    });

  // subs
  const subs_folder = path.join(processed_folder, vid_folder, "subtitles");

  try {
    const subtitles = fs.readdirSync(subs_folder);
    subtitles.map((s) =>
      meta.textTracks.subtitles.push({
        label: s.split(".")[0],
        language: s.split(".")[0],
        url: `/subtitles/${s}`,
      })
    );
  } catch (error) {}

  db.push(meta);
});

const db_path = path.join(__dirname, "..", "database", "db.json");
fs.writeFileSync(db_path, JSON.stringify(db), { encoding: "utf-8" });
console.log("✅ DB updated");
