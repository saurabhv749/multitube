const path = require("path");
const fs = require("fs");
const HLS = require("hls-parser");
const QUALITIES = require("./playbackQualities.js");
const LANGUAGES = require("./langCodes.js");
const { executeCommand, fileTypes, timeFormatter } = require("./utils.js");

const { MasterPlaylist, Variant, Rendition } = HLS.types;

class CONVERSION {
  constructor(input_folder, output_folder) {
    this.input_folder = input_folder;
    this.output_folder = output_folder;

    this.streams = [];
    this.audioRenditions = [];
    this.streamVariants = [];
    this.start();
  }

  start() {
    // createFolder
    if (!fs.existsSync(this.output_folder)) {
      fs.mkdirSync(this.output_folder);
      console.log("created output folder");
    }

    let video_path,
      poster_path,
      subtitles = [];

    const files = fs.readdirSync(this.input_folder);
    files.forEach((x) => {
      const ext = x.split(".")[1];
      const fType = fileTypes[ext];
      if (fType === "video") {
        video_path = path.join(this.input_folder, x);
      }
      if (fType === "image") {
        poster_path = path.join(this.input_folder, x);
      }
      if (fType === "subtitle") {
        subtitles.push(path.join(this.input_folder, x));
      }
    });

    if (!video_path || !poster_path) {
      console.log("⚠️ Video or Poster is missing. Exiting!");
      return;
    }

    console.time("app runtime");
    fs.copyFileSync(
      poster_path,
      poster_path.replace(this.input_folder, this.output_folder)
    );
    console.log("✅ Poster");

    this.getFileInfo(video_path);

    this.extractVideoSubs(video_path);
    console.log("✅ Video Subtitles");
    this.addSubs(subtitles);
    console.log("✅ External Subtitles");
    this.createAV(video_path);
    this.createVV(video_path);
    this.createMasterPlaylist();
    // save metainfo

    const vid_meta_file = path.join(this.output_folder, "meta.txt");
    fs.writeFileSync(vid_meta_file, `duration=${timeFormatter(this.duration)}`);
    console.log("✅ Video Meta");
    console.timeEnd("app runtime");
  }

  variantsToCreate() {
    const output = { Audio: [], Video: [] };

    for (let v of Object.keys(QUALITIES)) {
      const { q, resolution, audioBitrate } = QUALITIES[v];
      const w = resolution[1];
      // don't create scaled up versions
      if (w <= this.maxHeight) {
        output["Audio"].indexOf(audioBitrate) == -1 &&
          output["Audio"].push(audioBitrate);

        // v
        output["Video"].indexOf(q) == -1 && output["Video"].push(w + "p");
      }
    }

    return output;
  }

