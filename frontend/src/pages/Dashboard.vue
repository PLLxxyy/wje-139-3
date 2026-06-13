<template>
  <PageShell title="仓库总览">
    <div class="grid grid-3">
      <StatCard label="今日收货" :value="rows.length" />
      <StatCard label="待处理任务" :value="rows.filter(r => r.status !== 'Completed').length" />
      <el-card class="occupancy-card">
        <div class="occupancy-title">仓库容量使用率</div>
        <OccupancyRing :value="overallUsagePercent" />
        <div class="occupancy-detail">
          <span>总容量: {{ totalCapacity }}</span>
          <span>已用: {{ totalOccupancy }}</span>
        </div>
      </el-card>
    </div>

    <el-card style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>库位容量概览</span>
          <el-tag v-if="highUsageBins.length > 0" type="danger" size="small">
            {{ highUsageBins.length }} 个库位使用率超90%
          </el-tag>
        </div>
      </template>
      <el-table :data="bins">
        <el-table-column prop="id" label="库位ID" width="80" />
        <el-table-column label="库位编码" width="140">
          <template #default="{ row }">
            {{ row.area }}-{{ row.rack }}-{{ row.level }}{{ row.column }}
          </template>
        </el-table-column>
        <el-table-column prop="capacity" label="总容量" width="100" />
        <el-table-column prop="occupancy" label="已占用" width="100" />
        <el-table-column label="使用率" width="200">
          <template #default="{ row }">
            <div class="usage-cell">
              <el-progress
                :percentage="getUsagePercent(row)"
                :color="getUsagePercent(row) > 90 ? '#dc2626' : '#0f766e'"
                :stroke-width="12"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <span
              :class="['status-text', getUsagePercent(row) > 90 ? 'status-high' : '']"
            >
              {{ getUsagePercent(row) > 90 ? '高负荷' : row.status }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card style="margin-top: 16px">
      <el-table :data="rows">
        <el-table-column prop="orderNo" label="入库单" />
        <el-table-column prop="supplier" label="供应商" />
        <el-table-column prop="status" label="状态" />
      </el-table>
    </el-card>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import PageShell from './PageShell.vue';
import { inboundApi } from '../api/inbound';
import { binLocationApi } from '../api/binLocation';
import StatCard from '../components/common/StatCard.vue';
import OccupancyRing from '../components/common/OccupancyRing.vue';
import { getBinUsagePercent, isHighUsage } from '../utils/capacity';
import type { InboundOrder, BinLocation } from '../types';

const rows = ref<InboundOrder[]>([]);
const bins = ref<BinLocation[]>([]);

const totalCapacity = computed(() =>
  bins.value.reduce((sum, bin) => sum + bin.capacity, 0)
);

const totalOccupancy = computed(() =>
  bins.value.reduce((sum, bin) => sum + bin.occupancy, 0)
);

const overallUsagePercent = computed(() =>
  totalCapacity.value > 0
    ? Math.round((totalOccupancy.value / totalCapacity.value) * 100)
    : 0
);

const getUsagePercent = (bin: BinLocation) => Math.round(getBinUsagePercent(bin));

const highUsageBins = computed(() =>
  bins.value.filter(bin => isHighUsage(bin))
);

onMounted(async () => {
  rows.value = await inboundApi.list<InboundOrder>().catch(() => []);
  bins.value = await binLocationApi.list<BinLocation>().catch(() => []);
});
</script>

<style scoped>
.occupancy-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.occupancy-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}
.occupancy-detail {
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.usage-cell {
  display: flex;
  align-items: center;
}
.status-text {
  color: #606266;
  font-size: 13px;
}
.status-high {
  color: #dc2626;
  font-weight: 600;
}
</style>
