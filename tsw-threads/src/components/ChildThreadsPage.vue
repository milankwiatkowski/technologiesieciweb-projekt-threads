<script setup>
import {ref,onMounted, watch, computed} from "vue"
import {useRoute, useRouter} from "vue-router"
import axios from "axios"
import {io} from "socket.io-client"
import HighlightedText from './HighlightedText.vue'
import hljs from "highlight.js"

const socket = io("https://localhost",{withCredentials:true,transports: ["websocket", "polling"]})

const tdamount = ref(0)
const route = useRoute();
const router = useRouter()
const threads = ref([])
const threadId = route.params.threadId
const title = ref('')
const content = ref('')
const me = ref({})
const likes = ref(0)
const thread = ref({})
const lastPage = ref(Number(localStorage.getItem("lastPage")) || 1)
const tags = ref('')
const isEditing = ref(false)
const blockedUsersId = ref([])
socket.on('blockedUser',(id)=>{
    blockedUsersId.value.unshift(id)
    console.log(blockedUsersId.value)
})
socket.on('unblockedUser',(id)=>{
    blockedUsersId.value = blockedUsersId.value.filter((x)=> x !== id)
    console.log(blockedUsersId.value)
})
socket.on("subthreadAdded",(subthread)=>{
    if(threads.value.length<3){
      threads.value.push(subthread)
    }
  tdamount.value+=1
})
socket.on("liked",(currLikes)=>{
  likes.value = currLikes.likes
})
socket.on("threadDeleted",(object)=>{
  threads.value = threads.value.filter((x)=>x._id !== object._id)
  tdamount.value-=1
})
async function getThreads(page){
    const fetch = axios.get(`https://localhost/api/threads/sub/${threadId}/${page}/${3}`,{withCredentials:true}
    ).then((res)=>{
        threads.value = res.data.threads
        thread.value = res.data.thread
        tdamount.value = res.data.threads.length
        blockedUsersId.value = thread.value.blockedId
        console.log(thread.value.blockedId)
    }).catch((err)=>{
            console.log(err)
    })
}

