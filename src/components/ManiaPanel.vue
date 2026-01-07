<template>
  <div ref="panelContainer"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { createPanel, type Options, type DeepPartial, type Context } from '~/lib/mania-panel';

const props = defineProps<{
  options: DeepPartial<Options>;
}>();

const emit = defineEmits<{
  (e: 'update', value: Context): void;
}>();

const panelContainer = ref<HTMLDivElement | null>(null);
let panel: ReturnType<typeof createPanel> | null = null;

let resizeObserver: ResizeObserver | null = null;
const containerHeight = ref(0);

watch(
  [() => props.options, containerHeight],
  ([newOptions, newHeight]) => {
    if (panel) {
      panel.setOptions(newOptions);
      panel.setOptions({
      canvas: {
        height: Math.max(newHeight, 500),
      },
    });
      panel.render();
      emit('update', panel.getContext());
    }
  },
  { deep: true }
);

onMounted(() => {
  const el = panelContainer.value;
  if (!el) return;

  panel = createPanel(el);

  const applySize = () => {
    if (panelContainer.value && panel) {
      containerHeight.value = panelContainer.value.clientHeight;
    }
  };

  applySize();

  resizeObserver = new ResizeObserver(() => {
    applySize();
  });
  resizeObserver.observe(el);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  panel?.destroy();
  panel = null;
});
</script>