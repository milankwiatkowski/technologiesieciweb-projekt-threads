<script setup>
import {ref,onMounted, watch} from "vue"
import {useRoute, useRouter} from "vue-router"
import axios from "axios"
import {io} from "socket.io-client"
const socket = io("http://backend:3000",{withCredentials:true})

const route = useRoute();
const router = useRouter()

const threads = ref([])
const tag = route.params.tag

const me = ref({})
const lastPage = ref(Number(localStorage.getItem("lastPage")) || 1)

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
    const fetch = axios.get(`http://backend:3000/threads/find/${tag}/${page}/${4}`,{withCredentials:true}
    ).then((res)=>{
        threads.value = res.data.threads
    }).catch((err)=>{
            console.log(err)
    })
}

async function deleteThread(id){
    const fetch = axios.delete(`http://backend:3000/threads/${id}`,{
        withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}

async function gotoThread(id){
    router.push(`/thread/${id}`)
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
    const fetch = axios.get('http://backend:3000/auth/me',{withCredentials:true}).then((res)=>{
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

    <ul>
      <li v-for="thread in threads" :key="thread._id">
        <span>{{ thread.title }}</span>
        <span>{{ thread.likes }}</span>
        <span>
          <button @click="deleteThread(thread._id)">Delete</button>
          <button @click="gotoThread(thread._id)">See more</button>
        </span>
      </li>
    </ul>
    <div class="pagination">
      <button v-if="lastPage !== 1" @click="prevPage()">Previous page</button>
      <button v-if="threads.length !== 0" @click="nextPage()">Next page</button>
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
.pagination {
  margin: 15px 0;
  display: flex;
  gap: 10px;
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
