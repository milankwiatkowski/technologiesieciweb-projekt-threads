<script setup>
import {ref,onMounted} from "vue"
import {useRoute, useRouter} from "vue-router"
import axios from "axios"

const route = useRoute();
const router = useRouter()

const subthreads = ref([])
const threadId = route.params.threadId

const title = ref('')
const content = ref('')

let lastPage = ref(1)

async function getsubThreads(page){
    const fetch = axios.get(`http://localhost:3000/subthreads/${threadId}/${page}/${10}`,{withCredentials:true}
    ).then((res)=>{
        subthreads.value = res.data.subthreads
    }).catch((err)=>{
            console.log(err)
    })
}

async function addsubThread(){
    const fetch = axios.post(`http://localhost:3000/subthreads/${threadId}`,{
        title: title.value, content: content.value},
        {withCredentials:true}).then((res)=>{
        subthreads.value = res.data.subthreads
        getsubThreads(Number(lastPage))
    }).catch((err)=>{
        console.log(err)
    })
}

async function deletesubThread(id){
    const fetch = axios.delete(`http://localhost:3000/subthreads/${id}`,{
        withCredentials:true}).then((res)=>{
        getsubThreads(Number(lastPage))
    }).catch((err)=>{
        console.log(err)
    })
}

async function gotoThread(id){
    router.push(`/subthreads/${id}`)
}

async function nextPage(){
    const lastPage = localStorage.getItem("lastPage")
    localStorage.setItem("lastPage",(Number(lastPage)+1).toString())
    getsubThreads(Number(lastPage)+1)
}

async function prevPage(){
    lastPage = localStorage.getItem("lastPage")
    if(lastPage>1){
        localStorage.setItem("lastPage",(Number(lastPage)-1).toString())
        getsubThreads(Number(lastPage)-1)
    }
}

onMounted(()=>{
    getsubThreads(localStorage.getItem("lastPage"))
})

</script>
<template>
    <ul>
        <li v-for="subthread in subthreads":key="subthread.id">
            {{subthread.title}}
            <button @click="deletesubThread(subthread._id)">Delete</button>
            <button @click="gotoThread(subthread._id)">See more</button>
        </li>
    </ul>
    <button @click="prevPage()">Previous page</button>
    <button @click="nextPage()">Next page</button>
    <form @submit.prevent="addsubThread">
        <input v-model="title" placeholder="Add title" required />
        <input v-model="content" placeholder="Add content" required />
        <button>Add subThread</button>
    </form>
</template>