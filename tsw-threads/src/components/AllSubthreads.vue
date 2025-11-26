<script setup>
import {ref,onMounted, watch} from "vue"
import {useRoute, useRouter} from "vue-router"
import axios from "axios"

const route = useRoute();
const router = useRouter()

const subthreads = ref([])
const threadId = route.params.threadId
const parentThread = ref({})

const title = ref('')
const content = ref('')
const me = ref({})

const lastPage = ref(Number(localStorage.getItem("lastPage")) || 1)

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
        {withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}

async function deletesubThread(id){
    const fetch = axios.delete(`http://localhost:3000/subthreads/${id}`,{
        withCredentials:true}).then((res)=>{
        getsubThreads(lastPage.value)
    }).catch((err)=>{
        console.log(err)
    })
}

async function getAuthors(){
    const fetch = axios.get(`http://localhost:3000/threads/${threadId}`,{withCredentials:true}).then((res)=>{
        parentThread.value = res.data.thread
    }).catch((err)=>{
        console.log(err)
    })
}

async function gotoThread(id){
    router.push(`/subthreads/${id}`)
}

async function goToModpanel(threadId){
    router.push(`/modpanel/${threadId}`)
}

async function nextPage(){
    lastPage.value++
    localStorage.setItem("lastPage",lastPage.value)
    getsubThreads(lastPage.value)
}

async function prevPage(){
    if(lastPage.value>1){
        lastPage.value--
        localStorage.setItem("lastPage",lastPage.value)
        getsubThreads(lastPage.value)
    }
}

async function getMyData(){
    const fetch = axios.get('http://localhost:3000/auth/me',{withCredentials:true}).then((res)=>[
        me.value = res.data.user,
    ]).catch((err)=>{
        console.log(err)
    })
}

onMounted(()=>{
    getsubThreads(lastPage.value)
    getMyData()
    getAuthors()
})

</script>
<template>
    <ul>
        <li v-for="subthread in subthreads":key="subthread._id">
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
    <button v-if="me && parentThread && parentThread.threadAuthors && (me.isAdmin || parentThread.threadAuthors.includes(me._id))" @click="goToModpanel(parentThread._id)">Zarządzaj</button>
</template>