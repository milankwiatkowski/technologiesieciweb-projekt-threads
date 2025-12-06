<template>
  <div ref="container" v-html="html"></div>
</template>

<script setup>
import { computed, ref, onMounted, onUpdated } from "vue";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

const props = defineProps({
  text: String
});

const container = ref(null);

const html = computed(() => {
  const text = props.text || "";

  return text.replace(/```(\w+)?\s+([\s\S]*?)```/g, (m, lang, code) => {
    const cls = lang ? `language-${lang}` : "";
    return `<pre><code class="hljs ${cls}">${code}</code></pre>`;
  });
});



function highlight() {
  if (!container.value) return;
  container.value.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightElement(block);
  });
}

onMounted(highlight);
onUpdated(highlight);
</script>
<style scoped>
</style>