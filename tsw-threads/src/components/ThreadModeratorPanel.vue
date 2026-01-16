<script setup>
import {onMounted,onUnmounted, ref,computed} from "vue"
import {useRoute} from "vue-router"
import axios from "axios"
import {io} from "socket.io-client"
const socket = io("https://localhost",{withCredentials:true,transports: ["websocket", "polling"]})
const route = useRoute()

const threadId = computed(() => route.params.threadId)
const thread = ref({})
const me = ref({})
const blockedUsersId = ref([])
async function getMyData(){
    const fetch = axios.get('https://localhost/api/auth/me',{withCredentials:true}).then((res)=>[
        me.value = res.data.user,
    ]).catch((err)=>{
        console.log(err)
    })
}

async function getThread(){
    const fetch = axios.get(`https://localhost/api/threads/sub/${threadId.value}/${1}/${10}`,{withCredentials:true}).then((res)=>{
        thread.value = res.data.thread
        blockedUsersId.value = res.data.thread.blockedId
    }).catch((err)=>{
        console.log(err)
    })
}

async function blockUser(id){
    const fetch = axios.post(`https://localhost/api/threads/${threadId.value}/block/${id}`,{},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function unblockUser(id){
    const fetch = axios.post(`https://localhost/api/threads/${threadId.value}/unblock/${id}`,{},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function giveMod(id){
    const fetch = axios.post(`https://localhost/api/threads/${threadId.value}/givemod/${id}`,{},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function takeMod(id){
    const fetch = axios.delete(`https://localhost/api/threads/${threadId.value}/givemod/${id}`,{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
function onBlockedUser(id){
    blockedUsersId.value.unshift(id)
}
function onUnblockedUser(id){
    blockedUsersId.value = blockedUsersId.value.filter((x)=> x !== id)
}
onMounted(()=>{
  getMyData()
  getThread()
  socket.on("blockedUser", onBlockedUser)
  socket.on("unblockedUser", onUnblockedUser)
})
onUnmounted(() => {
  socket.off("blockedUser", onBlockedUser)
  socket.off("unblockedUser", onUnblockedUser)
  socket.disconnect()
})
</script>

<template>
  <div class="modpanel">
    <div v-if="thread && thread.title" class="title">
      Welcome to ModPanel for Thread "{{ thread.title }}"
    </div>

    <ul v-if="thread && thread.threadAuthors" class="author-list">
      <li v-for="author in thread.threadAuthors" :key="author.id" class="author-item">
        <div class="info">
          <div class="login">{{ author.login }}</div>
          <div class="userid">{{ author.id }}</div>
        </div>

        <div class="actions">
          <button class="btn" v-if="!blockedUsersId.includes(author.id) && 
                                    !blockedUsersId.includes(me._id) &&
                                    (me.isAdmin || thread.rootModId.includes(me._id) || (thread.modsThreadId.includes(me._id) && thread.modsThreadId.includes(author.id)))" @click="blockUser(author.id)">Block user</button>
          <button class="btn" v-else-if="blockedUsersId.includes(author.id) && 
                                        !blockedUsersId.includes(me._id) &&
                                        (me.isAdmin || thread.rootModId.includes(me._id) || thread.modsThreadId.includes(me._id))" @click="unblockUser(author.id)">Unblock user</button>
          <div v-if="(thread.rootModId || thread.modsThreadId).includes(me._id) || me.isAdmin">
            <button class="btn" v-if="author.id !== me._id &&  
                                      thread.creatorId !== author.id &&
                                      me.isAdmin ||
                                      (thread.rootModId.includes(me._id) && ((thread.rootModId.includes(author.id) || thread.modsThreadId.includes(author.id)))) ||
                                      (thread.modsThreadId.includes(me._id) && !thread.rootThreadId.includes(author.id))" 
                                      @click="giveMod(author.id)" >Give mod</button>
            <button class="btn" v-else-if="author.id !== me._id &&  
                                          thread.creatorId !== author.id &&
                                          me.isAdmin ||
                                          (thread.rootModId.includes(me._id) || 
                                          (thread.modsThreadId.includes(me._id) && thread.modsThreadId.includes(author.id)))" @click="takeMod(author.id)">Take mod</button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.modpanel {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  color: var(--text);
}

.title {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 25px;
}

.author-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.author-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 14px;
  transition: background-color 0.2s;
}

.author-item:hover {
  background-color: #1d1d1d;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.login {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
}

.userid {
  font-size: 0.85rem;
  color: var(--text-soft);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  background: #222;
  color: var(--text);
  border-radius: 20px;
  border: 1px solid var(--border);
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #333;
}
</style>
