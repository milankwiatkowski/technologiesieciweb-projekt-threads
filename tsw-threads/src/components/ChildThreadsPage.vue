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


const lastPage = ref(Number(localStorage.getItem("lastPage")) || 1)

async function getThreads(page){
    const fetch = axios.get(`http://localhost:3000/threads/${threadId}/${page}/${10}`,{withCredentials:true}
    ).then((res)=>{
        threads.value = res.data.threads
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

</script>
<template>
    <ul>
        <li v-for="thread in threads":key="thread._id">
            {{thread.title}}
            <button @click="deleteThread(thread._id)">Delete</button>
            <button @click="gotoThread(thread._id)">See more</button>
        </li>
    </ul>
    <p>Likes: {{likes}}</p>
    <button @click="like(id)">Like</button>
    <button @click="prevPage()">Previous page</button>
    <button @click="nextPage()">Next page</button>
    <form @submit.prevent="addThread">
        <input v-model="title" placeholder="Add title" required />
        <input v-model="content" placeholder="Add content" required />
        <button>Add Thread</button>
    </form>
    <!-- <button v-if="me && parentThread && parentThread.threadAuthors && (me.isAdmin || parentThread.threadAuthors.includes(me._id))" @click="goToModpanel(parentThread._id)">Zarządzaj</button> -->
</template>