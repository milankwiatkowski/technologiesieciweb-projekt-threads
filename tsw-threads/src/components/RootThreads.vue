<script setup>
import {ref, onMounted, onUnmounted,watch} from "vue"
import {useRouter} from "vue-router"
import axios from "axios"
import { socket } from "./socket"
const router = useRouter()
import AdminChat from "./AdminChat.vue";

const tdamount = ref(0)
const threads = ref([])
const title = ref('')
const tags = ref('')
const me = ref({})
const lastPage = ref(Number(localStorage.getItem("lastRootPage")) || 1)
const adminMessages = ref([])

async function goToRootModpanel(){
    router.push(`/rootModpanel`)
}
async function getMyData(){
    const fetch = axios.get("/api/auth/me",{withCredentials:true}).then((res)=>{
        me.value = res.data.user
    }).catch((err)=>{
            console.log(err)
    })
}

async function getThreads(page){
    const fetch = axios.get(`/api/threads/root/${page}/${10}`,{withCredentials:true}).then((res)=>{
        threads.value = res.data.threads
        tdamount.value = res.data.threads.length
    }).catch((err)=>{
        console.log(err)
    })
}

async function getThreadDetails(id){
    router.push(`/thread/${id}`)
}

// async function deleteThread(id){
//     const fetch = axios.delete(`https://localhost/api/threads/delete/${id}`,{
//         withCredentials:true}).catch((err)=>{
//         console.log(err)
//     })
// }

async function addThread(){
    const fetch = axios.post('/api/threads/root/',{
        title: title.value,
        tags: tags.value},
        {withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}

async function nextPage(){
    lastPage.value++
    localStorage.setItem("lastRootPage",lastPage.value)
    getThreads(lastPage.value)
}

async function prevPage(){
    if(lastPage.value>1){
        lastPage.value--
        localStorage.setItem("lastRootPage",lastPage.value)
        getThreads(lastPage.value)
    }
}

async function hide(id){
  const fetch = axios.post(`/api/threads/hide/${id}`,{},{withCredentials:true}).catch((err)=>{
    console.log(err)
  })
}
// async function deleteMany(){
//   const fetch = axios.post('https://localhost:3000/threads/deletemany',{},{withCredentials:true}).catch((err)=>{console.log(err)})
// }
function printAdminMessage(info){
  if(adminMessages.value.length>5){
    adminMessages.value.pop()
    adminMessages.value.unshift(info)
  }
  else{
    adminMessages.value.unshift(info)
  }
}
function addThreadSocket(thread){
    if(threads.value.length<10){
      threads.value.push(thread)
    }
    tdamount.value+=1
}
function deleteThreadSocket(thread){
    threads.value = threads.value.filter((x) => x._id !== thread._id)
    tdamount.value-=1
}
onMounted(()=>{
  if (!socket.connected) socket.connect();
  socket.on("threadAdded",addThreadSocket)
  socket.on("threadDeleted",deleteThreadSocket)
  socket.on("adminMessage",printAdminMessage)
  socket.emit("thread:join",{threadId:'root'})
  getThreads(lastPage.value)
  getMyData()
})
onUnmounted(()=>{
  socket.off("adminMessage",printAdminMessage)
  socket.off("threadAdded",addThreadSocket)
  socket.off("threadDeleted",deleteThreadSocket)
  socket.emit("thread:leave",{threadId:'root'})
  localStorage.setItem("lastRootPage",1)
})
watch(lastPage, (newPage)=>{
  getThreads(newPage)
})
</script>
<template>
  <!-- <button v-if="me.isAdmin" @click="deleteMany()">Delete all threads</button> -->
  <div class="container">
    <ul v-if="threads && threads.length > 0">
      <li v-for="thread in threads" :key="thread._id">
        <div class="thread-text">
          <strong>{{ thread.title }}</strong> 
          <p>{{ thread.tags }}</p>
        </div>

        <div class="thread-actions">
          <button @click="getThreadDetails(thread._id)">See more</button>
          <!-- <button v-if="me.isAdmin || thread.creatorId === me._id" @click="deleteThread(thread._id)">Delete</button> -->
          <button class="btn" v-if="me.isAdmin" @click="hide(thread._id)">Hide thread</button>
        </div>
      </li>
    </ul>
    <button
      v-if="me.isAdmin || me.isRootMod"
      class="btn-wide warn"
      @click="goToRootModpanel()"
    >
      Go to root modpanel
  </button>
    <p v-else-if="threads && threads.length === 0">No threads.</p>
    <div>
      <div class="pagination">
        <button v-if="lastPage !== 1" @click="prevPage()">Previous page</button>
        <button v-if="tdamount >= 10" @click="nextPage()">Next page</button>
      </div>

      <div v-if="!me.isBlockedEverywhere" class="form-wrapper">
        <form @submit.prevent="addThread">
          <input v-model="title" placeholder="Add title" required />
          <input v-model="tags" placeholder="Add tags" required />
          <button type="submit">Add Thread</button>
        </form>
      </div>
    </div>
  </div>
  <AdminChat />
</template>
<style scoped>

* {
  box-sizing: border-box;
}

.container {
  background: var(--bg);
  padding: 20px;
  max-width: 700px;
  margin: 0 auto;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

li {
  display: flex;
  gap: 14px;
  padding: 18px 12px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  transition: background 0.2s;
  border-radius: 14px;
  margin-bottom: 14px;
}

li:hover {
  background: #1d1d1d;
}

.avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #333;
  flex-shrink: 0;
}

.thread-text {
  flex: 1;
}

.thread-text strong {
  font-size: 1.1rem;
  color: var(--text);
}

.thread-text p {
  margin: 6px 0;
  color: var(--text-soft);
  font-size: 0.95rem;
}

.thread-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

button {
  padding: 7px 14px;
  background: #222;
  border-radius: 20px;
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 0.85rem;
}

button:hover {
  background: #333;
}

.pagination {
  display: flex;
  gap: 10px;
  margin: 20px 0;
  justify-content: center;
}

.form-wrapper {
  margin-top: 25px;
  background: var(--card);
  padding: 18px;
  border-radius: 16px;
  border: 1px solid var(--border);
}

form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

input, textarea {
  width: 100%;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  padding: 12px;
  border-radius: 12px;
  color: var(--text);
  font-size: 0.95rem;
}

textarea {
  min-height: 120px;
  resize: vertical;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #444;
}

form button {
  width: fit-content;
  align-self: flex-end;
  background: var(--accent);
  color: #000;
  padding: 10px 18px;
  border-radius: 30px;
  font-weight: 600;
}

form button:hover {
  opacity: 0.8;
}

</style>