async function addThread(){
    const fetch = axios.post(`https://localhost/api/threads/subthread/${threadId}`,{
        title: title.value, content: content.value,tags:tags.value},
        {withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}

async function deleteThread(id){
    const fetch = axios.delete(`https://localhost/api/threads/${id}`,{
        withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}

async function goToThread(id){
    router.push(`/thread/${id}`)
}
async function goToRoot(){
  router.push(`/threads`)
}
async function goToModpanel(threadId){
    router.push(`/modpanel/${threadId}`)
}

async function nextPage(){
    lastPage.value++
    localStorage.setItem("lastPage",lastPage.value)
    getThreads(lastPage.value)
}

async function prevPage(){
    if(lastPage.value>1){
        lastPage.value--
        localStorage.setItem("lastPage",lastPage.value)
        getThreads(lastPage.value)
    }
}

async function getMyData(){
    const fetch = axios.get('https://localhost/api/auth/me',{withCredentials:true}).then((res)=>{
        me.value = res.data.user
        console.log(me.value._id)
    }).catch((err)=>{
        console.log(err)
    })
}
async function close(){
    const fetch = axios.post(`https://localhost/api/threads/close/${threadId}`,{},{withCredentials:true}).then(()=>{
        getThreads(lastPage.value)
    }).catch((err)=>{
        console.log(err)
    })
}
async function getLikes(){
    const fetch = axios.get(`https://localhost/api/threads/${threadId}/likes`,{withCredentials:true}).then((res)=>{
        likes.value = res.data.likes
    }).catch((err)=>{
        console.log(err)
    })
}
async function like(){
    const fetch = axios.post(`https://localhost/api/threads/${threadId}/likes`,{},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
function setEditing(){
  isEditing.value = true
}
async function hide(id){
  const fetch = axios.post(`https://localhost/api/threads/hide/${id}`,{},{withCredentials:true}).catch((err)=>{
    console.log(err)
  })
}
async function editThread(id){
    const fetch = axios.post(`https://localhost/api/threads/edit/${id}`,{
        title: title.value,
        content: content.value,
        tags: tags.value},
        {withCredentials:true}).then(()=>{
          isEditing.value = false
        }).catch((err)=>{
        console.log(err)
    })
}
onMounted(()=>{
    getThreads(lastPage.value)
    getMyData()
    getLikes()
    hljs.highlightAll()
})

watch(
  () => route.params.threadId,
  (newId) => {
    getThreads(newId)
  },
  { immediate: true }
)

</script>
<template>
  <div class="thread-container">

    <ul v-if="!isEditing" class="child-list">
      <li v-for="thread2 in threads" :key="thread2._id" class="child-item">
        <div class="child-info">
          <div class="title">{{ thread2.title }}</div>
        </div>

        <div class="child-actions">
          <button v-if="(!blockedUsersId.includes(me._id) && (thread.creatorId === me._id || thread.modsThreadId.includes(me._id)) || me.isAdmin)" class="btn delete" @click="deleteThread(thread2._id)">Delete</button>
          <button class="btn" @click="goToThread(thread2._id)">See more</button>
          <button class="btn" v-if="me.isAdmin" @click="hide(thread2._id)">Hide thread</button>
        </div>
      </li>
    </ul>

    <div v-if="!isEditing" class="back-nav">
      <button v-if="thread.parentThreadId === null" class="btn-nav" @click="goToRoot()">Go to previous thread</button>
      <button v-else class="btn-nav" @click="goToThread(thread.parentThreadId)">Go to previous thread</button>
    </div>

    <button
      v-if="!thread.isClosed && (me.isAdmin || thread.creatorId == me._id || (thread.modsThreadId || []).includes(me._id)) && !isEditing"
      class="btn-wide warn"
      @click="close()"
    >
      Close thread
    </button>

    <button
      v-if="thread.isClosed && (me.isAdmin || thread.creatorId == me._id || (thread.modsThreadId || []).includes(me._id)) && !isEditing"
      class="btn-wide"
      @click="close()"
    >
      Reopen thread
    </button>

    <div class="thread-info" v-if="!isEditing">
      <p class="likes"><strong>Likes:</strong> {{ likes }}</p>
      <HighlightedText v-if="thread.content" :text="thread.content" class="thread-content" />
      <p class="tags"><strong>Tags:</strong> {{ thread.tags }}</p>
      <div class="pagination">
        {{ tdamount }}
        <button class="btn" v-if="lastPage !== 1" @click="prevPage()">Previous page</button>
        <button class="btn" v-if="tdamount >= 3" @click="nextPage()">Next page</button>
      </div>
      <div class="thread-buttons">
        <button class="btn accent" @click="like()">Like</button>
        <button class="btn" v-if="me.isAdmin || thread.creatorId === me._id" @click="setEditing()">Edit</button>
        <button class="btn manager" v-if="me.isAdmin || (thread.modsThreadId || []).includes(me._id)" @click="goToModpanel(threadId)">Manage</button>
      </div>
    </div>

    <div v-if="!thread.isClosed && !blockedUsersId.includes(me._id) && !isEditing" class="reply-box">
      <form @submit.prevent="addThread" class="reply-form">
        <input v-model="title" placeholder="Add title" required />
        <input v-model="content" placeholder="Add content" required />
        <input v-model="tags" placeholder="Add tags" required />
        <button class="btn accent" type="submit">Add thread</button>
      </form>
    </div>

    <div v-if="isEditing && (me.isAdmin || thread.creatorId === me._id)" class="edit-box">
      <form @submit="editThread(thread._id)" class="edit-form">
        <div class="edit-group">
          <strong>Current title:</strong> {{ thread.title }}
          <input v-model="title" placeholder="Change title" />
        </div>

        <div class="edit-group">
          <strong>Current content:</strong> {{ thread.content }}
          <textarea v-model="content" placeholder="Change content"></textarea>
        </div>

        <div class="edit-group">
          <strong>Current tags:</strong> {{ thread.tags }}
          <input v-model="tags" placeholder="Change tags" />
        </div>

        <button class="btn accent" type="submit">Submit editing</button>
      </form>
    </div>

  </div>
</template>

<style scoped>
.thread-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.child-list {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
}

.child-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card);
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid var(--border);
  margin-bottom: 14px;
  transition: background-color 0.2s;
}

.child-item:hover {
  background-color: #1d1d1d;
}

.child-info .title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
}

.child-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 14px;
  background: #222;
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #333;
}

.delete {
  background: #2a0000;
  border-color: #3d0000;
}

.delete:hover {
  background: #3d0000;
}

.btn-wide {
  width: 100%;
  margin: 10px 0;
  padding: 10px;
  border-radius: 22px;
}

.warn {
  background: #580000;
  border-color: #700000;
}

.warn:hover {
  background: #700000;
}

.thread-info {
  background: var(--card);
  border: 1px solid var(--border);
  padding: 20px;
  border-radius: 18px;
  margin-top: 20px;
}

.likes {
  color: var(--text-soft);
}

.tags {
  margin-top: 12px;
  color: var(--text-soft);
}

.thread-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.manager {
  background: #111;
}

.accent {
  background: var(--accent);
  color: #000;
  border-color: var(--accent);
  font-weight: 600;
}

.accent:hover {
  opacity: 0.85;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 20px 0;
}

.btn-nav {
  padding: 10px 18px;
  background: var(--accent);
  color: #000;
  border-radius: 24px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-nav:hover {
  opacity: 0.85;
}

.reply-box,
.edit-box {
  background: var(--card);
  border: 1px solid var(--border);
  padding: 22px;
  border-radius: 18px;
  margin-top: 20px;
}

.reply-form,
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reply-form input,
.edit-form input {
  padding: 12px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text);
}

textarea {
  padding: 12px;
  min-height: 120px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text);
  resize: vertical;
}

textarea:focus,
input:focus {
  outline: none;
  border-color: #555;
}

.edit-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
