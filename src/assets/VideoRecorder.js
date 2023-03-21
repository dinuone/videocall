import {VideoStreamMerger} from "video-stream-merger";
export default {

 VideoRecorder:function (element,localVideoElement,remoteVideoElement, localVideo, remoteVideo, fps = 30) {
   console.log('local video------------')
   console.log(localVideo)
   console.log('remote video--------------')
   console.log(remoteVideo)
   console.log('element---------------')
   console.log(element)

    let merger = null;
    let mediaRecorder = null;
    let chunks = []
    let url = ""
    let blob = null
    let stopCallBack = null

    let isRecordingStarted = false
    let isStoppedRecording = false

    let isFirefox = false
    const sUsrAg = navigator.userAgent;
    if (sUsrAg.indexOf('Firefox') > -1) isFirefox = true

    return {
        startRecord: function () {
            const localVideoRatio = localVideo.dimensions.height / localVideo.dimensions.width
            const remoteVideoRatio = remoteVideo.dimensions.height / remoteVideo.dimensions.width

            const lvh = 100
            const lvw = lvh / localVideoRatio

            const rvh = 100
            const rvw = rvh / remoteVideoRatio

            console.log(`lvh : ${lvh} | lvw : ${lvw}`)
            console.log(`rvh : ${rvh} | rvw : ${rvw}`)

            const VIDEO_WIDTH = lvw + rvw + 50
            const VIDEO_HEIGHT = rvh + 50

            merger = new VideoStreamMerger({
                width: VIDEO_WIDTH,
                height: VIDEO_HEIGHT
            })

            let localStream, remoteStream

            if (isFirefox) {
                localStream = localVideoElement.mozCaptureStream()
                remoteStream = remoteVideoElement.mozCaptureStream()
            } else {
                localStream = localVideoElement.captureStream()
                remoteStream = remoteVideoElement.captureStream()
            }

            console.log(localStream)
            console.log(remoteStream)


            merger.addStream(localStream, {
                x: 25, // position of the topleft corner
                y: 25,
                width: lvw,
                height: lvh,
                mute: false // we don't want sound from the screen (if there is any)
            })

            merger.addStream(remoteStream, {
                x: lvw +50, // position of the topleft corner
                y: 25,
                width: rvw,
                height: rvh,
                mute: false // we don't want sound from the screen (if there is any)
            })

            merger.start()
            mediaRecorder = new MediaRecorder(merger.result);
            mediaRecorder.ondataavailable = this.mediaRecorder_onDataAvailable
            mediaRecorder.onstop = this.mediaRecorder_onStop

            mediaRecorder.start();
            console.log(mediaRecorder.state);
            console.log("recorder started");

            isRecordingStarted = true
            isStoppedRecording = false
        },

        stopRecord: function (callBack) {
            stopCallBack = callBack
            mediaRecorder.stop();
            console.log(mediaRecorder.state);
            console.log("recorder stopped");
        },

        getUrl: function () {
            return url
        },

        getBlob: function () {
            return blob
        },

        mediaRecorder_onStop: function (e) {
            console.log("data available after MediaRecorder.stop() called.");
            blob = new Blob(chunks, {'type': 'audio/ogg; codecs=opus'});
            chunks = [];
            url = window.URL.createObjectURL(blob);
            console.log("recorder stopped");

            isRecordingStarted = false
            isStoppedRecording = true

            stopCallBack()
        },

        mediaRecorder_onDataAvailable: function (e) {
            console.log('data available')
            chunks.push(e.data);
        }
    }

},




}

