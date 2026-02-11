<script setup>
import {onMounted,onUnmounted, ref,computed} from "vue"
import {useRoute} from "vue-router"
import axios from "axios"
import { socket } from "./socket"
const route = useRoute()
import AdminChat from "./AdminChat.vue";

const threadId = computed(() => route.params.threadId)
const thread = ref({})
const me = ref({})
const blockedUsersId = ref([])
const blockedUsersIdUp = ref([])

const rootModIds = computed(() => (thread.value.rootModId || []).map(String))
const modIds     = computed(() => (thread.value.modsThreadId || []).map(String))
const myId       = computed(() => String(me.value._id || ""))
const blockedIds = computed(() => (blockedUsersId.value || []).map(String))

async function getMyData(){
    const fetch = axios.get('/api/auth/me',{withCredentials:true}).then((res)=>[
        me.value = res.data.user,
    ]).catch((err)=>{
        console.log(err)
    })
}

async function getThread(){
    const fetch = axios.get(`/api/threads/sub/${threadId.value}/${1}/${10}`,{withCredentials:true}).then((res)=>{
        thread.value = res.data.thread
        blockedUsersId.value = res.data.thread.blockedId

    }).catch((err)=>{
        console.log(err)
    })
}

async function blockUser(id){
    const fetch = axios.post(`/api/threads/${threadId.value}/block/${id}`,{},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function unblockUser(id){
    const fetch = axios.post(`/api/threads/${threadId.value}/unblock/${id}`,{},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function giveMod(id){
    const fetch = axios.post(`/api/threads/${threadId.value}/givemod/${id}`,{},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function takeMod(id){
    const fetch = axios.delete(`/api/threads/${threadId.value}/givemod/${id}`,{withCredentials:true}).catch((err)=>{
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
  if (!socket.connected) socket.connect();
  getMyData()
  getThread()
  socket.emit("thread:join", { threadId: threadId.value })
  socket.on("blockedUser", onBlockedUser)
  socket.on("unblockedUser", onUnblockedUser)
})
onUnmounted(() => {
  socket.off("blockedUser", onBlockedUser)
  socket.off("unblockedUser", onUnblockedUser)
  socket.emit("thread:leave", { threadId: threadId.value })
})
</script>

<template>
  <div class="modpanel" v-if="!me.isBlockedEverywhere">
    <div v-if="thread && thread.title" class="title">
      Welcome to ModPanel for Thread "{{ thread.title }}"
    </div>
    <ul v-if="thread && thread.threadAuthors && (me.isAdmin || me.isRootMod || rootModIds.includes(myId) || modIds.includes(myId))" class="author-list">
      <div>Blocked users:</div>  
      <li v-for="buser in blockedIds" :key="buser" class="author-item">
          <div class="info">
            <div class="userid">{{ buser }}</div>
            <button class="btn" v-if="buser?.toString?.() !== myId &&
                                        !blockedIds.includes(String(myId)) &&
                                        (me.isAdmin || rootModIds.includes(myId) || modIds.includes(myId))" @click="unblockUser(buser)">Unblock user</button>
          </div>
        </li>
      <div>All thread authors:</div>
      <li v-for="author in thread.threadAuthors" :key="author.id" class="author-item">
        <div class="info">
          <div class="login">{{ author.login }}</div>
          <div class="userid">{{ author.id }}</div>
                                                    <!-- <button @click="blockUser(author.id)">Zablokuj</button>
                                          <button @click="unblockUser(author.id)">Odblokuj</button>
                                          <button @click="giveMod(author.id)">Daj moda</button>
                                          <button @click="takeMod(author.id)">Zabierz moda</button> -->
        </div>

        <div class="actions" v-if="!blockedIds.includes(String(author.id))">
          <button class="btn" v-if="author.id?.toString?.() !== myId &&
                                    thread.creatorId !== author.id &&
                                    !blockedIds.includes(String(author.id)) && 
                                    !blockedIds.includes(String(me._id)) &&
                                    (me.isAdmin || rootModIds.includes(myId) || (modIds.includes(myId) && !rootModIds.includes(String(author.id))))" @click="blockUser(author.id)">Block user</button>
          <!-- <button class="btn" v-else-if="author.id.toString() !== me._id.toString() && 
                                        blockedUsersId.includes(author.id) && 
                                        !blockedUsersId.includes(me._id) &&
                                        (me.isAdmin || thread.rootModId.includes(me._id) || thread.modsThreadId.includes(me._id))" @click="unblockUser(author.id)">Unblock user</button> -->
          <div v-if="rootModIds.includes(myId) || modIds.includes(myId) || me.isAdmin">
            <button class="btn" v-if="author.id?.toString?.() !== myId?.toString?.() &&  
                                      !blockedIds.includes(String(myId)) &&
                                      !blockedIds.includes(String(author.id)) &&
                                      (!rootModIds.includes(String(author.id)) && !modIds.includes(String(author.id))) &&
                                      thread.creatorId !== author.id &&
                                      (me.isAdmin || rootModIds.includes(myId) || (modIds.includes(myId)))" 
                                      @click="giveMod(author.id)" >Give mod</button>
            <button class="btn" v-else-if="author?.id?.toString?.() !== me._id?.toString?.() &&  
                                          thread.creatorId !== author.id &&
                                          (rootModIds.includes(String(author.id)) || modIds.includes(String(author.id))) &&
                                          !blockedIds.includes(String(myId)) &&
                                          (
                                            me.isRootMod || 
                                            me.isAdmin ||
                                            rootModIds.includes(myId) || 
                                            (modIds.includes(myId) && modIds.includes(String(author.id))))" @click="takeMod(author.id)">Take mod</button>
          </div>
        </div>
      </li>
    </ul>
  </div>
  <AdminChat />
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
