import { MutableRefObject, useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const videoRef = useRef() as MutableRefObject<HTMLVideoElement>;
  const videoContainer = useRef() as MutableRefObject<HTMLDivElement>;
  const volumeSlider = useRef() as MutableRefObject<HTMLInputElement>;
  const currentTime = useRef() as MutableRefObject<HTMLDivElement>;
  const TotalTime = useRef() as MutableRefObject<HTMLDivElement>;
  const playBackSpeed = useRef() as MutableRefObject<HTMLButtonElement>;
  const timelineContainer = useRef() as MutableRefObject<HTMLDivElement>;
  const isScrubbing = useRef() as MutableRefObject<boolean>;



  useEffect(() => {

    window.addEventListener("keydown", onKeyPress)
    window.addEventListener("mouseup", checkScrubbing)
    window.addEventListener("mousemove", checkIsMoving)

    return () => {
      window.removeEventListener('keydown', onKeyPress)
      window.removeEventListener('mouseup', checkScrubbing)
      window.removeEventListener('mousemove', checkIsMoving)
    }
  }, [])

  const checkScrubbing = (e: any) => {
    if (isScrubbing.current) toggleScrubbing(e as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>)
  }

  const checkIsMoving = (e: any) => {
    if (isScrubbing.current) toggleScrubbing(e as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>)
  }


  function toggleTheaterMode() {
    setIsTheaterMode((prev) => {
      return !prev;
    })
  }

  function toggleFullScreen() {
    if (document.fullscreenElement === null) {
      videoContainer.current?.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }

  }

  function toggleMiniPlayer() {
    if (videoContainer.current?.classList.contains("mini-player")) {
      setIsMiniPlayer(false);
      document.exitPictureInPicture();
    } else {
      videoRef.current?.requestPictureInPicture();
      setIsMiniPlayer(true);
    }
  }

  function togglePlay() {
    setIsPlaying((prev) => {
      return !prev;
    })
    videoRef.current?.paused ? videoRef.current?.play() : videoRef.current?.pause();
  }

  function toggleMute() {
    videoRef.current.muted = !videoRef.current.muted;
  }

  // This is for slider
  function volumeInputChangeHandler(e: React.ChangeEvent<HTMLInputElement>) {
    videoRef.current.volume = Number(e.target.value);
    const isMutedBySlider: boolean = e.target.value === "0";
    videoRef.current.muted = isMutedBySlider;
  }

  // This is event triggered by the videoElement
  function onVolumeChange() {
    volumeSlider.current.value = videoRef.current.volume.toString();
    let volumeLevel;
    if (videoRef.current.muted || videoRef.current.volume === 0) {
      volumeSlider.current.value = "0"
      volumeLevel = "muted";
    } else if (videoRef.current.volume > 0.5) {
      volumeLevel = "high";
    } else {
      volumeLevel = "low";
    }

    videoContainer.current.dataset.volumeLevel = volumeLevel;
  }

  function onKeyPress(ev: KeyboardEvent) {
    const tagName = document.activeElement?.tagName.toLowerCase();
    if (tagName === "input") return;

    switch (ev.key.toLowerCase()) {
      case " ":
      case "k":
        togglePlay();
        break;
      case "f":
        toggleFullScreen();
        break
      case "t":
        toggleTheaterMode();
        break;
      case "i":
        toggleMiniPlayer();
        break;
      case "m":
        toggleMute();
        break;
      case "arrowleft":
        skip(-1);
        break;
      case "arrowright":
        skip(1);
        break;
      default:
      //do nothing  
    }
  }

  const leadingZerosFormatter = new Intl.NumberFormat(undefined, {
    minimumIntegerDigits: 2,
  })

  function format(time: number): string {
    const seconds = Math.floor(time % 60);
    const minutes = Math.floor(time / 60) % 60;
    const hours = Math.floor(time / 3600);
    if (hours === 0) {
      return `${minutes}:${leadingZerosFormatter.format(seconds)}`
    } else {
      return `${hours}:${leadingZerosFormatter.format(minutes)}:${leadingZerosFormatter.format(seconds)}`
    }
  }

  function videoOnLoad() {
    TotalTime.current.textContent = format(videoRef.current.duration);
  }

  function onTimeUpdate() {
    currentTime.current.textContent = format(videoRef.current.currentTime);
    const percent = videoRef.current.currentTime / videoRef.current.duration;
    timelineContainer.current.style.setProperty("--progress-position", `${percent}`);
  }

  function skip(skipping: number) {
    videoRef.current.currentTime += skipping;
  }

  function changePlayBackSpeed() {
    let newPlaybackRate = videoRef.current.playbackRate + 0.25;
    if (newPlaybackRate > 2) newPlaybackRate = 0.25;
    videoRef.current.playbackRate = newPlaybackRate;
    playBackSpeed.current.textContent = `${newPlaybackRate}x`;
  }

  function toggleScrubbing(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const rect = timelineContainer.current.getBoundingClientRect();
    const percent = Math.min(Math.max(0, e.clientX - rect.x), rect.width) / rect.width;
    isScrubbing.current = (e.buttons & 1) === 1;
    if (isScrubbing.current) {
      videoRef.current.pause();
    } else {
      videoRef.current.currentTime = percent * videoRef.current.duration;
      videoRef.current.play();
    }

    handleTimelineUpdate(e);
  }

  function handleTimelineUpdate(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    // console.log("handletimelineupdate")
    const rect = timelineContainer.current.getBoundingClientRect();
    const percent = Math.min(Math.max(0, e.clientX - rect.x), rect.width) / rect.width;
    //get preview Image
    timelineContainer.current.style.setProperty("--preview-position", `${percent}`);
    if (isScrubbing.current) {
      e.preventDefault();
      timelineContainer.current.style.setProperty("--progress-position", `${percent}`);
    }
  }



  return <>
    <div
      ref={videoContainer}
      data-volume-level="high"
      className={
        `video-container 
      ${isPlaying ? "" : "paused"}
      ${isTheaterMode ? "theater" : ""}
      ${isFullScreen ? "full-screen" : ""}
      ${isMiniPlayer ? "mini-player" : ""}
      `}
    >
      <div className="video-controls-container">
        <div className="timeline-container"
          onMouseMove={(e) => { handleTimelineUpdate(e) }}
          onMouseDown={(e) => { toggleScrubbing(e) }}
          onMouseUp={(e) => { toggleScrubbing(e) }}
          ref={timelineContainer}
        >
          <div className="timeline"
          >
            <img className="preview-image" />
            <div className="thumb-indicator"></div>
          </div>
        </div>
        <div className="controls">
          <button className="play-pause-btn"
            onClick={togglePlay}

          >
            <svg className="play-icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
            </svg>
            <svg className="pause-icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M14,19H18V5H14M6,19H10V5H6V19Z" />
            </svg>
          </button>
          <div className="volume-container">
            <button className="mute-btn"
              onClick={toggleMute}>
              <svg className="volume-high-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z" />
              </svg>
              <svg className="volume-low-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M5,9V15H9L14,20V4L9,9M18.5,12C18.5,10.23 17.5,8.71 16,7.97V16C17.5,15.29 18.5,13.76 18.5,12Z" />
              </svg>
              <svg className="volume-muted-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z" />
              </svg>
            </button>
            <input className="volume-slider"
              ref={volumeSlider}
              type="range"
              min={0}
              max={1}
              step={"any"}
              onChange={(e) => { volumeInputChangeHandler(e) }}
            ></input>
          </div>
          <div className="duration-container">
            <div className="current-time" ref={currentTime}>0:00</div>
            /
            <div className="total-time" ref={TotalTime}></div>
          </div>
          <button className="speed-btn wide-btn" onClick={changePlayBackSpeed} ref={playBackSpeed}> 1x </button>
          <button className="mini-player-btn"
            onClick={toggleMiniPlayer}
          >
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-10-7h9v6h-9z" />
            </svg>
          </button>
          <button className="theater-btn"
            onClick={toggleTheaterMode}>
            <svg className="tall" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z" />
            </svg>
            <svg className="wide" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 7H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H5V9h14v6z" />
            </svg>
          </button>
          <button className="full-screen-btn"
            onClick={toggleFullScreen}
          >
            <svg className="open" viewBox="0 0 24 24">
              <path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            </svg>
            <svg className="close" viewBox="0 0 24 24">
              <path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
            </svg>
          </button>
        </div>
      </div>
      <video
        src="./src/assets/Tom and Jerry - Professor Tom.mp4"
        ref={videoRef}
        onVolumeChange={onVolumeChange}
        onLoadedData={videoOnLoad}
        onTimeUpdate={onTimeUpdate}
        onPause={() => { setIsPlaying(false) }}
        onPlay={() => { setIsPlaying(true) }}
      ></video>
    </div >
  </>
}

export default App
