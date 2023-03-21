let recorder = null
let recordedVideo = null
let videoUrl = null

let _localVideo = null
let _remoteVideo = null

let customerID = null

let isStreaming = false
let isRecording = false

let videoStartTime = new Date()
let videoEndTime = new Date()

let videoDuration = 0.0
let cameraFacingMode = 'user'

let defaultsOpts = { audio: false, video: true }
let shouldFaceUser = true;
let currentLocalVideoTrack = null;

const isMobile = (() => {
    if (typeof navigator === 'undefined' || typeof navigator.userAgent !== 'string') {
        return false;
    }
    return /Mobile/.test(navigator.userAgent);
})();

import VideoRecorder from "@/assets/VideoRecorder";

export default {

    captureBack(localVideoTrack) {
        var container = document.getElementById('localTrack')
        var video =  container.firstChild
        console.log(video)
        defaultsOpts.video = { facingMode: { exact: "environment" }  }
        console.log(defaultsOpts)

        localVideoTrack.restart(defaultsOpts.video).then(() => {
            if (!currentLocalVideoTrack) {
                currentLocalVideoTrack = localVideoTrack;
                localVideoTrack.attach(video);
            }
        });
    },

    captureFront(localVideoTrack) {
        var container = document.getElementById('localTrack')
        var video =  container.firstChild
        console.log(video)
        defaultsOpts.video = { facingMode: { exact: "user" } }
        console.log(defaultsOpts)

        localVideoTrack.restart(defaultsOpts.video).then(() => {
            if (!currentLocalVideoTrack) {
                currentLocalVideoTrack = localVideoTrack;
                localVideoTrack.attach(video);
            }
        });
    },

    startRecording: function (element,localVideoElement,remoteVideoElement, localVideo, remoteVideo){
        console.log('video interface-------------')
        console.log(remoteVideoElement)
        recorder = VideoRecorder.VideoRecorder(element,localVideoElement,remoteVideoElement, localVideo, remoteVideo)
        recorder.startRecord()

        isRecording = true
    },

    stopRecording: function (callBack, downloadVideo = false){

        recorder.stopRecord(function (){
            const url = recorder.getUrl()

            if(downloadVideo === true){
                const link = document.createElement("a");
                link.download = "vid.mp4"
                link.href = url
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            }

            recordedVideo = recorder.getBlob()
            videoUrl = url

            callBack()
        })
    },

    getRecordedBlob: function (){
        return recordedVideo
    },

    getVideoUrl: function (){
        return videoUrl
    },

    getCallDuration: function (){
        return videoDuration
    },


}
