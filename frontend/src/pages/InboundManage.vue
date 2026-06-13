<template>
  <PageShell title="入库管理">
    <StepIndicator :steps="['收货','质检','上架','完成']" :active="2" />
    <el-card style="margin-top: 16px">
      <el-table :data="rows" empty-text="暂无入库单，请确认后端服务或新增收货任务" row-key="id">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div style="padding: 16px; background: #f5f7fa;">
              <h4 style="margin-bottom: 12px;">入库明细</h4>
              <el-table :data="row.items" size="small">
                <el-table-column prop="productId" label="商品ID" width="100" />
                <el-table-column prop="batchNo" label="批次号" width="140" />
                <el-table-column prop="expectedQty" label="预计数量" width="100" />
                <el-table-column prop="actualQty" label="实际数量" width="100" />
                <el-table-column prop="qcResult" label="质检结果" width="100" />
                <el-table-column label="上架状态" width="100">
                  <template #default="{ row: item }">
                    <el-tag :type="item.shelved ? 'success' : 'warning'">
                      {{ item.shelved ? '已上架' : '待上架' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                  <template #default="{ row: item }">
                    <el-button
                      v-if="!item.shelved"
                      type="primary"
                      size="small"
                      @click="openShelfDialog(row, item)"
                    >
                      上架
                    </el-button>
                    <span v-else style="color: #909399;">库位ID: {{ item.binLocationId }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="orderNo" label="单号" />
        <el-table-column prop="supplier" label="供应商" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <StatusBadge :status="row.status" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="shelfDialogVisible" title="上架操作" width="500px">
      <el-form label-width="100px">
        <el-form-item label="入库单号">
          <span>{{ currentOrder?.orderNo }}</span>
        </el-form-item>
        <el-form-item label="商品批次">
          <span>{{ currentItem?.batchNo }}</span>
        </el-form-item>
        <el-form-item label="上架数量">
          <span>{{ currentItem?.actualQty }}</span>
        </el-form-item>
        <el-form-item label="目标库位" required>
          <el-select v-model="selectedBinId" placeholder="请选择库位" style="width: 100%;">
            <el-option
              v-for="bin in availableBins"
              :key="bin.id"
              :label="`${bin.area}-${bin.rack}-${bin.level}${bin.column} (剩余: ${bin.capacity - bin.occupancy})`"
              :value="bin.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="selectedBin" label="库位信息">
          <div style="width: 100%;">
            <div style="margin-bottom: 8px;">
              <span>容量: {{ selectedBin.capacity }}</span>
              <span style="margin: 0 12px;">已用: {{ selectedBin.occupancy }}</span>
              <span :style="{ color: getBinUsagePercent(selectedBin) > 90 ? '#dc2626' : '#0f766e' }">
                使用率: {{ getBinUsagePercent(selectedBin).toFixed(1) }}%
              </span>
            </div>
            <el-progress
              :percentage="getBinUsagePercent(selectedBin)"
              :color="getBinUsagePercent(selectedBin) > 90 ? '#dc2626' : '#0f766e'"
            />
            <el-alert
              v-if="!isCapacitySufficient"
              title="容量不足"
              type="error"
              :closable="false"
              style="margin-top: 12px;"
            >
              <template #default>
                该库位剩余空间不足，剩余 {{ getRemainingCapacity(selectedBin) }}，需要 {{ currentItem?.actualQty }}
              </template>
            </el-alert>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shelfDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!canShelf" @click="handleShelf">
          确认上架
        </el-button>
      </template>
    </el-dialog>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import PageShell from './PageShell.vue';
import { inboundApi } from '../api/inbound';
import { binLocationApi } from '../api/binLocation';
import StatusBadge from '../components/common/StatusBadge.vue';
import StepIndicator from '../components/common/StepIndicator.vue';
import type { InboundOrder, InboundItem, BinLocation } from '../types';

const rows = ref<InboundOrder[]>([]);
const bins = ref<BinLocation[]>([]);
const shelfDialogVisible = ref(false);
const currentOrder = ref<InboundOrder | null>(null);
const currentItem = ref<InboundItem | null>(null);
const selectedBinId = ref<number | null>(null);

const availableBins = computed(() => bins.value);

const selectedBin = computed(() =>
  bins.value.find((b) => b.id === selectedBinId.value)
);

const getBinUsagePercent = (bin: BinLocation) =>
  bin.capacity > 0 ? (bin.occupancy / bin.capacity) * 100 : 0;

const getRemainingCapacity = (bin: BinLocation) => bin.capacity - bin.occupancy;

const isCapacitySufficient = computed(() => {
  if (!selectedBin.value || !currentItem.value) return false;
  return getRemainingCapacity(selectedBin.value) >= currentItem.value.actualQty;
});

const canShelf = computed(() =>
  selectedBinId.value !== null && isCapacitySufficient.value
);

const openShelfDialog = (order: InboundOrder, item: InboundItem) => {
  currentOrder.value = order;
  currentItem.value = item;
  selectedBinId.value = null;
  shelfDialogVisible.value = true;
};

const handleShelf = async () => {
  if (!currentOrder.value || !currentItem.value || !selectedBinId.value) return;

  try {
    await inboundApi.shelfItem(
      currentOrder.value.id,
      currentItem.value.id,
      selectedBinId.value
    );
    ElMessage.success('上架成功');
    shelfDialogVisible.value = false;
    await loadData();
  } catch (error: any) {
    ElMessage.error(error.message || '上架失败');
  }
};

const loadData = async () => {
  rows.value = await inboundApi.list<InboundOrder>().catch(() => []);
  bins.value = await binLocationApi.list<BinLocation>().catch(() => []);
};

onMounted(async () => {
  await loadData();
});
</script>
