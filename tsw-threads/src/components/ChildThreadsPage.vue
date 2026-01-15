<script setup>
import {ref,onMounted, watch} from "vue"
import {useRoute, useRouter} from "vue-router"
import axios from "axios"
import {io} from "socket.io-client"

const socket = io("https://localhost",{withCredentials:true,transports: ["websocket", "polling"]})
const lastThreadPage = ref(Number(localStorage.getItem("lastThreadPage")) || 1)
const lastPostPage = ref(Number(localStorage.getItem("lastPostPage")) || 1)
const tdamount = ref(0)
const postsAmount = ref(0)
const route = useRoute();
const content = ref('')
const router = useRouter()
const posts = ref([])
const isAddingThread = ref(false)
const isAddingPost = ref(false)
const threadId = route.params.threadId
const me = ref({})
const threads = ref([])
const thread = ref({})
const title = ref('')
const tags = ref('')
const blockedUsersId = ref([])
socket.on('blockedUser',(id)=>{
    blockedUsersId.value.unshift(id)
    console.log(blockedUsersId.value)
})
socket.on('unblockedUser',(id)=>{
    blockedUsersId.value = blockedUsersId.value.filter((x)=> x !== id)
    console.log(blockedUsersId.value)
})
socket.on("subthreadAdded",(subthread)=>{
    if(threads.value.length<10){
      threads.value.push(subthread)
    }
  isAddingThread.value = false
  tdamount.value+=1
})
socket.on("postAdded",(post)=>{
    if(posts.value.length<20){
      posts.value.push(post)
    }
  isAddingPost.value = false
  postsAmount.value+=1
})
socket.on("postDeleted",(post)=>{
  posts.value = posts.value.filter((x)=>x._id !== post._id)
  postsAmount.value-=1
})
socket.on("threadDeleted",(object)=>{
  threads.value = threads.value.filter((x)=>x._id !== object._id)
  tdamount.value-=1
})
// socket.on("threadDeleted",(object)=>{
//   threads.value = threads.value.filter((x)=>x._id !== object._id)
//   tdamount.value-=1
// })
async function getThreads(page){
    const fetch = axios.get(`https://localhost/api/threads/sub/${threadId}/${page}/${10}`,{withCredentials:true}
    ).then((res)=>{
        threads.value = res.data.threads
        thread.value = res.data.thread
        tdamount.value = res.data.threads.length
        blockedUsersId.value = thread.value.blockedId
        console.log(thread.value.blockedId)
    }).catch((err)=>{
            console.log(err)
    })
}
async function getPosts(page){
    const fetch = axios.get(`https://localhost/api/threads/${threadId}/posts/${page}/${20}`,{withCredentials:true}
    ).then((res)=>{
        posts.value = res.data.posts
        postsAmount.value = res.data.posts.length
    }).catch((err)=>{
            console.log(err)
    })
}
async function addThread(){
    const fetch = axios.post(`https://localhost/api/threads/subthread/${threadId}`,{
        title: title.value,tags:tags.value},
        {withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function addPost(){
    const fetch = axios.post(`https://localhost/api/threads/${threadId}/post`,{
        title: title.value, content: content.value},
        {withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function deletePost(postId){
    const fetch = axios.delete(`https://localhost/api/threads/delete/${threadId}/${postId}`,{
        withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}

async function goToThread(id){
    router.push(`/thread/${id}`)
}
async function goToRoot(){
  router.push(`/threads`)
}
async function goToPost(postId){
    router.push(`/thread/${threadId}/post/${postId}`)
}
async function goToModpanel(threadId){
    router.push(`/modpanel/${threadId}`)
}

async function nextThreadPage(){
    lastThreadPage.value++
    localStorage.setItem("lastThreadPage",lastThreadPage.value)
    getThreads(lastThreadPage.value)
}

async function prevThreadPage(){
    if(lastThreadPage.value>1){
        lastThreadPage.value--
        localStorage.setItem("lastThreadPage",lastThreadPage.value)
        getThreads(lastThreadPage.value)
    }
}
async function nextPostPage(){
    lastPostPage.value++
    localStorage.setItem("lastPostPage",lastPostPage.value)
    getPosts(lastPostPage.value)
}

async function prevPostPage(){
    if(lastPostPage.value>1){
        lastPostPage.value--
        localStorage.setItem("lastPostPage",lastPostPage.value)
        getPosts(lastPostPage.value)
    }
}

async function getMyData(){
    const fetch = axios.get('https://localhost/api/auth/me',{withCredentials:true}).then((res)=>{
        me.value = res.data.user
        console.log(me.value._id)
    }).catch((err)=>{
        console.log(err)
    })
}
async function close(){
    const fetch = axios.post(`https://localhost/api/threads/close/${threadId}`,{},{withCredentials:true}).then(()=>{
        getThreads(lastThreadPage.value)
    }).catch((err)=>{
        console.log(err)
    })
}
async function hide(id){
  const fetch = axios.post(`https://localhost/api/threads/hide/${id}`,{},{withCredentials:true}).catch((err)=>{
    console.log(err)
  })
}
onMounted(()=>{
    getThreads(lastThreadPage.value)
    getMyData()
    getPosts(lastPostPage.value)
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
  <div class="page" v-if="!isAddingThread && !isAddingPost">
    <div class="back-nav">
      <button v-if="thread._id === null" class="btn-nav" @click="goToRoot()">Go to root thread</button>
      <button v-else class="btn" @click="goToThread(thread.parentThreadId)">Go to previous thread</button>
    </div>
  <button
      v-if="!thread.isClosed && (me.isAdmin || (thread.rootModId || []).includes(me._id) || (thread.modsThreadId || []).includes(me._id)) && !isEditing"
      class="btn-wide warn"
      @click="close()"
    >
      Close thread
  </button>
  <button
      v-if="(me.isAdmin || (thread.rootModId || []).includes(me._id))"
      class="btn-wide warn"
      @click="goToModpanel(threadId)"
    >
      Go to modpanel
  </button>
  <div class="thread-container">
      <div v-for="thread2 in threads" :key="thread2._id" class="child-item">
        <div class="child-info">
          <div class="title">{{ thread2.title }}</div>
        </div>

        <div class="child-actions">
          <!-- <button v-if="(!blockedUsersId.includes(me._id) && ((thread2.rootModId || []).includes(me._id) || thread.modsThreadId.includes(me._id)) || me.isAdmin)" class="btn delete" @click="deleteThread(thread2._id)">Delete</button> -->
          <button class="btn" @click="goToThread(thread2._id)">See more</button>
          <button class="btn" v-if="me.isAdmin" @click="hide(thread2._id)">Hide thread</button>
        </div>
      </div>
    <div class="pagination">
      <button class="btn" v-if="lastThreadPage !== 1" @click="prevThreadPage()">Previous page</button>
      <button class="btn" v-if="tdamount >= 10" @click="nextThreadPage()">Next page</button>
    </div>
    <button
      v-if="thread.isClosed && (me.isAdmin || (thread.rootModId || []).includes(me._id) || (thread.modsThreadId || []).includes(me._id)) && !isEditing"
      class="btn-wide"
      @click="close()"
    >
      Reopen thread
    </button>
    <button class="btn" @click="isAddingThread = !isAddingThread">Add new subthread</button>
  </div>
  <div class="posts-container">
      <div v-for="post in posts" :key="post._id" class="child-item">
        <div class="child-info">
          <div class="title">{{ post.title }}</div>
        </div>

        <div class="child-actions">
          <button class="btn" @click="goToPost(post._id)">See more</button>
          <button v-if="(!blockedUsersId.includes(me._id) && ((thread.rootModId || []).includes(me._id) || thread.modsThreadId.includes(me._id)) || me.isAdmin)" class="btn delete" @click="deletePost(post._id)">Delete</button>
        </div>
      </div>
      <div class="pagination">
        <button class="btn" v-if="lastPostPage !== 1" @click="prevPostPage()">Previous page</button>
        <button class="btn" v-if="postsAmount >= 40" @click="nextPostPage()">Next page</button>
      </div>
      <button class="btn" @click="isAddingPost = !isAddingPost">Add new post</button>
  </div>
  </div>
  <div class="page" v-else-if="isAddingThread">
    <button class="btn" @click="isAddingThread = false">Back</button>
    <div v-if="!thread.isClosed && (thread.rootModId || []).includes(me._id) && !blockedUsersId.includes(me._id) && !isAddingPost" class="reply-box">
      <form @submit.prevent="addThread" class="reply-form">
        <input v-model="title" placeholder="Add title" required />
        <input v-model="tags" placeholder="Add tags" required />
        <button class="btn-wide" type="submit">Add thread</button>
      </form>
    </div>
  </div>
  <div class="page" v-else-if="isAddingPost">
    <button class="btn" @click="isAddingPost = false">Back</button>
    <div v-if="!thread.isClosed && !blockedUsersId.includes(me._id) && !isAddingThread" class="reply-box">
      <form @submit.prevent="addPost" class="reply-form">
        <input v-model="title" placeholder="Add title" required />
        <textarea v-model="content" placeholder="Add content" required></textarea>
        <button class="btn-wide" type="submit">Add post</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.page{
  max-width: 1300px;
  margin: 0 auto;
  padding: 18px 16px;

  display: grid;
  grid-template-columns: 360px 1fr; 
  gap: 28px;
  align-items: start;
}

@media (max-width: 900px){
  .page{
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.back-nav,
.btn-wide.warn{
  grid-column: 1 / -1;
}

.thread-container,
.posts-container {
  background: transparent;
  border: none;
  padding: 0;
  min-height: unset;
}
input, textarea {
  width: 100%;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  padding: 12px;
  border-radius: 12px;
  color: var(--text);
  font-size: 0.95rem;
}

textarea {
  min-height: 120px;
  resize: vertical;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #444;
}

.child-item{
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 12px;
  margin-bottom: 10px;
}

.pagination{
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: center;
  gap: 10px;
}

.thread-container > .btn.accent,
.posts-container > .btn.accent{
  width: 100%;
  margin-top: 10px;
}
.btn {
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease,
    color 0.12s ease,
    transform 0.1s ease;
}

.btn:hover {
  background: var(--bg-soft);
  border-color: #3a3a3a;
}

.btn:active {
  transform: translateY(1px);
}

.btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.btn.accent {
  background: var(--accent);
  color: #000;
  border-color: transparent;
  font-weight: 700;
}

.btn.accent:hover {
  opacity: 0.9;
}

.btn.delete,
.btn.warn {
  background: transparent;
  border-color: #4a1a1a;
  color: #ffb3b3;
}

.btn.delete:hover,
.btn.warn:hover {
  background: #2a0f0f;
  border-color: #6a2a2a;
}

.btn-wide {
  width: 100%;
  margin: 10px 0 0;
  padding: 10px 14px;
  border-radius: 14px;
  font-weight: 700;
}
</style>
