<template>
  <div class="col-md-6 box">
    <div class="roomTitle">
      <span v-if="loading"> Loading... {{roomName}}</span>
      <span v-else-if="!loading && roomName"> Connected to {{roomName}}</span>
      <span v-else>Select a room to get started</span>
    </div>

    <div class="row">
      <button @click="frontFacing()">Front</button>
      <button @click="backFacing()">Back</button>
    </div>

    <div id="video_stream">
      <div class="row remote_video_container">
        <div id="remoteTrack"></div>
      </div>
      <div class="spacing"></div>
      <div class="row">
        <div id="localTrack"></div>
      </div>
    </div>

  </div>
</template>

<script>

import Twilio, { connect, createLocalTracks, createLocalVideoTrack } from 'twilio-video'
import axios from 'axios'
import eventBus from "../Event";
import videoInterface from "@/assets/videoInterface";

export default {
  name: "Video-component",
  data() {
    return {
      loading: false,
      data: {},
      localTrack: false,
      remoteTrack: '',
      activeRoom: '',
      previewTracks: '',
      identity: '',
      roomName: null,
      participantData:[],
      VideoTrackRemote:[],
      VideoTrackLocal:[],

      recordedVideo:'',
      showModal:false,
      videoDevices:[],
      AudioDevices:[],

      videoDeviceID:'',
      AudioDeviceID:'',

      isMobile:'',

      defaultsOpts: { audio: false, video: true },
      shouldFaceUser:true,
      stream:null,
    }
  },
  props: ['username'], // props that will be passed to this component

  mounted() {
    //media select popup
    // this.showModal = true

    /**
     * check if user join using mobile device or pc.
     */
    const isMobile = (() => {
      if (typeof navigator === 'undefined' || typeof navigator.userAgent !== 'string') {
        return false; // user join using pc
      }
      return /Mobile/.test(navigator.userAgent); //user join using mobile
    })();

    this.isMobile = isMobile

    this.browserSupport()
  },

  created() {

    eventBus.$on('show_room', (room_name) => {
      console.log(room_name);
      this.createChat(room_name);
    })

    //click start video record button
    eventBus.$on('start_video_record', (status) => {
      console.log(status)
      this.startVideoRecord()
    })

    //click stop video record button
    eventBus.$on('stop_video_record',(data)=>{
      console.log(data)
      this.stopVideoRecord()
    })

    //click mute button
    eventBus.$on('mute_voice',(muteStatus)=>{
      console.log(muteStatus)
      this.muteAndUnmuteAudio(muteStatus)
    })

    eventBus.$on('switch_cam',(status)=>{
      this.showModal = true
    })

    /**
     * When a user is about to transition away from this page,
     * disconnect from the room, if joined.
     */
    window.addEventListener('beforeunload', this.leaveRoomIfJoined)

    this.getInputDevices()

  },

  methods: {

    browserSupport(){
      if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        console.log('ok, browser supports it')
      }
    },


     backFacing (){
       let supports = navigator.mediaDevices.getSupportedConstraints();
       if( supports['facingMode'] === true ) {
         console.log('disabled button-----------')
       }

       var localParticipant = this.activeRoom.localParticipant
       const tracks = Array.from(localParticipant.videoTracks.values()).map(publication => publication.track);
       this.stream = tracks
       if( this.stream == null ) return
       // we need to flip, stop everything
       this.stream.forEach(t => {
         t.stop();
       });
       // toggle / flip
       this.shouldFaceUser = !this.shouldFaceUser;
       videoInterface.captureBack()
       const cameraTrack = tracks.find(track => track.kind === 'video');
       // Switch to the back facing camera.
       cameraTrack.restart({ facingMode: 'environment' });
    },


    frontFacing(){
      let supports = navigator.mediaDevices.getSupportedConstraints();
      if( supports['facingMode'] === true ) {
        console.log('disabled button-----------')
      }

      var localParticipant = this.activeRoom.localParticipant
      const tracks = Array.from(localParticipant.videoTracks.values()).map(publication => publication.track);
      this.stream = tracks
      if( this.stream == null ) return
      // we need to flip, stop everything
      this.stream.forEach(t => {
        t.stop();
      });

      const cameraTrack = tracks.find(track => track.kind === 'video');
      // Switch to the back facing camera.
      cameraTrack.restart({ facingMode: 'user' });

      // toggle / flip
      this.shouldFaceUser = !this.shouldFaceUser;
      videoInterface.captureFront()
    },

    muteAndUnmuteAudio:function (status){
      if(status){
        this.activeRoom.localParticipant.audioTracks.forEach((publication)=>{
          publication.track.disable()
        })
      }else{
        this.activeRoom.localParticipant.audioTracks.forEach((publication)=>{
          publication.track.enable()
        })
      }

    },

    /**
     * Get the list of input devices .
     * @returns {Promise<MediaDeviceInfo[]>} the list of media devices
     */
    async getInputDevices() {

      navigator.mediaDevices.getUserMedia({audio: true, video: true})
          .then(s => {
            navigator.mediaDevices.enumerateDevices().then(devices => {
              devices.forEach(device => {
                if(device.kind  === `videoinput`){
                  this.videoDevices.push({id:device.deviceId,name:device.label})
                }
                if(device.kind  === `audioinput`){
                  this.AudioDevices.push({id:device.deviceId,name:device.label})
                }
              })
            })
          })
          .catch(error => {
            console.log('Error :', error)
          })

    },


    //start video recording
    startVideoRecord:function (){
      /**
       * send local video element & remote video element
       * to start recoding function in interface js
       */

      console.log('start video recording-------')
      var element = document.getElementById('video_stream')
      var local = document.getElementById('localTrack')
      var remote = document.getElementById('remoteTrack')

      videoInterface.startRecording(element,local.firstElementChild,remote.firstElementChild,this.VideoTrackLocal,this.VideoTrackRemote.track)

    },

    //stop video record
    stopVideoRecord:function (){
      let recordedVideo = null
      videoInterface.stopRecording(function (){
        recordedVideo = videoInterface.getRecordedBlob()
        console.log(recordedVideo)
      },true)
    },

    getRecordedBlob: function (){
      return this.recordedVideo
    },

    getVideoUrl: function (){
      return this.videoUrl
    },

    getCallDuration: function (){
      return this.videoDuration
    },

    // Generate access token
    async getAccessToken(room_name) {
      let Data = {
        identity:this.username,
        room:room_name
      }
      return await axios.post(`https://pm74.paymediasolutions.com/video-access-token-server-php/public/api/get-token`,Data);
    },

    // Trigger log events
    dispatchLog(message) {
      eventBus.$emit('new_log', message);
    },


    // Attach the Tracks to the DOM.
    attachTracks(participant, container) {
      console.log('// Attach the Tracks to the DOM.')
      let tracks = Array.from(participant.tracks.values());
      tracks.forEach(data=>{
        if(data.kind == 'video'){
          console.log(data)
          this.VideoTrackRemote = data
        }
      })

      participant.tracks.forEach(publication => {
        if (publication.isSubscribed) {
          const track = publication.track;
          container.appendChild(track.attach());
        }
      });

      participant.on('trackSubscribed', track => {
        container.appendChild(track.attach());
      });
    },

    // Attach the Participant's Tracks to the DOM.
    attachParticipantTracks(participant, container) {
      // let tracks = Array.from(participant.tracks.values());
      this.attachTracks(participant, container);
    },


    // Detach the Tracks from the DOM.
    detachTracks(participant) {
      participant.tracks.forEach(publication => {
        console.log('// Detach the Tracks from the DOM.')
        console.log(publication)
        publication.track.stop();
        const attachedElements = publication.track.detach();
        console.log(attachedElements)
        attachedElements.forEach(element => element.remove());
      });
    },

    // Detach the Participant's Tracks from the DOM.
    detachParticipantTracks(participant) {
      let tracks = Array.from(participant.tracks.values());
      this.detachTracks(tracks);
    },

    // Leave Room.
    leaveRoomIfJoined() {
      if (this.activeRoom) {
        this.activeRoom.disconnect();
      }
    },

    // Create a new chat
    createChat(room_name) {
      this.loading = true;
      const VueThis = this;

      this.getAccessToken(room_name).then( (data) => {
        VueThis.roomName = null;
        console.log(data.data)
        const token = data.data;
        let connectOptions = {
          name: room_name,
          // logLevel: 'debug',
          audio: true,
          video: { width: 400 }
        };
        // before a user enters a new room,
        // disconnect the user from they joined already
        this.leaveRoomIfJoined();

        // remove any remote track when joining a new room
        document.getElementById('remoteTrack').innerHTML = "";

        Twilio.connect(token, connectOptions).then(function(room) {
          // console.log('Successfully joined a Room: ', room);
          VueThis.dispatchLog('Successfully joined a Room: '+ room_name);

          // VueThis.showModal =true
          // navigator.mediaDevices.enumerateDevices().then(VueThis.gotDevices);

          // set active toom
          VueThis.activeRoom = room;
          VueThis.roomName = room_name;
          VueThis.loading = false;

          // Attach the Tracks of all the remote Participants.
          room.participants.forEach(function(participant) {
            let previewContainer = document.getElementById('remoteTrack');
            VueThis.attachParticipantTracks(participant, previewContainer);
          });

          // When a Participant joins the Room, log the event.
          room.on('participantConnected', function(participant) {
            VueThis.dispatchLog("Joining: '" + participant.identity + "'");
            let previewContainer = document.getElementById('remoteTrack');
            VueThis.attachTracks(participant, previewContainer);
          });

          // When a Participant adds a Track, attach it to the DOM.
          room.on('trackAdded', function(track, participant) {
            VueThis.dispatchLog(participant.identity + " added track: " + track.kind);
            let previewContainer = document.getElementById('remoteTrack');
            VueThis.attachTracks(participant, previewContainer);
          });

          // When a Participant removes a Track, detach it from the DOM.
          room.on('trackRemoved', function(track, participant) {
            VueThis.dispatchLog(participant.identity + " removed track: " + track.kind);
            VueThis.detachTracks([track]);
          });

          // When a Participant leaves the Room, detach its Tracks.
          room.on('participantDisconnected', function(participant) {
            VueThis.dispatchLog("Participant '" + participant.identity + "' left the room");
            VueThis.detachParticipantTracks(participant);
          });

          // if local preview is not active, create it
          if(!VueThis.localTrack) {

            createLocalVideoTrack().then(track => {
              let localMediaContainer = document.getElementById('localTrack');

              localMediaContainer.appendChild(track.attach());
              VueThis.localTrack = true;
              VueThis.VideoTrackLocal = track
            });
          }

        });
      })
    },


  }
}
</script>

<style >
.remote_video_container {
  left: 0;
  margin: 0;
  border: 1px solid rgb(124, 129, 124);
}
#localTrack video {
  border: 3px solid rgb(124, 129, 124);
  margin: 0px;
  max-width: 50% !important;
  background-repeat: no-repeat;
}
.spacing {
  padding: 20px;
  width: 100%;
}
.roomTitle {
  border: 1px solid rgb(124, 129, 124);
  padding: 4px;
  color: dodgerblue;
}
</style>

