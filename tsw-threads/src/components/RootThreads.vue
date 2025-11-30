<script setup>
import {ref, onMounted} from "vue"
import {useRouter} from "vue-router"
import axios from "axios"

const router = useRouter()

const threads = ref([])
const title = ref('')
const content = ref('')

const lastPage = ref(Number(localStorage.getItem("lastRootPage")) || 1)

async function getThreads(page){
    const fetch = axios.get(`http://localhost:3000/threads/${page}/${10}`,{withCredentials:true}).then((res)=>{
        threads.value = res.data.threads
        console.log(threads.value)
    }).catch((err)=>{
        console.log(err)
    })
}

async function getThreadDetails(id){
    router.push(`/thread/${id}`)
}

async function deleteThread(id){
    const fetch = axios.delete(`http://localhost:3000/threads/${id}`,{
        withCredentials:true}).then((res)=>{
        getThreads()
    }).catch((err)=>{
        console.log(err)
    })
}

async function addThread(){
    const fetch = axios.post('http://localhost:3000/threads/',{
        title: title.value,
        content: content.value},
        {withCredentials:true}).then((res)=>{
        threads.value = res.data.threads
    }).catch((err)=>{
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

onMounted(()=>{
    getThreads(lastPage.value)
})
</script>
<template>
  <div class="container">

    <ul v-if="threads && threads.length > 0">
      <li v-for="thread in threads" :key="thread._id">
        <div class="thread-text">
          <strong>{{ thread.title }}</strong>
          <p>{{ thread.content }}</p>
        </div>

        <div class="thread-actions">
          <button @click="getThreadDetails(thread._id)">See more</button>
          <button @click="deleteThread(thread._id)">Delete</button>
        </div>
      </li>
    </ul>

    <p v-else-if="threads && threads.length === 0">No threads.</p>
    <p v-else>Loading...</p>

    <div class="pagination">
      <button @click="prevPage()">Previous page</button>
      <button @click="nextPage()">Next page</button>
    </div>

    <div class="form-wrapper">
      <form @submit.prevent="addThread">
        <input v-model="title" placeholder="Add title" required />
        <input v-model="content" placeholder="Add content" required />
        <button>Add Thread</button>
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
  gap: 10px;
  margin-top: 15px;
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

