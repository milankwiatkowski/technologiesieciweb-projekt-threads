<script setup>
import {ref, onMounted} from "vue"
import {useRouter} from "vue-router"
import axios from "axios"
import {io} from "socket.io-client"
const socket = io("https://localhost",{withCredentials:true,transports: ["websocket", "polling"]})
const router = useRouter()

const threads = ref([])
const title = ref('')
const content = ref('')
const tags = ref('')
const me = ref({})
const lastPage = ref(Number(localStorage.getItem("lastRootPage")) || 1)
const adminMessages = ref([])

socket.on("threadAdded",(thread)=>{
    if(lastPage.value==1 && threads.value.length<5){
      threads.value.unshift(thread)
    }
    else if(lastPage.value==1){
      threads.value.pop()
      threads.value.unshift(thread)
    }
})
socket.on("threadDeleted",(object)=>{
  threads.value = threads.value.filter((x)=>x._id !== object._id)
})
socket.on('adminMessage',(info)=>{
  if(adminMessages.value>5){
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

async function getThreads(page){
    const fetch = axios.get(`https://localhost/api/threads/${page}/${5}`,{withCredentials:true}).then((res)=>{
        threads.value = res.data.threads
    }).catch((err)=>{
        console.log(err)
    })
}

async function getThreadDetails(id){
    router.push(`/thread/${id}`)
}

async function deleteThread(id){
    const fetch = axios.delete(`https://localhost/api/threads/${id}`,{
        withCredentials:true}).then((res)=>{
        getThreads(lastPage.value)
    }).catch((err)=>{
        console.log(err)
    })
}

async function addThread(){
    const fetch = axios.post('https://localhost/api/threads/',{
        title: title.value,
        content: content.value,
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
// async function deleteMany(){
//   const fetch = axios.post('https://localhost:3000/threads/deletemany',{},{withCredentials:true}).catch((err)=>{console.log(err)})
// }
onMounted(()=>{
    getThreads(lastPage.value)
    getMyData()
})
</script>
<template>
  <!-- <button v-if="me.isAdmin" @click="deleteMany()">Delete all threads</button> -->
  <div class="container">
    <ul v-if="threads && threads.length > 0">
      <li v-for="thread in threads" :key="thread._id">
        <div class="thread-text">
          <strong>{{ thread.title }}</strong>
          <p>{{ thread.content }}</p>
          <p>{{ thread.tags }}</p>
        </div>

        <div class="thread-actions">
          <button @click="getThreadDetails(thread._id)">See more</button>
          <button v-if="me.isAdmin || thread.creatorId === me._id" @click="deleteThread(thread._id)">Delete</button>
        </div>
      </li>
    </ul>

    <p v-else-if="threads && threads.length === 0">No threads.</p>
    <p v-else>Loading...</p>
    <div>
      <div class="pagination">
        <button v-if="lastPage !== 1" @click="prevPage()">Previous page</button>
        <button v-if="threads.length !== 0" @click="nextPage()">Next page</button>
      </div>

      <div class="form-wrapper">
        <form @submit.prevent="addThread">
          <input v-model="title" placeholder="Add title" required />
          <textarea v-model="content" placeholder="Add content" required></textarea>
          <input v-model="tags" placeholder="Add tags" required />
          <button type="submit">Add Thread</button>
        </form>
      </div>
    </div>
  </div>
</template>
<style scoped>
body, * {
  font-family: Arial, sans-serif;
  color: #eee;
}
.thread-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

textarea {
  min-height: 120px;
  white-space: pre-wrap;
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
  padding: 12px 14px;
  border-radius: 4px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  gap: 15px;
}

.thread-text p {
  margin: 4px 0 0 0;
  color: #bbb;
  font-size: 0.9rem;
}

.thread-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

button {
  background: #333;
  border: none;
  padding: 8px 14px;
  color: #eee;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.2s;
}

button:hover {
  background: #444;
}

.pagination {
  margin: 15px 0;
  display: flex;
  gap: 10px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

input {
  padding: 8px;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #eee;
}

input:focus {
  outline: none;
  border-color: #666;
}
</style>

