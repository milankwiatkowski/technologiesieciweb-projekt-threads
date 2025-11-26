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
    <ul v-if="threads && threads.length>0">
        <li v-for="thread in threads":key="thread._id">
            {{thread.title}}
            {{thread.content}}
            <button @click="getThreadDetails(thread._id)">See more</button>
            <button @click="deleteThread(thread._id)">Delete</button>
        </li>
    </ul>
    <p v-else-if="threads && threads.length==0">No threads.</p>
    <p v-else>Loading...</p>
    <button @click="prevPage()">Previous page</button>
    <button @click="nextPage()">Next page</button>
    <form @submit.prevent="addThread">
        <input v-model="title" placeholder="Add title" required />
        <input v-model="content" placeholder="Add content" required />
        <button>Add Thread</button>
    </form>
</template>