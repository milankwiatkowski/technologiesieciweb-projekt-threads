<script setup>
import {ref,onMounted, watch} from "vue"
import {useRoute, useRouter} from "vue-router"
import axios from "axios"
import {io} from "socket.io-client"
const socket = io("http://localhost:3000",{withCredentials:true})

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
    const fetch = axios.get(`http://localhost:3000/threads/${threadId}/${page}/${4}`,{withCredentials:true}
    ).then((res)=>{
        threads.value = res.data.threads
        thread.value = res.data.thread
    }).catch((err)=>{
            console.log(err)
    })
}

async function addThread(){
    const fetch = axios.post(`http://localhost:3000/threads/${threadId}`,{
        title: title.value, content: content.value},
        {withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}

async function deleteThread(id){
    const fetch = axios.delete(`http://localhost:3000/threads/${id}`,{
        withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}

async function gotoThread(id){
    router.push(`/thread/${id}`)
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
    const fetch = axios.get('http://localhost:3000/auth/me',{withCredentials:true}).then((res)=>{
        me.value = res.data.user
    }).catch((err)=>{
        console.log(err)
    })
}
async function close(){
    const fetch = axios.post(`http://localhost:3000/threads/close/${threadId}`,{},{withCredentials:true}).then(()=>{
        getThreads(lastPage.value)
    }).catch((err)=>{
        console.log(err)
    })
}
async function getLikes(){
    const fetch = axios.get(`http://localhost:3000/threads/${threadId}/likes`,{withCredentials:true}).then((res)=>{
        likes.value = res.data.likes
    }).catch((err)=>{
        console.log(err)
    })
}
async function like(){
    const fetch = axios.post(`http://localhost:3000/threads/${threadId}/likes`,{},{withCredentials:true}).catch((err)=>{
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

    <ul>
      <li v-for="thread2 in threads" :key="thread2._id">
        <span>{{ thread2.title }}</span>
        <span>
          <button @click="deleteThread(thread2._id)">Delete</button>
          <button @click="gotoThread(thread2._id)">See more</button>
        </span>
      </li>
    </ul>
    <button v-if="!thread.isClosed" @click="close()">Close thread</button>
    <button v-if="thread.isClosed" @click="close()">Reopen thread</button>

    <div class="thread-info">
      <p><strong>Likes:</strong> {{ likes }}</p>
      <p><strong>Content:</strong> {{ thread.content }}</p>
    </div>

    <button @click="like()">Like</button>

    <div style="margin-top: 20px;">
      <button @click="prevPage()">Previous</button>
      <button @click="nextPage()">Next</button>
    </div>
    <div v-if="!thread.isClosed && !(thread.blockedId || []).includes(me._id)">
      <form @submit.prevent="addThread">
        <input v-model="title" placeholder="Add title" required />
        <input v-model="content" placeholder="Add content" required />
        <button>Add</button>
      </form>
    </div>

    <button style="margin-top:20px;" v-if="me.isAdmin || (thread.modsThreadId || []).includes(me._id)" @click="goToModpanel(threadId)">Manage</button>

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
