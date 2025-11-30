<script setup>
import {ref,onMounted, watch} from "vue"
import {useRoute, useRouter} from "vue-router"
import axios from "axios"

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

async function getThreads(page){
    const fetch = axios.get(`http://localhost:3000/threads/${threadId}/${page}/${10}`,{withCredentials:true}
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
        withCredentials:true}).then((res)=>{
            threads.value = res.data.threads
        getThreads(lastPage.value)
    }).catch((err)=>{
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
        console.log(likes.value)
    }).catch((err)=>{
        console.log(err)
    })
}
async function like(){
    const fetch = axios.post(`http://localhost:3000/threads/${threadId}/likes`,{},{withCredentials:true}).then(()=>{
        getLikes()
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

    <ul>
      <li v-for="thread in threads" :key="thread._id">
        <span>{{ thread.title }}</span>
        <span>
          <button @click="deleteThread(thread._id)">Delete</button>
          <button @click="gotoThread(thread._id)">See more</button>
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

    <div v-if="!thread.isClosed">
      <form @submit.prevent="addThread">
        <input v-model="title" placeholder="Add title" required />
        <input v-model="content" placeholder="Add content" required />
        <button>Add</button>
      </form>
    </div>

    <button style="margin-top:20px;" @click="goToModpanel(threadId)">Manage</button>

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
