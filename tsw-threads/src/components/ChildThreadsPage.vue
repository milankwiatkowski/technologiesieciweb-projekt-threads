<script setup>
import {ref,onMounted, watch, onUnmounted, computed} from "vue"
import AdminChat from "./AdminChat.vue";
import {useRoute, useRouter} from "vue-router"
import axios from "axios"
import { socket } from "./socket"
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
const threadId = computed(() => route.params.threadId)
const me = ref({})
const threads = ref([])
const thread = ref({})
const title = ref('')
const tags = ref('')
const newTags = ref('')
const tagsPost = ref('')
const blockedUsersId = ref([])
const isEditing = ref(false)
const currentRoomId = ref(null)
const newTitle = ref('')
const isEditingTitle = ref(false)
async function getThreads(page){
    const fetch = axios.get(`https://localhost/api/threads/sub/${threadId.value}/${page}/${10}`,{withCredentials:true}
    ).then((res)=>{
        threads.value = res.data.threads
        thread.value = res.data.thread
        tdamount.value = res.data.threads.length
        blockedUsersId.value = thread.value.blockedId
    }).catch((err)=>{
            console.log(err)
    })
}
async function getPosts(page){
    const fetch = axios.get(`https://localhost/api/threads/${threadId.value}/posts/${page}/${10}`,{withCredentials:true}
    ).then((res)=>{
        posts.value = res.data.posts
        postsAmount.value = res.data.posts.length
    }).catch((err)=>{
            console.log(err)
    })
}
async function addThread(){
    const fetch = axios.post(`https://localhost/api/threads/subthread/${threadId.value}`,{
        title: title.value,tags:tags.value},
        {withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function addPost(){
    const fetch = axios.post(`https://localhost/api/threads/${threadId.value}/post`,{
        title: title.value, tags: tagsPost.value, content: content.value},
        {withCredentials:true}).catch((err)=>{
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
    router.push(`/thread/postDetails/${postId}`)
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
    }).catch((err)=>{
        console.log(err)
    })
}
async function close(){
    const fetch = axios.post(`https://localhost/api/threads/close/${threadId.value}`,{},{withCredentials:true}).then(()=>{
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
async function hidePost(id){
  const fetch = axios.post(`https://localhost/api/threads/post/hide/${id}`,{},{withCredentials:true}).catch((err)=>{
    console.log(err)
  })
}

async function addTags(){
  await axios.post(`https://localhost/api/threads/edit/addTags/${threadId.value}`,{tags: newTags.value},{withCredentials:true}).then(()=>{
    newTags.value = ''
    isEditingTitle.value = false
  }).catch((err)=>{
    console.log(err)
  })
}

async function changeTitle(){
  await axios.post(`https://localhost/api/threads/edit/changeTitle/${threadId.value}`,{title: newTitle.value},{withCredentials:true}).then(()=>{
    newTitle.value = ''
    isEditing.value = false
  }).catch((err)=>{
    console.log(err)
  })
}

function onBlockedUser(id) {
  blockedUsersId.value.unshift(id)
}
function onUnblockedUser(id) {
  blockedUsersId.value = blockedUsersId.value.filter((x) => x !== id)
}
function onSubthreadAdded(subthread) {
  if (threads.value.length < 10) threads.value.push(subthread)
  isAddingThread.value = false
  tdamount.value += 1
}
function onPostAdded(post) {
  if (post.threadId && post.threadId !== threadId.value) return

  if (posts.value.length < 10) posts.value.push(post)
  isAddingPost.value = false
  postsAmount.value += 1
}
function onPostDeleted(post) {
  posts.value = posts.value.filter((x) => x._id !== post._id)
  postsAmount.value -= 1
}
function onThreadDeleted(obj) {
  threads.value = threads.value.filter((x) => x._id !== obj._id)
  tdamount.value -= 1
}
onMounted(()=>{
  if (!socket.connected) socket.connect();
  getMyData()
  socket.on("blockedUser", onBlockedUser)
  socket.on("unblockedUser", onUnblockedUser)
  socket.on("subthreadAdded", onSubthreadAdded)
  socket.on("postAdded", onPostAdded)
  socket.on("postDeleted", onPostDeleted)
  socket.on("threadDeleted", onThreadDeleted)
})
onUnmounted(() => {
  socket.off("blockedUser", onBlockedUser)
  socket.off("unblockedUser", onUnblockedUser)
  socket.off("subthreadAdded", onSubthreadAdded)
  socket.off("postAdded", onPostAdded)
  socket.off("postDeleted", onPostDeleted)
  socket.off("threadDeleted", onThreadDeleted)
  localStorage.setItem("lastThreadPage",lastThreadPage.value)
  localStorage.setItem("lastPostPage",lastPostPage.value)
})
watch(
  () => route.params.threadId,
  (newId,oldId) => {
    if (!socket.connected) socket.connect();
    if (oldId) socket.emit("thread:leave", { threadId: oldId })
    if (newId) socket.emit("thread:join", { threadId: newId })
    lastThreadPage.value = 1
    lastPostPage.value = 1
    localStorage.setItem("lastThreadPage", "1")
    localStorage.setItem("lastPostPage", "1")
    threads.value = []
    posts.value = []
    getThreads(1)
    getPosts(1)
  },
  { immediate: true }
)

</script>
<template>
    <button
      v-if="!thread.isClosed && me.isAdmin && !isEditing"
      class="btn"
      @click="close()"
    >
      Close thread
  </button>
  <div v-if="(!me.isBlockedEverywhere && (me.isAdmin || (thread.modsThreadId || []).includes(me._id) || (thread.rootModId || []).includes(me._id)))">
    <button class="btn" @click="goToModpanel(threadId)" >Go to thread modpanel</button>
    <button class="btn" v-if="!isEditing && !isEditingTitle && !thread.isClosed" @click="isEditing = true">Add new tags</button>
    <button class="btn" v-if="!isEditing && !isEditingTitle && !thread.isClosed" @click="isEditingTitle = true">Change title</button>
    <button class="btn" v-else @click="isEditing = false">Back</button>
  </div>
  <form v-if="isEditing" @submit.prevent="addTags(newTags)">
    <input v-model="newTags" placeholder="Add tags" />
    <button class="btn">Send</button>
  </form>
  <form v-if="isEditingTitle" @submit.prevent="changeTitle(newTitle)">
    <input v-model="newTitle" placeholder="Change title" />
    <button class="btn">Send</button>
  </form>
  <div class="page" v-if="!isAddingThread && !isAddingPost && !thread.isHidden">
    <div class="back-nav">
      <button v-if="thread.parentThreadId === null" class="btn" @click="goToRoot()">Go to root thread</button>
      <button v-else class="btn" @click="goToThread(thread.parentThreadId)">Go back</button>
      <div>{{ thread.title }}</div>
      <div>{{ thread.tags }}</div>
    </div>
    <div class="thread-container">
      <button class="btn" v-if="!thread.isClosed && !me.isBlockedEverywhere && (me.isAdmin || thread?.creatorId?.toString?.() === me?._id?.toString?.() || (!blockedUsersId.includes(me._id) && ((thread.rootModId || []).includes(me._id) || (thread.modsThreadId || []).includes(me._id))))" @click="isAddingThread = !isAddingThread">Add new subthread</button>
      <div v-for="thread2 in threads" :key="thread2._id" class="child-item">
        <div class="child-info">
          <div class="title">{{ thread2.title }}</div>
        </div>

        <div class="child-actions">
          <button class="btn" @click="goToThread(thread2._id)">See more</button>
          <button class="btn" v-if="me.isAdmin" @click="hide(thread2._id)">Hide thread</button>
        </div>
      <div class="pagination">
        <button class="btn" v-if="lastThreadPage !== 1" @click="prevThreadPage()">Previous page</button>
        <button class="btn" v-if="tdamount >= 10" @click="nextThreadPage()">Next page</button>
      </div>
      <button
        v-if="thread.isClosed && (me.isAdmin || (thread.rootModId || []).includes(me._id)) && !isEditing"
        class="btn-wide"
        @click="close()"
      >
        Reopen thread
      </button>
    </div>
  </div>
  <div class="posts-container" v-if="!thread.isHidden">
      <button class="btn" v-if="!thread.isClosed && !me.isBlockedEverywhere && (!blockedUsersId.includes(me._id) || (blockedUsersId.includes(me._id) && thread.creatorId.toString() === me._id.toString()))" @click="isAddingPost = !isAddingPost">Add new post</button>
      <div v-for="post in posts" :key="post._id" class="child-item">
        <div class="child-info">
          <div v-if="post.refersToPost" @click="goToPost(post.refersToPost)" class="clickable">This post references another one! See more...</div>
          <div class="creator">Author: {{ post.creatorLogin }}</div>
          <div class="title">{{ post.title }}</div>
          <div class="tags">Tags: {{ post.tags }}</div>
        </div>

        <div class="child-actions">
          <button class="btn" @click="goToPost(post._id)">See more</button>
          <button v-if="(
                          !blockedUsersId.includes(me._id) &&
                          !me?.isBlockedEverywhere &&
                          ((thread.rootModId || []).includes(me._id) || (thread.modsThreadId || []).includes(me._id)) || me.isAdmin || post?.creatorId?.toString?.() === me._id?.toString?.())" class="btn delete" @click="hidePost(post._id)">Delete</button>
        </div>
      </div>
      <div class="pagination">
        <button class="btn" v-if="lastPostPage !== 1" @click="prevPostPage()">Previous page</button>
        <button class="btn" v-if="postsAmount >= 10" @click="nextPostPage()">Next page</button>
      </div>
  </div>
  </div>
  <div class="page" v-else-if="isAddingThread">
    <button class="btn" @click="isAddingThread = false">Back</button>
    <div v-if="!thread.isClosed && !me.isBlockedEverywhere && ((thread.rootModId || []).includes(me._id) || (thread.modsThreadId || []).includes(me._id)) && !blockedUsersId.includes(me._id) && !isAddingPost" class="reply-box">
      <form @submit.prevent="addThread" class="reply-form">
        <input v-model="title" placeholder="Add title" required />
        <input v-model="tags" placeholder="Add tags" />
        <button class="btn-wide" type="submit">Add thread</button>
      </form>
    </div>
  </div>
  <div class="page" v-else-if="isAddingPost">
    <button class="btn" @click="isAddingPost = false">Back</button>
    <div v-if="!thread.isClosed && !me.isBlockedEverywhere && !blockedUsersId.includes(me._id) && !isAddingThread" class="reply-box">
      <form @submit.prevent="addPost" class="reply-form">
        <input v-model="title" placeholder="Add title" required />
        <textarea v-model="content" placeholder="Add content" required></textarea>
        <input v-model="tagsPost" placeholder="Add tags" />
        <button class="btn-wide" type="submit">Add post</button>
      </form>
    </div>
  </div>
  <AdminChat />
</template>

<style scoped>
.clickable{
  color: var(--accent);
  cursor: pointer;
  font-size: 0.92rem;
  margin-bottom: 10px;
  display: inline-block;
  transition: opacity 0.12s ease, transform 0.12s ease, text-decoration-color 0.12s ease;
}
.clickable:hover{
  text-decoration: underline;
  opacity: 0.95;
}
.clickable:active{
  transform: translateY(1px);
}

.thread-info .login,
.thread-info .creator{
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.btnback{
  margin-bottom: 16px;
  padding: 8px 14px;
  color: var(--text);
  font-size: 0.85rem;
  cursor: pointer;
  background: transparent;
  border-radius: 12px;
  transition: background-color 0.12s ease, transform 0.1s ease;
}
.btnback:hover{
  background: var(--bg-soft);
}
.btnback:active{
  transform: translateY(1px);
}

.tags{
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-top: 6px;
  line-height: 1.25;
}

.page{
  max-width: 1300px;
  margin: 0 auto;
  padding: 20px 16px;
  display: grid;
  grid-template-columns: 360px 1fr; 
  gap: 28px;
  align-items: start;
}

@media (max-width: 900px){
  .page{
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px 12px;
  }
}

.back-nav,
.btn-wide.warn{
  grid-column: 1 / -1;
}

.back-nav{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--bg-soft);
  margin-bottom: 8px;
  box-shadow: 0 10px 26px rgba(0,0,0,0.12);
}

.back-nav > div{
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.back-nav > div:nth-child(3){
  font-weight: 700;
  font-size: 1.02rem;
  line-height: 1.2;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.back-nav > div:nth-child(4){
  font-size: 0.85rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  border-radius: 14px;
  color: var(--text);
  font-size: 0.95rem;
  line-height: 1.2;
  transition: border-color 0.14s ease, box-shadow 0.14s ease, transform 0.08s ease;
}

textarea {
  min-height: 120px;
  resize: vertical;
}

input::placeholder,
textarea::placeholder{
  color: color-mix(in srgb, var(--text-secondary) 85%, transparent);
}

input:focus, textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(0,0,0,0.18);
}

input:active, textarea:active{
  transform: translateY(0.5px);
}

.child-item{
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  box-shadow: 0 10px 26px rgba(0,0,0,0.10);
  transition: transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
}

.child-item:hover{
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--border) 60%, var(--accent));
  box-shadow: 0 14px 34px rgba(0,0,0,0.14);
}

.child-info{
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.child-info .title{
  font-weight: 700;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
}

.child-info .creator{
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.child-actions{
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.pagination{
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: center;
  gap: 10px;
}

.btn {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-size: 0.86rem;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 6px 16px rgba(0,0,0,0.10);
  transition: background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease, transform 0.1s ease, box-shadow 0.12s ease;
}

.btn:hover {
  background: var(--bg-soft);
  border-color: color-mix(in srgb, var(--border) 55%, var(--accent));
  box-shadow: 0 10px 22px rgba(0,0,0,0.14);
  transform: translateY(-0.5px);
}

.btn:active {
  transform: translateY(1px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.10);
}

.btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.btn.accent {
  background: var(--accent);
  color: #000;
  border-color: transparent;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(0,0,0,0.18);
}

.btn.accent:hover {
  opacity: 0.92;
}

.btn.delete,
.btn.warn {
  background: transparent;
  border-color: #4a1a1a;
  color: #ffb3b3;
  box-shadow: 0 6px 16px rgba(0,0,0,0.10);
}

.btn.delete:hover,
.btn.warn:hover {
  background: #2a0f0f;
  border-color: #6a2a2a;
}

.btn-wide {
  width: 100%;
  margin: 10px 0 0;
  padding: 12px 14px;
  border-radius: 16px;
  font-weight: 800;
  box-shadow: 0 10px 26px rgba(0,0,0,0.12);
}

.thread-container > .btn.accent,
.posts-container > .btn.accent{
  width: 100%;
  margin-top: 10px;
}

.reply-box{
  grid-column: 1 / -1;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 18px 16px;
  box-shadow: 0 14px 36px rgba(0,0,0,0.14);
}

.reply-form{
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.thread-container{
  grid-column: 1;
}

.posts-container{
  grid-column: 2;
}

@media (max-width: 900px){
  .thread-container,
  .posts-container{
    grid-column: 1;
  }
}
</style>