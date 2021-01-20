/* eslint-disable jsx-a11y/alt-text */
import logo from './logo.svg';
import screen from './screen.svg';
import video from './video.svg';
import record from './record.svg';
import defaultImg from './default.svg';
import live from './live.svg';
import mic from './microphone.svg';
import mutedmic from './microphonemuted.svg';




import './App.css';
import { useEffect, useState } from 'react';
import 'react-notifications-component/dist/theme.css'
import { store } from 'react-notifications-component';
import ReactNotification from 'react-notifications-component'
import { useStopwatch } from 'react-timer-hook';
import ReactTooltip from 'react-tooltip';

const videoElem = document.getElementById("video");
let dataFrameHeight, dataFrameWidth
// const errorElement = document.querySelector('#errorMsg');
var canvasRecorder

/* globals MediaRecorder */

let mediaRecorder;
let recordedBlobs = [];

function App() {
  const time = new Date();
  time.setSeconds(time.getSeconds() + 36000);

  const [screenshare, setScreenshare] = useState(false)
  const [recording, setRecording] = useState(false)
  const [storing, setStoring] = useState(false)
  const [audioRecording, setAudioRecording] = useState(false)
  const [muted, setMuted] = useState(false)
  const [expanded, setExpanded] = useState("recorded")
  const [drawVideoIntervalId, setDrawVideoIntervalId] = useState('')
  const [screenShareVideoIntervalId, setDrawScreenShareIntervalId] = useState('')
  const [canvasPos, setCanvasPos] = useState({})
  const {
    minutes,
    hours,
    seconds,
    isRunning,
    start,
    reset,
    restart,
  } = useStopwatch({ expiryTimestamp: time });

  window.screenshare = screenshare
  window.recording = recording
  window.expanded = expanded


  async function startScreenRecording() {
    try {
      if (!recording) {
        setExpanded('screen')
      }
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        .then(handleSuccess, handleError);
    } catch (err) {
      console.error("Error: " + err);
    };

  }

  function canvasResize(){
    if((!screenshare && recording)||(screenshare && window.expanded !== 'screen')){
      let aspectRatio = 1.77777777778
      let xValue = (window.innerHeight-125) * aspectRatio
      let fromLeft = (window.innerWidth - xValue)/2
      if(fromLeft > 0 ){
        setCanvasPos({...canvasPos, left:fromLeft})
      }
    }
  }

  function handleSuccess(stream) {
    setScreenshare(true)
    const video = document.querySelector('video#screen');
    window.stream = stream
    video.srcObject = stream;
    if (recording) {
      clearInterval(drawVideoIntervalId);
      setDrawVideoIntervalId("")
      clearCanvas()
    }
    if (screenShareVideoIntervalId) {
      clearInterval(screenShareVideoIntervalId)
      setDrawScreenShareIntervalId("")
      clearCanvas()
    }

    let setIntervalDrawScreenShareId = window.setInterval(() => drawOnCanvas({
      recording,
      screenshare: true,
      type: "screenshare",
      aspectRatio: stream.getVideoTracks()[0].getSettings().aspectRatio,
      height: stream.getVideoTracks()[0].getSettings().height,
      width: stream.getVideoTracks()[0].getSettings().width
    }), 1000/24)
    setDrawScreenShareIntervalId(setIntervalDrawScreenShareId)
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      setScreenshare(false)
    });
  }


  function stopScreenShare() {
    const video = document.querySelector('video#screen');
    if (!recording) {
      clearInterval(screenShareVideoIntervalId)
    }
    video.srcObject.getTracks().forEach(track => track.stop())
    setScreenshare(false)
    clearCanvas()
  }

  function handleError(error) {
    store.addNotification({
      title: error.message,
      message: " ",
      type: "danger",
      insert: "top",
      container: "top-right",
      animationIn: ["animate__animated", "animate__fadeIn"],
      animationOut: ["animate__animated", "animate__fadeOut"],
      dismiss: {
        duration: 5000,
        onScreen: true
      }
    })
  }


  async function startVideoRecording(params) {
    if (!screenshare) {
      setExpanded('recorded')
    }
    const constraints = {
      audio: {
        echoCancellation: { exact: true }
      },
      video: {
        width: 1280, height: 720
      }
    };
    console.log('Using media constraints:', constraints);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      handleSuccessVideoRecording(stream);
    } catch (e) {
      setRecording(false)
      console.error('navigator.getUserMedia error:', e);
      handleError(new Error(`navigator.getUserMedia error:${e.toString()}`));
    }
  }

  function handleSuccessVideoRecording(stream) {
    setRecording(true)
    console.log('getUserMedia() got stream:', stream);
    const gumVideo = document.querySelector('video#recorded');
    gumVideo.srcObject = stream;
    window.videoHeight = stream.getVideoTracks()[0].getSettings().height;
    window.videoWidth = stream.getVideoTracks()[0].getSettings().width;
    window.aspectRatio= stream.getVideoTracks()[0].getSettings().aspectRatio;
    if (!screenshare) {
      let setIntervalDrawVideoId = window.setInterval(() => drawOnCanvas({
        recording: true,
        screenshare,
      }), 1000 / 24)
      setDrawVideoIntervalId(setIntervalDrawVideoId)
    } else {
      drawOnCanvas({
        recording: true,
        screenshare,
      })
    }
  }

  function drawOnCanvas({ aspectRatio, width, height, recording, screenshare }) {
    const canvas = window.canvas = document.querySelector('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 125;
    const recordedVideo = document.querySelector('video#recorded');
    const video = document.querySelector('video#screen');
    if (window.recording && window.screenshare) {
      if (window.expanded == 'screen') {
        canvas.getContext('2d').drawImage(video, 0, 0, width, height);
        canvas.getContext('2d').drawImage(recordedVideo, ((window.innerWidth - (1280 * 105) / 720) - 50), window.innerHeight - 125 - 150, (1280 * 105) / 720, 105);
      } else {
        let xValue = (window.innerHeight-125) * window.aspectRatio
        let yValue =  window.innerHeight-125;
        let fromLeft = (window.innerWidth - xValue)/2
        fromLeft =  fromLeft > 0 ? fromLeft : 0 
        canvas.getContext('2d').drawImage(recordedVideo, fromLeft, 0, xValue, yValue);
        canvas.getContext('2d').drawImage(video, ((window.innerWidth - (1280 * 105) / 720) - 50) ,window.innerHeight - 125 - 150,  (width * 105) / (height), 105);
      }
    }
    else {
      if (window.recording) {
        let xValue = (window.innerHeight-125) * window.aspectRatio
        let yValue =  window.innerHeight-125;
        let fromLeft = (window.innerWidth - xValue)/2
        fromLeft =  fromLeft > 0 ? fromLeft : 0 
        canvas.getContext('2d').drawImage(recordedVideo, fromLeft, 0, xValue, yValue);
      }
      if (window.screenshare) {
        canvas.getContext('2d').drawImage(video, 0, 0, width, height);
      }
    }
  }

  function clearCanvas() {
    const context = window.canvas.getContext('2d');
    context.clearRect(0, 0, window.canvas.width, window.canvas.height);
  }

  function stopVideoRecording() {
    const video = document.querySelector('video#recorded');
    if (drawVideoIntervalId) {
      clearInterval(drawVideoIntervalId)
    }
    video.srcObject.getTracks().forEach(track => track.stop())
    setRecording(false)
    clearCanvas()
  }


  function handleDataAvailable(event) {
    console.log('handleDataAvailable', event);
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
    }
  }

  function recordAudio() {
    // if (recorder && recorder.state == "recording") {
    //     recorder.stop();
    //     audioStream.getAudioTracks()[0].stop();
    // } else {
        navigator.mediaDevices.getUserMedia({
            audio: true,
            echoCancellation: { exact: true }
        }).then(function(stream) {
            window.audioStream = stream;
        });
    // }
  }

  function muteAudio(){
    if(audioRecording){
      window.audioStream.getAudioTracks()[0].enabled = !muted;
      setMuted(!muted)
    }
  }

  useEffect(() => {
    recordAudio()
    setAudioRecording(true)
    canvasResize()
  }, [])


  useEffect(() => {
    canvasResize()
  }, [recording, screenshare, expanded])

  window.addEventListener('resize', canvasResize)

  function startRecording() {
    recordedBlobs = []
    let options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.error(`${options.mimeType} is not supported`);
      options = { mimeType: 'video/webm;codecs=vp8,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported`);
        options = { mimeType: 'video/webm' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.error(`${options.mimeType} is not supported`);
          options = { mimeType: '' };
        }
      }
    }

    try {
      let stream = window.canvas.captureStream();
      let mixedStream  = new MediaStream([window.audioStream.getAudioTracks()[0], stream.getVideoTracks()[0]]);
      mediaRecorder = new MediaRecorder(mixedStream, options);
    } catch (e) {
      console.error('Exception while creating MediaRecorder:', e);
      handleError(new Error(`Exception while creating MediaRecorder: ${JSON.stringify(e)}`))
      return;
    }

    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
    mediaRecorder.onstop = (event) => {
      console.log('Recorder stopped: ', event);
      console.log('Recorded Blobs: ', recordedBlobs);
      const blob = new Blob(recordedBlobs, { type: 'video/webm' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'test.webm';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      setStoring(false)
      reset()
    };
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    setStoring(true)
    console.log('MediaRecorder started', mediaRecorder);
    start()
  }

  function stopRecording() {
    mediaRecorder.stop();
  }

  const OPTIONS = { delay: 100 }


  return (
    <div className="App" >
      <ReactNotification />
      <header className="App-header" id="content" style={{overflow:"hidden"}}>
        {(!recording && !screenshare) ? <div style={{ marginTop: -115 }}>
          <img src={defaultImg} width="400px" height="auto" />
          <div className="circular text-center" style={{ marginTop: 30 }}>
            You are not sharing anything
          </div>
        </div> : null}
        <div className="overlay" style={{ background: (recording || screenshare) ? "#f5f5f538" : "whitesmoke" }}>

        </div>
        <div className="action-buttons">
          <div data-tip data-for='shareScreen' onClick={() => screenshare ? stopScreenShare() : startScreenRecording()} className="circular start" id={screenshare ? "stop" : "start"}>
            <img src={screen} width="30px" height="30px" className="v-middle" />
          </div>

          <ReactTooltip id='shareScreen' type='dark' place="top" effect='solid'>
            <span className="circular" style={{ fontSize: 15 }}>{screenshare ? "Stop screen" : "Share screen"}</span>
          </ReactTooltip>

          <div data-tip data-for='recording' onClick={() => recording ? stopVideoRecording() : startVideoRecording()} className="circular start2" id={recording ? "stop" : "start"}>
            <img src={video} width="30px" height="30px" className="v-middle" />
          </div>
          <ReactTooltip id='recording' type='dark' place="top" effect='solid'>
            <span className="circular" style={{ fontSize: 15 }}>{recording ? " Stop video" : "Share video"}</span>
          </ReactTooltip>

          <div data-tip data-for='audio' onClick={() => muteAudio()} className={`circular start3`} id={!muted ? "stop" : "start"}>
            <img src={!muted ? mic: mutedmic} width="30px" height="30px" className="v-middle" />
          </div>

          <ReactTooltip id='audio' type='dark' place="top" effect='solid'>
            <span className="circular" style={{ fontSize: 15 }}>{!muted ? "Mute micophone" : "Unmute micophone"}</span>
          </ReactTooltip>

          <div data-tip data-for='storing' onClick={() => storing ? stopRecording(true) : startRecording()} className={`circular start3 ${!recording && !screenshare && !storing ? "disabled" : null}`} id={storing ? "stop" : "start"}>
            <img src={record} width="30px" height="30px" className="v-middle" />
          </div>

          <ReactTooltip id='storing' type='dark' place="top" effect='solid'>
            <span className="circular" style={{ fontSize: 15 }}>{storing ? "Stop recording" : "Start recording"}</span>
          </ReactTooltip>


        </div>
        <video id="screen" className={`${expanded == "recorded" && "bottom-right"}`} autoPlay playsInline muted style={{ position: "absolute", visibility: "hidden", height: 0 }}></video>
        <video id="recorded" className={`${expanded == "screen" && "bottom-right"}`} playsInline autoPlay muted style={{ position: "absolute", visibility: "hidden", height: 0 }}></video>
        <div id="errorMsg"></div>
        {screenshare && recording &&  <div style={{ right: 20, top: 20, zIndex: 22 }} className="switch v-middle" onClick={() => setExpanded(expanded == "screen" ? "recorded" : "screen")}>
          <div className="switch-div">
            <img src="https://image.flaticon.com/icons/svg/125/125868.svg" width="20px" height="20px" className="v-middle" style={{marginRight:10, marginLeft:3}} />
            <span className="circular v-middle" style={{ fontSize: 17, marginTop:-1 }}>Switch views</span>
          </div>
        </div>}

        {storing && <div id="animate-flicker" style={{ left: 20, top: 8, zIndex: 22, position: "fixed" }} title="Recording">
          <img src={live} width="50px" height="50px" className="v-middle" />
        </div>}
        <canvas style={{ zIndex:10, position: (!recording && !screenshare) ? "absolute" :  (!screenshare && recording)||(screenshare && window.expanded !== 'screen') ? "absolute":"null", /*left: window.expanded !== 'screen' && canvasPos.left,*/ top:0 }}></canvas>
        {storing && <div className="timer circular" style={{ color: "#f3f1f1" }}>
          <div style={{ display: "inline-block" }}>{hours <= 9 ? "0" + hours : hours}:</div><div style={{ display: "inline-block" }}>{minutes <= 9 ? <span>0{minutes}</span> : minutes}:</div>
          <div style={{ display: "inline-block" }}>{seconds <= 9 ? "0" + seconds : seconds}</div>
        </div>
        }
      </header>
    </div >
  );
}


export default App;