  getFileInfo(video_path) {
    const cmd = `ffprobe -v quiet -print_format json -show_streams ${video_path}`;
    const result = executeCommand(cmd);
    const { streams } = JSON.parse(result);

    streams.map((s) => {
      let stream = {};
      stream["type"] = s.codec_type;
      stream["index"] = s.index;
      if (stream.type === "video") {
        const _ = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${video_path}`;
        const duration = executeCommand(_);

        stream["resolution"] = [s.width, s.height];
        stream["duration"] = Number(duration);
        this.duration = Number(duration);
        this.maxHeight = s.height; //test
      }

      if (stream.type === "audio" || stream.type === "subtitle") {
        stream["language"] = s.tags.language
          ? s.tags.language
          : "track-0" + s.index;
      }

      this.streams.push(stream);
    });

    this.variants = this.variantsToCreate();
  }

  extractVideoSubs(video_path) {
    const subs = this.streams.filter((s) => s.type === "subtitle");

    const subsFolder = path.join(this.output_folder, "subtitles");

    if (!fs.existsSync(subsFolder)) {
      fs.mkdirSync(subsFolder);
    }

    subs.forEach((s) => {
      const output = path.join(subsFolder, s.language + ".vtt");
      if (!fs.existsSync(output)) {
        const _ = `ffmpeg -hide_banner -y -i ${video_path} -map 0:${s.index} ${output}`;

        executeCommand(_);
      }
    });
  }

  addSubs(subs) {
    const subsFolder = path.join(this.output_folder, "subtitles");

    if (!fs.existsSync(subsFolder)) {
      fs.mkdirSync(subsFolder);
    }

    subs.forEach((s) => {
      const output =
        s.replace(this.input_folder, subsFolder).split(".")[0] + ".vtt";

      if (!fs.existsSync(output)) {
        const _ = `ffmpeg -hide_banner -y -i ${s} -map 0:s:0 -c:s webvtt ${output}`;
        executeCommand(_);
      }
    });
  }
  // variants
  createAV(video_path) {
    const audios = this.streams.filter((s) => s.type === "audio"); // audio languages
    const aVariants = this.variants["Audio"]; // bitrates

    const af = path.join(this.output_folder, "audios");

    if (!fs.existsSync(af)) {
      fs.mkdirSync(af);
    }

    audios.forEach((a, langIndex) => {
      const streamIndex = a.index;
      const audio_path = path.join(af, a.language);

      if (!fs.existsSync(audio_path)) {
        fs.mkdirSync(audio_path);
      }

      const language = LANGUAGES[a.language];

      // TEMPLATES
      let cmd = `ffmpeg -re -hide_banner -i ${video_path}`;
      let codecs = ` -c:a aac`;
      let bitrates = ` `;
      let splits = ` `;
      let maps = ` -var_stream_map "`;
      const format = ` -f hls -hls_list_size 0 -threads 0 -hls_playlist_type vod -hls_time 10 -hls_segment_filename ${audio_path}/aud_%v_%03d.ts -hls_flags independent_segments ${audio_path}/%v.m3u8`;

      let run = false;

      let n = 0;
      aVariants.map((v, i) => {
        const audioVariantFile = path.join(audio_path, String(v) + ".m3u8");

        //  RENDITION
        const uri = `audios/${a.language}/${v}.m3u8`;
        const aRend = new Rendition({
          type: "AUDIO",
          groupId: v,
          name: language,
          language,
          uri,
        });
        this.audioRenditions.push(aRend);

        if (!fs.existsSync(audioVariantFile)) {
          splits += ` -map 0:${streamIndex}`;
          bitrates += ` -b:a:0 ${v}k`;
          maps += `a:${n++},name:${v} `;
          run = true;
        }
      });
      maps += '"';
      //
      if (run) {
        const _ = cmd.concat(splits, codecs, bitrates, maps, format);
        console.log(
          "🔃 CREATING AUDIO VARIANTS",
          aVariants,
          " FOR",
          a.language,
          "\n"
        );
        executeCommand(_);
        console.log(
          "✅ AUDIO VARIANTS",
          aVariants,
          " CREATED FOR ",
          a.language
        );
      } else {
        console.log(
          "✅ AUDIO VARIANTS",
          aVariants,
          " AVAILABLE FOR ",
          a.language
        );
      }
    });
  }

  createVV(video_path) {
    const videos = this.streams.filter((s) => s.type === "video");
    const vVariants = this.variants["Video"];

    const output_vid_folder = path.join(this.output_folder, "videos");

    if (!fs.existsSync(output_vid_folder)) {
      fs.mkdirSync(output_vid_folder);
    }

    // TEMPLATES
    const streamIndex = videos[0].index;

    let cmd = `ffmpeg -re -hide_banner -i ${video_path}`;
    let codecs = ` -c:v libx264`;
    let bitrates = ` `;
    let splits = ` `;
    let maps = ` -var_stream_map "`;
    const format = ` -f hls -hls_list_size 0 -threads 0 -hls_playlist_type vod -hls_time 10 -hls_segment_filename ${output_vid_folder}/%v/vid_%03d.ts -hls_flags independent_segments ${output_vid_folder}/%v/main.m3u8`;
    let run = false,
      n = 0;

    vVariants.forEach((v, i) => {
      const vq = QUALITIES[v];
      let mediaPlaylistPath = path.join(output_vid_folder, v);

      if (!fs.existsSync(mediaPlaylistPath)) {
        fs.mkdirSync(mediaPlaylistPath);
      }

      const mediaPlaylist = path.join(
        output_vid_folder,
        String(v),
        "main.m3u8"
      );

      if (!fs.existsSync(mediaPlaylist)) {
        const res = vq.resolution.join("x");
        splits += ` -map 0:${streamIndex}`;
        bitrates += ` -filter:v:${i} scale=${res} -b:v:0 ${vq.videoBitrate}k`;
        maps += `v:${n++},name:${v} `;
        run = true;
      }
    });

    maps += '"';
    //
    if (run) {
      console.log("🔃 CREATING VIDEO VARIANTS ", vVariants, "\n");
      const _ = cmd.concat(splits, codecs, bitrates, maps, format);
      executeCommand(_);
      console.log("✅ CREATED VIDEO VARIANTS ", vVariants, "\n");
    } else {
      console.log("✅ VIDEO VARIANTS", vVariants, " AVAILABLE");
    }

    //
  }

  createMasterPlaylist() {
    const mp = path.join(this.output_folder, "master.m3u8");
    const vf = path.join(this.output_folder, "videos");
    const videos = fs.readdirSync(vf, { withFileTypes: true });

    videos.map((v) => {
      const StreamDir = path.join(vf, v.name);
      const playlist = path.join(StreamDir, "main.m3u8");

      const mediaPlaylistString = fs.readFileSync(playlist, {
        encoding: "utf8",
      });

      const { segments } = HLS.parse(mediaPlaylistString);

      let totalBitrate = 0,
        segmentLen = 0;

      const maxBitrate = segments.reduce((max, segment, i) => {
        const SEGMENT = path.join(StreamDir, segment.uri);
        const { size } = fs.statSync(SEGMENT);

        const bitrate = Math.ceil((size * 8) / segment.duration);
        totalBitrate += bitrate;
        segmentLen += 1;

        return Math.max(max, bitrate);
      }, 0);

      const averageBandwidth = Math.floor(totalBitrate / segmentLen);

      const quality = QUALITIES[v.name];
      const resolution = {
        width: quality.resolution[0],
        height: quality.resolution[1],
      };

      const audio = this.audioRenditions.filter(
        (x) => x.groupId === quality.audioBitrate
      );

      const uri = `videos/${v.name}/main.m3u8`;
      const vs = new Variant({
        uri,
        bandwidth: Math.ceil(maxBitrate),
        averageBandwidth,
        codecs: "avc1.66.30,mp4a.40.2",
        resolution,
        audio,
      });

      this.streamVariants.push(vs);
    });
    // MASTER
    const masterPlaylist = new MasterPlaylist({
      variants: this.streamVariants,
    });
    const streams_data = HLS.stringify(masterPlaylist);
    fs.writeFileSync(mp, streams_data, "utf8");
  }
}

module.exports = CONVERSION;
