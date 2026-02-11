<script setup>
import {ref,onMounted,onUnmounted, watch, computed} from "vue"
import {useRoute, useRouter} from "vue-router"
import axios from "axios"
import AdminChat from "./AdminChat.vue";
import HighlightedText from './HighlightedText.vue'
import hljs from "highlight.js"
const isEditing = ref(false)
const lastPostsPage = ref(Number(localStorage.getItem("lastPostsPage")) || 1)
const title = ref('')
const content = ref('')
const likes = ref(0)
const disLikes = ref(0)
import { socket } from "./socket"
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
const postId = computed(() => route.params.postId)
const blockedUsersId = ref([])
const postTags = ref('')
const threadId = computed(() => post.value.parentThreadId)
async function like(){
    const fetch = axios.post(`/api/threads/${threadId.value}/${postId.value}/likes`,{like:'like'},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function disLike(){
    const fetch = axios.post(`/api/threads/${threadId.value}/${postId.value}/likes`,{like:'dislike'},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
function setEditing(){
  isEditing.value = true
}
async function goToThread(id){
    router.push(`/thread/${id}`)
}
async function editPost(){
    const fetch = axios.post(`/api/threads/edit/${threadId.value}/${postId.value}`,{
        title: title.value,
        content: content.value},
        {withCredentials:true}).then(()=>{
          isEditing.value = false
        }).catch((err)=>{
        console.log(err)
    })
}
async function getMyData(){
    const fetch = axios.get("/api/auth/me",{withCredentials:true}).then((res)=>{
        me.value = res.data.user
    }).catch((err)=>{
            console.log(err)
    })
}
async function getPostDetails(id){
    const fetch = axios.get(`/api/threads/posts/postDetails/${id}`,{withCredentials:true}).then((res)=>{
        post.value = res.data.post
        likes.value = res.data.post.userLikesId.length
        disLikes.value = res.data.post.userDislikesId.length
        getPosts(1)
        getThreadDetails(threadId.value)
        }).catch((err)=>{
        console.log(err)
    })
}
async function reply(){
    isReplying.value = false
    const fetch = axios.post(`/api/threads/${threadId.value}/reply/${postId.value}`,{
        title: replyTitle.value,
        tags: postTags.value,
        content: replyContent.value},
        {withCredentials:true}).then(()=>{
            replyTitle.value = ''
            replyContent.value = ''
            postTags.value = ''
            router.push(`/thread/postDetails/${post.value._id}`)
        }).catch((err)=>{
        console.log(err)
    })
}
async function getThreadDetails(threadId){
    const fetch = axios.get(`/api/threads/subthread/${threadId}`,{withCredentials:true}).then((res)=>{
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
    router.push(`/thread/postDetails/${postId}`)
}
function onHidden(post){
  posts.value = posts.value.filter(x => x._id !== post._id)
}
async function hide(id){
  const fetch = axios.post(`/api/threads/post/hide/${id}`,{postId:postId.value},{withCredentials:true}).catch((err)=>{
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
    const fetch = axios.get(`/api/threads/${threadId.value}/replies/${postId.value}/${page}/${20}`,{withCredentials:true}
    ).then((res)=>{
        posts.value = res.data.replies
        postsAmount.value = res.data.replies.length
    }).catch((err)=>{
            console.log(err)
    })
}
function onReply(reply){
  if (posts.value.length < 20) posts.value.push(reply)
  postsAmount.value += 1
}
function blockedUser(user){
  blockedUsersId.value.push(user)
}
function unblockedUser(user){
  blockedUsersId.value = blockedUsersId.value.filter(x => x._id !== user._id)
}
onMounted(()=>{
  if (!socket.connected) socket.connect();
  socket.on("liked",onLike)
  socket.on("disliked",onDislike)
  socket.on("postDeleted",onHidden)
  socket.on("newReply",onReply)
  socket.on("blockedUser",blockedUser)
  socket.on("unblockedUser",unblockedUser)
  socket.emit("post:join", { postId: postId.value })
  getMyData()
  hljs.highlightAll()
})
onUnmounted(()=>{
  socket.off("liked",onLike)
  socket.off("disliked",onDislike)
  socket.off('postDeleted',onHidden)
  socket.off('newReply',onReply)
  socket.off("blockedUser",blockedUser)
  socket.off("unblockedUser",unblockedUser)
  localStorage.setItem("lastPostsPage",1)
  socket.emit("post:leave", { postId: postId.value })
})
watch(
  () => route.params.postId,
  (newId,oldId) => {
    if (oldId) socket.emit("post:leave", { postId: oldId })
    if (newId) socket.emit("post:join", { postId: newId })
    getPostDetails(newId)
  },
  { immediate: true }
)
</script>
<template>
  <div class="post-page">
    <div class="topbar">
      <button class="btn" @click="goToThread(threadId)">Go back</button>
    </div>

    <div class="thread-wrapper" v-if="!thread.isHidden">
      <div class="thread-info" v-if="!isEditing">
        <div class="post-header">
          <div class="post-meta">
            <div v-if="post.refersToPost" @click="goToPost(post.refersToPost)" class="clickable">
              This post references another one! See more...
            </div>
            <div class="login">Author: {{ post.creatorLogin }}</div>
          </div>

          <div class="post-title">
            <div class="title-text">{{ post.title }}</div>
          </div>
        </div>

        <div class="post-stats">
          <p class="likes"><strong>Likes:</strong> {{ likes }}</p>
          <p class="likes"><strong>Dislikes:</strong> {{ disLikes }}</p>
        </div>

        <div class="post-body">
          <HighlightedText v-if="post.content" :text="post.content" class="post-content" />
        </div>

        <div class="post-footer">
          <div class="tags">Tags: {{ post.tags }}</div>

          <div class="post-buttons">
            <button class="btn accent" @click="like()">Like</button>
            <button class="btn accent" @click="disLike()">Dislike</button>
            <button class="btn"
              v-if="!thread.isClosed && !me.isBlockedEverywhere && !isReplying && !blockedUsersId.includes(me._id)"
              @click="isReplying = true"
            >
              Reply
            </button>
            <button class="btn"
              v-if="!me.isBlockedEverywhere && post.creatorId === me._id && !thread.isClosed && !blockedUsersId.includes(me._id)"
              @click="setEditing()"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      <div v-if="isEditing && post.creatorId === me._id && !me.isBlockedEverywhere" class="edit-box">
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

      <div v-if="isReplying && !me.isBlockedEverywhere" class="replying">
        <div class="edit-box">
          <form @submit="reply()" class="edit-form">
            <div class="edit-group">
              <input v-model="replyTitle" placeholder="..." />
              <textarea v-model="replyContent" placeholder="..."></textarea>
              <input v-model="postTags" placeholder="Add tags" />
            </div>
            <button class="btn accent" type="submit">Send reply</button>
          </form>
        </div>
      </div>

      <div class="pagination">
        <button class="btn" v-if="lastPostsPage > 1" @click="prevPostsPage()">Previous page</button>
        <button class="btn" v-if="posts.length >= 20" @click="nextPostsPage()">Next page</button>
      </div>
    </div>

    <AdminChat />
  </div>
</template>

<style scoped>
.post-page{
  max-width: 980px;
  margin: 0 auto;
  padding: 18px 12px 40px;
}

.topbar{
  display: flex;
  justify-content: flex-start;
  margin-bottom: 14px;
}

.thread-wrapper{
  margin: 0 auto;
}

.thread-info{
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 22px 20px;
  box-shadow: 0 14px 36px rgba(0,0,0,0.14);
}

.post-header{
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 14px;
}

.post-meta{
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.clickable{
  color: var(--accent);
  cursor: pointer;
  font-size: 0.92rem;
  display: inline-block;
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.clickable:hover{
  text-decoration: underline;
  opacity: 0.95;
}
.clickable:active{
  transform: translateY(1px);
}

.login{
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.post-title{
  min-width: 0;
  text-align: right;
}

.title-text{
  font-weight: 800;
  font-size: 1.12rem;
  line-height: 1.2;
  color: var(--text);
  max-width: 520px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-stats{
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin: 10px 0 6px;
}

.likes{
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-soft);
  font-size: 0.92rem;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-soft);
}
.likes strong{
  color: var(--text);
  font-weight: 800;
}

.post-body{
  margin-top: 10px;
}

.post-content{
  margin: 10px 0 0;
  line-height: 1.7;
  color: var(--text);
  font-size: 0.97rem;
}

.post-footer{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}

.tags{
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.25;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-buttons{
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn{
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-size: 0.86rem;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 6px 16px rgba(0,0,0,0.10);
  transition: background-color 0.12s ease, border-color 0.12s ease, transform 0.1s ease, box-shadow 0.12s ease, opacity 0.12s ease;
}
.btn:hover{
  background: var(--bg-soft);
  border-color: color-mix(in srgb, var(--border) 55%, var(--accent));
  box-shadow: 0 10px 22px rgba(0,0,0,0.14);
  transform: translateY(-0.5px);
}
.btn:active{
  transform: translateY(1px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.10);
}
.btn:focus-visible{
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.btn.accent{
  background: var(--accent);
  color: #000;
  border-color: transparent;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(0,0,0,0.18);
}
.btn.accent:hover{
  opacity: 0.92;
}

.edit-box{
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 20px 18px;
  margin: 16px auto 0;
  box-shadow: 0 14px 36px rgba(0,0,0,0.14);
}

.edit-form{
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.edit-group{
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-group strong{
  font-size: 0.86rem;
  color: var(--text-soft);
  font-weight: 800;
}

input,
textarea{
  width: 100%;
  padding: 12px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 14px;
  color: var(--text);
  font-size: 0.95rem;
  line-height: 1.2;
  transition: border-color 0.14s ease, box-shadow 0.14s ease, transform 0.08s ease;
}
textarea{
  min-height: 140px;
  resize: vertical;
}
input::placeholder,
textarea::placeholder{
  color: color-mix(in srgb, var(--text-secondary) 85%, transparent);
}
input:focus,
textarea:focus{
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(0,0,0,0.18);
}
input:active,
textarea:active{
  transform: translateY(0.5px);
}

.replying{
  margin-top: 14px;
}

.pagination{
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: center;
  gap: 10px;
}

@media (max-width: 700px){
  .post-header{
    flex-direction: column;
    align-items: flex-start;
  }
  .post-title{
    text-align: left;
    width: 100%;
  }
  .title-text{
    max-width: 100%;
    white-space: normal;
  }
  .tags{
    max-width: 100%;
  }
  .post-buttons{
    justify-content: flex-start;
    width: 100%;
  }
}


</style>