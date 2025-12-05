<script setup>
import {ref,onMounted, watch, computed} from "vue"
import {useRoute, useRouter} from "vue-router"
import axios from "axios"
import {io} from "socket.io-client"
import HighlightedText from './HighlightedText.vue'

const socket = io("https://localhost",{withCredentials:true,transports: ["websocket", "polling"]})

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
    if(lastPage.value==1 && threads.value.length<4){
      threads.value.unshift(subthread)
    }
    else if(lastPage.value==1){
      threads.value.pop()
      threads.value.unshift(subthread)
    }
})
socket.on("liked",(currLikes)=>{
  likes.value = currLikes.likes
})
socket.on("threadDeleted",(object)=>{
  threads.value = threads.value.filter((x)=>x._id !== object._id)
})
async function getThreads(page){
    const fetch = axios.get(`https://localhost/api/threads/${threadId}/${page}/${4}`,{withCredentials:true}
    ).then((res)=>{
        threads.value = res.data.threads
        thread.value = res.data.thread
        blockedUsersId.value = thread.value.blockedId
        console.log(thread.value.blockedId)
    }).catch((err)=>{
            console.log(err)
    })
}

async function addThread(){
    const fetch = axios.post(`https://localhost/api/threads/${threadId}`,{
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
  <div class="container">
    <ul v-if="!isEditing">
      <li v-for="thread2 in threads" :key="thread2._id">
        <span>{{ thread2.title }}</span>
        <span v-if="!isEditing">
          <button v-if="!blockedUsersId.includes(me._id)" @click="deleteThread(thread2._id)">Delete</button>
          <button @click="goToThread(thread2._id)">See more</button>
          <button @click="hide(thread2._id)">Hide thread</button>
        </span>
      </li>
    </ul>
    <div v-if="!isEditing">
      <button v-if="thread.parentThreadId === null" @click="goToRoot()">Go to previous thread</button>
      <button v-else @click="goToThread(thread.parentThreadId)">Go to previous thread</button>
    </div>
    <button v-if="!thread.isClosed && (me.isAdmin || thread.creatorId == me._id || (thread.modsThreadId || []).includes(me._id)) && !isEditing" @click="close()">Close thread</button>
    <button v-if="thread.isClosed && (me.isAdmin || thread.creatorId == me._id || (thread.modsThreadId || []).includes(me._id)) && !isEditing" @click="close()">Reopen thread</button>

    <div class="thread-info" v-if="!isEditing">
      <p><strong>Likes:</strong> {{ likes }}</p>
      <HighlightedText :content="thread.content" />
      <p><strong>Tags: {{ thread.tags }}</strong></p>
      <button @click="like()">Like</button>
      <button v-if="me.isAdmin || thread.creatorId === me._id" @click="setEditing()">Edit</button>
      <button style="margin-top:20px;" v-if="me.isAdmin || (thread.modsThreadId || []).includes(me._id)" @click="goToModpanel(threadId)">Manage</button>
    </div>

    <div style="margin-top: 20px;" v-if="!isEditing">
      <button @click="prevPage()">Previous</button>
      <button @click="nextPage()">Next</button>
    </div>
    <div v-if="!thread.isClosed && !blockedUsersId.includes(me._id) && !isEditing">
      <form @submit.prevent="addThread">
        <input v-model="title" placeholder="Add title" required />
        <input v-model="content" placeholder="Add content" required />
        <input v-model="tags" placeholder="Add tags" required />
        <button>Add thread</button>
      </form>
    </div>
    <div v-if="isEditing && (me.isAdmin || thread.creatorId === me._id)">
      <form @submit="editThread(thread._id)">
        <div><strong>Current title:</strong> {{ thread.title }}
        <input v-model="title" placeholder="Change title"  /></div>
        <div><strong>Current content:</strong> {{ thread.content }}
        <textarea v-model="content" placeholder="Change content"></textarea></div>
        <div><strong>Current tags:</strong> {{ thread.tags }}
        <input v-model="tags" placeholder="Change tags" /></div>
        <button>Submit editing</button>
      </form>
    </div>
  </div>
</template>

<style scoped>

body, * {
  font-family: Arial, sans-serif;
  color: #eee;
}

.container {
  background: #1b1b1b;
  padding: 20px;
  border-radius: 6px;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
}

li {
  background: #262626;
  padding: 10px 14px;
  border-radius: 4px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

button {
  background: #333;
  border: none;
  padding: 8px 14px;
  color: #eee;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 6px;
  transition: 0.2s;
}

button:hover {
  background: #444;
}

form {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

input {
  padding: 8px;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #eee;
  flex: 1;
}

input:focus {
  outline: none;
  border-color: #666;
}

.thread-info {
  margin: 15px 0;
  background: #262626;
  padding: 15px;
  border-radius: 4px;
}
</style>
