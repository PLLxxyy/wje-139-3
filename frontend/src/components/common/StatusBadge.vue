<template><el-tag :type="type">{{ status }}</el-tag></template>
<script setup lang="ts">
const props = defineProps<{ status: string }>();
const type = (() => {
  const s = props.status;
  if (s.includes('Completed') || s.includes('Active') || s.includes('Available')) return 'success';
  if (s.includes('Pending') || s.includes('Occupied')) return 'warning';
  if (s.includes('High') || s.includes('Full') || s.includes('Fail') || s.includes('Maintenance')) return 'danger';
  return 'info';
})();
</script>
