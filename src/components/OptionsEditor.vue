<template>
  <div ref="editorContainer"></div>
</template>

<script setup lang="ts">
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { onMounted, onBeforeUnmount, ref } from 'vue';
import JSON5 from 'json5';
import { ElMessage } from 'element-plus';

const props = defineProps<{
  template: string;
}>();

const emit = defineEmits<{
  (e: 'update', value: object): void;
}>();

const editorContainer = ref<HTMLDivElement | null>(null);
let editorView: EditorView | null = null;

function EditorUpdate(view: EditorView) {
  try {
    const value = JSON5.parse(view.state.doc.toString());
    emit('update', value);
  } catch {
    ElMessage.error('Invalid JSON5 format. Please correct the errors.');
  }
}

onMounted(() => {
  if (!editorContainer.value) return;

  editorView = new EditorView({
    extensions: [
      basicSetup,
      javascript(),
      EditorView.domEventHandlers({
        blur: (_, view) => EditorUpdate(view),
      })
    ],
    parent: editorContainer.value,
    doc: props.template
  });
});

onBeforeUnmount(() => {
  editorView?.destroy();
  editorView = null;
});
</script>