<script setup>
import {ref,onMounted,onUnmounted, watch, computed} from "vue"
import {useRoute, useRouter} from "vue-router"
import axios from "axios"
import {io} from "socket.io-client"
import HighlightedText from './HighlightedText.vue'
import hljs from "highlight.js"
const isEditing = ref(false)
const lastPostsPage = ref(Number(localStorage.getItem("lastPostsPage")) || 1)
const title = ref('')
const content = ref('')
const likes = ref(0)
const disLikes = ref(0)
const socket = io("https://localhost",{withCredentials:true,transports: ["websocket", "polling"]})
const post = ref({})
const me = ref({})
const thread = ref({})
const route = useRoute()
const postsAmount = ref(0)
const posts = ref([])
const replyTitle = ref('')
const router = useRouter()
const replyContent = ref('')
const isReplying = ref(false)
const threadId = computed(() => route.params.threadId)
const postId = computed(() => route.params.postId)
const blockedUsersId = ref([])
async function like(){
    const fetch = axios.post(`https://localhost/api/threads/${threadId.value}/${postId.value}/likes`,{like:'like'},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function disLike(){
    const fetch = axios.post(`https://localhost/api/threads/${threadId.value}/${postId.value}/likes`,{like:'dislike'},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
function setEditing(){
  isEditing.value = true
}
async function editPost(){
    const fetch = axios.post(`https://localhost/api/threads/edit/${threadId.value}/${postId.value}`,{
        title: title.value,
        content: content.value},
        {withCredentials:true}).then(()=>{
          isEditing.value = false
        }).catch((err)=>{
        console.log(err)
    })
}
async function getMyData(){
    const fetch = axios.get("https://localhost/api/auth/me",{withCredentials:true}).then((res)=>{
        me.value = res.data.user
    }).catch((err)=>{
            console.log(err)
    })
}
async function getPostDetails(id){
    const fetch = axios.get(`https://localhost/api/threads/${threadId.value}/posts/postDetails/${id}`,{withCredentials:true}).then((res)=>{
        post.value = res.data.post
        likes.value = res.data.post.likes
        disLikes.value = res.data.post.disLikes}).catch((err)=>{
        console.log(err)
    })
}
async function reply(){
    isReplying.value = false
    const fetch = axios.post(`https://localhost/api/threads/${threadId.value}/reply/${postId.value}`,{
        title: replyTitle.value,
        content: replyContent.value},
        {withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function getThreadDetails(threadId){
    const fetch = axios.get(`https://localhost/api/threads/subthread/${threadId}`,{withCredentials:true}).then((res)=>{
        thread.value = res.data.thread
        blockedUsersId.value = thread.value.blockedId
    }).catch((err)=>{
        console.log(err)
    })
}
function onLike(payload){
  likes.value = payload.likes
  disLikes.value = payload.disLikes
}
function onDislike(payload){
  disLikes.value = payload.disLikes
  likes.value = payload.likes
}
async function goToPost(postId){
    router.push(`/thread/${threadId.value}/post/${postId}`)
}
function onHidden(post){
  posts.value = posts.value.filter(x => x._id !== post._id)
}
async function hide(id){
  const fetch = axios.post(`https://localhost/api/threads/post/hide/${threadId.value}/${id}`,{},{withCredentials:true}).catch((err)=>{
    console.log(err)
  })
}
async function nextPostsPage(){
    lastPostsPage.value++
    localStorage.setItem("lastPostsPage",lastPostsPage.value)
    getPosts(lastPostsPage.value)
}

async function prevPostsPage(){
    if(lastPostsPage.value>1){
        lastPostsPage.value--
        localStorage.setItem("lastPostsPage",lastPostsPage.value)
        getPosts(lastPostsPage.value)
    }
}
async function getPosts(page){
    const fetch = axios.get(`https://localhost/api/threads/${threadId.value}/replies/${postId.value}/${page}/${20}`,{withCredentials:true}
    ).then((res)=>{
        posts.value = res.data.replies
        postsAmount.value = res.data.replies.length
    }).catch((err)=>{
            console.log(err)
    })
}
function onReply(reply){
  posts.value.unshift(reply)
}
onMounted(()=>{
  socket.on("liked",onLike)
  socket.on("disliked",onDislike)
  socket.on("postDeleted",onHidden)
  socket.on("newReply",onReply)
  socket.emit("post:join", { postId: postId.value })
  getMyData()
  getPostDetails(postId.value)
  getPosts(1)
  getThreadDetails(threadId.value)
  hljs.highlightAll()
})
onUnmounted(()=>{
  socket.off("liked",onLike)
  socket.off("disliked",onDislike)
  socket.off('postDeleted',onHidden)
  socket.off('newReply',onReply)
  localStorage.setItem("lastPostsPage",lastPostsPage.value)
  socket.emit("post:leave", { postId: postId.value })
  socket.disconnect()
})
watch(
  () => route.params.postId,
  (newId,oldId) => {
    if (oldId) socket.emit("post:leave", { postId: oldId })
    if (newId) socket.emit("post:join", { postId: newId })
    getPosts(1)
    getPostDetails(newId)
    getThreadDetails(threadId.value)
  },
  { immediate: true }
)
</script>
<template>
    <div class="thread-info" v-if="!isEditing">
      <div>{{ post.creatorLogin }}</div>
      <p class="likes"><strong>Likes:</strong> {{ likes }}</p>
      <p class="likes"><strong>Dislikes:</strong> {{ disLikes }}</p>
      <HighlightedText v-if="post.content" :text="post.content" class="post-content" />
      <div class="post-buttons">
        <button class="btn accent" @click="like()">Like</button>
        <button class="btn accent" @click="disLike()">Dislike</button>
        <button class="btn" v-if="!isReplying" @click="isReplying = true">Reply</button>
        <button class="btn" v-if="me.isAdmin || (post.rootModId || []).includes(me._id)" @click="setEditing()">Edit</button>
      </div>
    </div>
    <div v-if="isEditing && (me.isAdmin || (post.rootModId || []).includes(me._id) || post.creatorId === me._id)" class="edit-box">
      <form @submit="editPost(thread._id,post._id)" class="edit-form">
        <div class="edit-group">
          <strong>Current title:</strong> {{ post.title }}
          <input v-model="title" placeholder="Change title" />
        </div>

        <div class="edit-group">
          <strong>Current content:</strong> {{ post.content }}
          <textarea v-model="content" placeholder="Change content"></textarea>
        </div>
        <button class="btn accent" type="submit">Submit editing</button>
      </form>
    </div>
    <div v-if="isReplying" class="replying">
            <div>
              <form @submit="reply()" class="edit-form">
                <div class="edit-group">
                  <input v-model="replyTitle" placeholder="..." />
                  <textarea v-model="replyContent" placeholder="..."></textarea>
                </div>
                <button class="btn accent" type="submit">Send reply</button>
              </form>
            </div>
          </div>
      <div class="pagination">
        <button class="btn" v-if="lastPostsPage !== 1" @click="prevPostsPage()">Previous page</button>
        <button class="btn" v-if="postsAmount >= 40" @click="nextPostsPage()">Next page</button>
      </div>
      <div>
        <div class="replies-container">        
        <div v-for="post2 in posts" :key="post2._id" class="child-item">
        <div class="child-info">
          <div class="title">{{ post2.title }}</div>
          <div class="creator">By: {{ post2.creatorLogin }}</div>
        </div>
        <div class="child-actions">
          <button class="btn" @click="goToPost(post2._id)">See more</button>
          <button v-if="(!blockedUsersId.includes(me._id) && ((thread.rootModId || []).includes(me._id) || (thread.modsThreadId || []).includes(me._id)) || me.isAdmin)" class="btn delete" @click="hide(post._id)">Delete</button>
        </div>
      </div></div>
      </div>
</template>
<style scoped>
.thread-container{
  display: grid;
  grid-template-columns: 360px 1fr; 
  gap: 28px;
  align-items: start;
  background: transparent;
  border: none;
  padding: 0;
  min-height: unset;
}
.thread-info {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.likes {
  display: inline-block;
  margin-right: 14px;
  color: var(--text-soft);
  font-size: 0.9rem;
}

.likes strong {
  color: var(--text);
  font-weight: 600;
}

.post-content {
  margin: 18px 0 22px;
  line-height: 1.6;
  color: var(--text);
  font-size: 0.95rem;
}

.post-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #202020;
  color: var(--text);
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.15s ease, opacity 0.15s ease;
}

.btn:hover {
  background-color: #2a2a2a;
}

.btn.accent {
  background: var(--accent);
  color: #000;
  border-color: transparent;
  font-weight: 600;
}

.btn.accent:hover {
  opacity: 0.85;
}

.edit-box {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  max-width: 900px;
  margin: 20px auto 0;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edit-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-group strong {
  font-size: 0.85rem;
  color: var(--text-soft);
}

input,
textarea {
  padding: 12px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text);
  font-size: 0.95rem;
}

textarea {
  min-height: 140px;
  resize: vertical;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #555;
}

</style>