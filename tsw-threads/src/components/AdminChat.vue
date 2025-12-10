<script setup>
import axios from "axios"
import {io} from "socket.io-client"
import { ref,onMounted } from "vue"
const socket = io("https://localhost",{withCredentials:true,transports: ["websocket", "polling"]})
const me = ref({})
const adminMessages = ref([])

socket.on('adminMessage',(info)=>{
  if(adminMessages.value.length==5){
    adminMessages.value.pop()
    adminMessages.value.unshift(info)
  }
  else{
    adminMessages.value.unshift(info)
  }
})

socket.on('userAction',(info)=>{
  if(adminMessages.value.length==5){
    adminMessages.value.pop()
    adminMessages.value.unshift(info)
  }
  else{
    adminMessages.value.unshift(info)
  }
})

async function getMyData(){
    const fetch = axios.get("https://localhost/api/auth/me",{withCredentials:true}).then((res)=>{
        me.value = res.data.user
    }).catch((err)=>{
            console.log(err)
    })
}
onMounted(()=>{
    getMyData()
})
</script>
<template>
  <div class="chat" v-if="me.isAdmin">
    <ul v-if="adminMessages && adminMessages.length > 0">
      <li v-for="message in adminMessages" :key="message" class="msg-item">
        <p>{{ message }}</p>
      </li>
    </ul>
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
