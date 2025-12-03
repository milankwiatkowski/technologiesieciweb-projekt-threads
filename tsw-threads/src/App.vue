<script setup>
import Navbar from "./components/Navbar.vue"
import Footer from "./components/Footer.vue"
</script>

<template>
  <Navbar/>
    <main class="content">
      <router-view :key="$route.fullPath"/>
    </main>
  <Footer/>
</template>

<style>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
#app {
  max-width: none !important;
  width: 100% !important;
  padding: 0;
  margin: 0;
}
.content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

body, html {
  margin: 0;
  padding: 0;
}
</style>
