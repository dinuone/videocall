<template>
  <div class="row ">
<!--    <form class="form-inline" @submit.prevent="createNewRoom(room_name)">-->
<!--      <div class="form-group mb-2">-->
<!--        <input type="text" class="form-control" v-model="room_name" >-->
<!--      </div>-->
<!--      <button type="submit" class="btn btn-primary mb-2 createRoomBotton">Create Room</button>-->
<!--    </form>-->
    <button @click="startVideRecord()" class="btn btn-primary">Start Recoding</button>
    <button @click="stopVideoRecord()" class="btn btn-danger">Stop Recording</button>
<!--    <button @click="switchCamera()" class="btn btn-dark">Switch</button>-->
    <button class="btn btn-success" @click="muteVoice()">{{ is_active ? 'Unmute' : 'Mute'}} </button>
  </div>

</template>

<script>
import eventBus from "../Event";
export default {
  name: "add-room", // Component name
  data() {
    return {
      room_name: "",
      is_active:false
    }
  },
  methods: {
    createNewRoom(name) {
      if(!name) {
        alert("please provide a room name");
        return
      }

      this.room_name = '';
      this.$emit('new_room', name);
    },

    startVideRecord(){
      eventBus.$emit('start_video_record',true);
    },
    stopVideoRecord(){
      eventBus.$emit('stop_video_record',true);
    },

    muteVoice(){
      this.is_active = this.is_active ? false : true
      eventBus.$emit('mute_voice',this.is_active)
    },

    switchCamera(){
      eventBus.$emit('switch_cam',true)
    }
  }
}
</script>

<style>
.roomForm {
  margin-left: auto;
  margin-right: auto;
  margin-top: 30px;
  width: 100%;
}
.createRoomBotton {
  color: #fff;
  background-color: #4d555f;
  border-color: #303840;
  padding: 8px;
  font-weight: bolder;
}
</style>
