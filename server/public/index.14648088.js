    <a class="video__container" data-video=${t}>
      <div class="video__thumbnail">
        <img src="${e.poster}" alt="${e.title}" />
        <span class="video__duration">${e.duration}</span>
      </div>
      <div class="video__info">
        <span>${e.title}</span>
      </div>
    </a>
    `})}function v(i){let o=n[i],u=o.master,l=o.poster;e.source(u,{sourceTypes:["hls"],textTracks:o.textTracks,info:{title:o.title}});let c=document.querySelector(".vjs-poster");c.style.background=`center / contain url(${l})`,p.textContent=o.title,t[i].classList.add("video-active"),r=i}const b=()=>{document.querySelectorAll(".video-active").forEach(e=>e.classList.remove("video-active"))};function _(e){let t=+e.target.getAttribute("data-video");t!==r&&(b(),v(t))}document.addEventListener("DOMContentLoaded",function(){e=(0,f.videoPlayer)(d,{html5:{vhs:{overrideNative:!0}},hideContextMenu:!1,preload:"metadata",fluid:!0,floatingWhenNotVisible:"right",fontFace:"Roboto Slab",playbackRates:g}),y().then(()=>{document.querySelector("a.vjs-control.vjs-cloudinary-button.vjs-button").remove(),document.querySelector("#demo-player").oncontextmenu=e=>{let t=document.querySelector(".vjs-menu.vjs-context-menu-ui");if(!t)return;let r=t.querySelectorAll("li");5===r.length&&r[r.length-1].remove()},(t=document.querySelectorAll("a[data-video]")).forEach(e=>e.onclick=_),v(0)})});