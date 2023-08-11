# Multitube: Adaptive Video Streaming Service Demo

![Project Logo](/assets/logo.png)

## Description

This project demonstrates the internal workings of a video streaming platform similar to 'Netflix'. It takes input from a folder containing video posters, subtitles, and more. Video input API is not yet implemented. It processes these inputs to generate HLS streams for live streaming, accompanied by a master.m3u8 file. The project also provides a user interface for experiencing live streaming with multiple subtitles, audio tracks, and resolutions.

`Adaptive` here means : When playback is set to `auto`, the browser will dynamically select chunks to download based on factors such as display resolution, device hardware capabilities, and internet speed, ensuring smooth video playback.

## Features

- Video processing and HLS stream generation.
- Adaptive streaming using HLS.
- User interface for selecting subtitles, audio tracks, and resolutions.
- Seamless navigation and smooth video playback.

## Behind the scene

![Processing explained](/assets/Processing.jpg)

## video streaming vs Video file

![Streaming explained](/assets/Stream.jpg)

## Demo

Demo available in `assets/multitube_demo.mp4`

## Prerequisites

- Node.js [Download](https://nodejs.org/)
- FFmpeg [Download](https://ffmpeg.org/)

## Working

1. put poster and video file (horizontal) in `server/uploaded_videos/[video_title]` folder. you can also put some external subtitles if you want to.
2. run `server/process/index.js`. this will create stream,rendition and variants for each input file. this will take time.

## Not implemented

- [ ] API and UI for uploading video, subtitles, poster
- [ ] support for vertical video
- [ ] robust database

## Resources

[What is live streaming?](https://www.cloudflare.com/learning/video/what-is-live-streaming/)

[stream,rendition and variants in hls live streaming](https://www.perplexity.ai/search/9d38203e-fd90-4c44-bae7-1a567d503753?s=c)
