<script setup>
import axios from "axios"
import { socket } from "./socket"
import { ref,onUnmounted,onMounted, watch } from "vue"
const me = ref({})
const adminMessages = ref([])
const isHidden = ref(true)
function pushMsg(info){
  if (!me.value?.isAdmin) return

  adminMessages.value.unshift(info)
  if (adminMessages.value.length > 5) adminMessages.value.pop()
  isHidden.value = false
}
async function getMyData(){
    const fetch = axios.get("/api/auth/me",{withCredentials:true}).then((res)=>{
        me.value = res.data.user
    }).catch((err)=>{
            console.log(err)
    })
}
function adminMessageListener(){
    socket.on("adminMessage",pushMsg)
}
function detachMessageListener(){
    socket.off("adminMessage",pushMsg)
}

watch(
  ()=>me.value?.isAdmin,
  (isAdmin)=>{
    adminMessages.value = []
    detachMessageListener()
    if (isAdmin){
      if (!socket.connected) socket.connect();
        socket.emit("adminsChat:join");
        adminMessageListener();
      } 
    else {
      socket.emit("adminsChat:leave");
    }
})
onMounted(async ()=>{
  if (!socket.connected) socket.connect();
  await getMyData()
  if(me.value?.isAdmin){
    adminMessageListener()
  }
})
onUnmounted(() => {
  detachMessageListener()
})
</script>
<template>
  <div class="chat" v-if="me.isAdmin">
    <div v-if="!isHidden">
      <ul v-if="adminMessages && adminMessages.length > 0">
        <li v-for="message in adminMessages" :key="message" class="msg-item">
        <p>{{ message }}</p>
      </li>
    </ul>
    </div>
    <button v-if="isHidden==false" @click="isHidden = true">X</button>
  </div>
</template>

<style scoped>
.chat {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(22, 22, 22, 0.85);
  backdrop-filter: blur(6px);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px 18px;
  max-width: 260px;
  color: var(--text);
  font-size: 0.85rem;
  z-index: 999;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.msg-item {
  padding: 8px 10px;
  background: var(--card);
  border-radius: 10px;
  margin-bottom: 8px;
  border: 1px solid var(--border);
  transition: background-color 0.2s;
}

.msg-item:hover {
  background-color: #1d1d1d;
}

p {
  margin: 0;
  color: var(--text);
  font-size: 0.9rem;
}
</style>
