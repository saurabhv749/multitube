// Import player and styles
import { videoPlayer } from "cloudinary-video-player";
import "cloudinary-video-player/dist/cld-video-player.min.css";
// el
const video = document.querySelector("#demo-player");
const videosContainer = document.querySelector(".videos");
const videoTitle = document.querySelector(".player-title");
// vars
var mediaPlayer, videos, currentIndex, data;
const host = window.location.origin;
const colors = { base: "#005148", accent: "#AFBF73", text: "#F5DE83" };
const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
//

function fixUrls(videoData) {
  // master
  videoData["master"] = host + videoData.master;
  // subtitles
  videoData.textTracks.subtitles = videoData.textTracks.subtitles.map((sub) => {
    sub["url"] = videoData.vid + sub.url;
    return sub;
  });
  // poster
  const poster = videoData.vid + "/poster.jpg";
  const poster_url = new URL(poster, host).href;
  videoData["poster"] = poster_url;

  return videoData;
}

async function addData() {
  const response = await fetch("/api/db");
  const responseData = await response.json();
  // relative url to absolute url
  data = responseData.data.map((x) => fixUrls(x));

  data.map((x, i) => {
    videosContainer.innerHTML += `        
    <a class="video__container" data-video=${i}>
      <div class="video__thumbnail">
        <img src="${x.poster}" alt="${x.title}" />
        <span class="video__duration">${x.duration}</span>
      </div>
      <div class="video__info">
        <span>${x.title}</span>
      </div>
    </a>
    `;
  });
}

function playVideo(n) {
  const vid = data[n];
  const uri = vid.master;
  const poster = vid.poster;
  //
  mediaPlayer.source(uri, {
    sourceTypes: ["hls"],
    textTracks: vid.textTracks,
    info: {
      title: vid.title,
    },
  });

  // poster
  const posterDiv = document.querySelector(".vjs-poster");
  posterDiv.style.background = `center / contain url(${poster})`;

  // title
  videoTitle.textContent = vid.title;
  videos[n].classList.add("video-active");
  currentIndex = n;
}

function removeExtLinks() {
  // remove extras elements
  document
    .querySelector("a.vjs-control.vjs-cloudinary-button.vjs-button")
    .remove();

  document.querySelector("#demo-player").oncontextmenu = (e) => {
    const menu = document.querySelector(".vjs-menu.vjs-context-menu-ui");
    if (!menu) return;
    const listItems = menu.querySelectorAll("li");
    listItems.length === 5 && listItems[listItems.length - 1].remove();
  };
}

const removeActive = () => {
  document
    .querySelectorAll(".video-active")
    .forEach((el) => el.classList.remove("video-active"));
};

function changeVideo(e) {
  const n = +e.target.getAttribute("data-video");
  if (n === currentIndex) return;

  removeActive();
  playVideo(n);
}

function addEventListeners() {
  videos = document.querySelectorAll("a[data-video]");
  videos.forEach((l) => (l.onclick = changeVideo));
}

function init() {
  mediaPlayer = videoPlayer(video, {
    // cloud_name: "placeholder",
    html5: {
      vhs: {
        overrideNative: true,
      },
    },
    hideContextMenu: false,
    preload: "metadata",
    fluid: true,
    floatingWhenNotVisible: "right",
    fontFace: "Roboto Slab",
    // colors,
    playbackRates,
  });
  // // source

  addData().then(() => {
    removeExtLinks();
    addEventListeners();
    playVideo(0);
  });
}

document.addEventListener("DOMContentLoaded", init);
