<template>
  <PageShell title="库位管理">
    <div class="grid grid-3">
      <el-card
        v-for="bin in rows"
        :key="bin.id"
        :class="['bin-card', isHighUsage(bin) ? 'bin-high-usage' : '']"
      >
        <h3 class="bin-title">
          {{ bin.area }}-{{ bin.rack }}-{{ bin.level }}{{ bin.column }}
        </h3>
        <OccupancyRing :value="getUsagePercent(bin)" />
        <StatusBadge :status="isHighUsage(bin) ? 'HighUsage' : bin.status" />
        <div class="bin-detail">
          <span>容量: {{ bin.capacity }}</span>
          <span>已用: {{ bin.occupancy }}</span>
        </div>
      </el-card>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PageShell from './PageShell.vue';
import { binLocationApi } from '../api/binLocation';
import OccupancyRing from '../components/common/OccupancyRing.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import { getBinUsagePercent, isHighUsage } from '../utils/capacity';
import type { BinLocation } from '../types';

const rows = ref<BinLocation[]>([]);

const getUsagePercent = (bin: BinLocation) => Math.round(getBinUsagePercent(bin));

onMounted(async () => {
  rows.value = await binLocationApi.list<BinLocation>().catch(() => []);
});
</script>

<style scoped>
.bin-card {
  text-align: center;
  transition: box-shadow 0.3s;
}
.bin-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.bin-high-usage {
  border: 2px solid #dc2626;
}
.bin-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #303133;
}
.bin-detail {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
}
</style>
