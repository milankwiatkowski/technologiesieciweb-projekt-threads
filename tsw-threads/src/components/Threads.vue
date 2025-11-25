<script setup>
import {ref, onMounted} from "vue"
import {useRouter} from "vue-router"
import axios from "axios"

const router = useRouter()

const threads = ref([])
const title = ref('')

async function getThreads(){
    const fetch = axios.get('http://localhost:3000/threads/',{withCredentials:true}).then((res)=>{
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
        title: title.value},
        {withCredentials:true}).then((res)=>{
        threads.value = res.data.threads
    }).catch((err)=>{
        console.log(err)
    })
}

onMounted(()=>{
    getThreads()
})

</script>
<template>
    <ul v-if="threads && threads.length>0">
        <li v-for="thread in threads":key="thread._id">
            {{thread.title}}
            <button @click="getThreadDetails(thread._id)">See more</button>
            <button @click="deleteThread(thread._id)">Delete</button>
        </li>
    </ul>
    <p v-else-if="threads && threads.length==0">No threads.</p>
    <p v-else>Loading...</p>
    <form @submit.prevent="addThread">
        <input v-model="title" placeholder="Add title" required />
        <button>Add Thread</button>
    </form>
</template>