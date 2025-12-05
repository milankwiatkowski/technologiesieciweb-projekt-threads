<template>
  <div ref="container" v-html="content"></div>
</template>

<script setup>
import { onMounted, onUpdated, ref } from 'vue'
import hljs from 'highlight.js'

const props = defineProps({
  content: String
})

const container = ref(null)

function highlight() {
  const blocks = container.value.querySelectorAll("pre code")
  blocks.forEach(block => hljs.highlightElement(block))
}

onMounted(highlight)
onUpdated(highlight)
</script>
