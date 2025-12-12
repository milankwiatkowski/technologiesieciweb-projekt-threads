<script setup>
import {ref,onMounted, watch} from "vue"
import {useRoute, useRouter} from "vue-router"
import axios from "axios"
import {io} from "socket.io-client"
const socket = io("https://localhost",{withCredentials:true,transports: ["websocket", "polling"]})

const route = useRoute();
const router = useRouter()

const threads = ref([])
const tag = route.params.tag

const me = ref({})
const lastPage = ref(Number(localStorage.getItem("lastTagPage")) || 1)

socket.on("subthreadAdded",(subthread)=>{
    if(lastPage.value==1 && threads.value.length<5){
      if(subthread.tags.includes(tag)){
        threads.value.unshift(subthread)
      }
    }
    else if(lastPage.value==1){
        if(subthread.tags.includes(tag)){
            threads.value.pop()
            threads.value.unshift(subthread)
        }
    }
})

socket.on("threadDeleted",(object)=>{
  threads.value = threads.value.filter((x)=>x._id !== object._id)
})
async function getThreads(page){
  console.log(tag)
    const fetch = axios.get(`https://localhost/api/threads/find/${tag}/${page}/${4}`,{withCredentials:true}
    ).then((res)=>{
        threads.value = res.data.threads
        console.log(res.data.threads)
    }).catch((err)=>{
            console.log(err)
    })
}

async function deleteThread(id){
    const fetch = axios.delete(`https://localhost/api/threads/${id}`,{
        withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}

async function gotoThread(id){
    router.push(`/thread/${id}`)
}

async function nextPage(){
    lastPage.value++
    localStorage.setItem("lastTagPage",lastPage.value)
    getThreads(lastPage.value)
}

async function prevPage(){
    if(lastPage.value>1){
        lastPage.value--
        localStorage.setItem("lastTagPage",lastPage.value)
        getThreads(lastPage.value)
    }
}

async function getMyData(){
    const fetch = axios.get('https://localhost/api/auth/me',{withCredentials:true}).then((res)=>{
        me.value = res.data.user
    }).catch((err)=>{
        console.log(err)
    })
}


onMounted(()=>{
    getThreads(lastPage.value)
    getMyData()
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
    <ul class="thread-list">
      <li v-for="thread in threads" :key="thread._id" class="thread-item">
        <div class="thread-info">
          <div class="title">{{ thread.title }}</div>
          <div class="likes">{{ thread.likes }}</div>
        </div>

        <div class="actions">
          <button class="btn delete" @click="deleteThread(thread._id)">Delete</button>
          <button class="btn" @click="gotoThread(thread._id)">See more</button>
        </div>
      </li>
    </ul>

    <div class="pagination">
      <button v-if="lastPage !== 1" @click="prevPage()">Previous page</button>
      <button v-if="threads.length !== 0" @click="nextPage()">Next page</button>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.thread-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.thread-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card);
  padding: 16px 18px;
  margin-bottom: 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  transition: background-color 0.2s;
}

.thread-item:hover {
  background-color: #1d1d1d;
}

.thread-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
}

.likes {
  font-size: 0.9rem;
  color: var(--text-soft);
}

.actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 14px;
  background: #222;
  color: var(--text);
  border-radius: 20px;
  border: 1px solid var(--border);
  cursor: pointer;
  font-size: 0.85rem;
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

.pagination {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.pagination button {
  padding: 10px 18px;
  background: var(--accent);
  color: #000;
  border: none;
  border-radius: 26px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.pagination button:hover {
  opacity: 0.85;
}
</style>
