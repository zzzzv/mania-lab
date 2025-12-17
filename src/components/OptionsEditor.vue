<template>
  <div ref="editorContainer"></div>
</template>

<script setup lang="ts">
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { onMounted, ref } from 'vue';
import JSON5 from 'json5';
import { ElMessage } from 'element-plus';

const props = defineProps<{
  template: string;
}>();

const emit = defineEmits<{
  (e: 'update', value: object): void;
}>();

const editorContainer = ref<HTMLDivElement | null>(null);

onMounted(() => {
  if (editorContainer.value) {
    new EditorView({
      extensions: [
        basicSetup,
        javascript(),
        EditorView.domEventHandlers({
          blur: (_, view) => {
            try {
              const value = JSON5.parse(view.state.doc.toString());
              emit('update', value);
            } catch (e) {
              ElMessage.error('Invalid JSON5 format. Please correct the errors.');
            }
          }
        })
      ],
      parent: editorContainer.value,
      doc: props.template
    });
  }
});

</script>