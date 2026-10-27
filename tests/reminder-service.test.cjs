const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadService({ platform = 'android', expoGo = false, executionEnvironment = 'bare' } = {}) {
  const calls = [];
  const storage = new Map();
  const requests = new Map();
  const notifications = {
    AndroidImportance: { DEFAULT: 3 },
    SchedulableTriggerInputTypes: { DAILY: 'daily' },
    setNotificationHandler(handler) { calls.push(['handler', handler]); },
    async getAllScheduledNotificationsAsync() { return [...requests.values()]; },
    async getPermissionsAsync() { return { granted: true }; },
    async requestPermissionsAsync() { calls.push(['permission']); return { granted: true }; },
    async setNotificationChannelAsync(...args) { calls.push(['channel', ...args]); },
    async scheduleNotificationAsync(request) {
      calls.push(['schedule', request]);
      requests.set('daily-id', { identifier: 'daily-id' });
      return 'daily-id';
    },
    async cancelScheduledNotificationAsync(id) { calls.push(['cancel', id]); requests.delete(id); },
  };
  const context = {
    Platform: { OS: platform },
    // Expo Go may report 'bare'; development builds may report 'storeClient'.
    Constants: { executionEnvironment },
    isRunningInExpoGo: () => expoGo,
    AsyncStorage: {
      async getItem(key) { calls.push(['read', key]); return storage.get(key) ?? null; },
      async setItem(key, value) { storage.set(key, value); },
      async removeItem(key) { storage.delete(key); },
    },
    async loadNotifications() {
      calls.push(['import']);
      if (expoGo || platform === 'web') throw new Error("Cannot find native module 'ExpoTopicSubscriptionModule'");
      return notifications;
    },
    module: { exports: {} },
  };
  const source = fs.readFileSync('src/services/reminderService.js', 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace(/^export /gm, '')
    .replace(/import\('expo-notifications'\)/g, 'loadNotifications()');
  vm.runInNewContext(`${source}\nmodule.exports = { supportsReminders, initializeReminderHandler, getReminderEnabled, setReminderEnabled };`, context);
  return { ...context.module.exports, calls, storage };
}

for (const environment of ['bare', 'storeClient', null]) {
  test(`Expo Go never loads notification native code when constants report ${environment}`, async () => {
    const service = loadService({ expoGo: true, executionEnvironment: environment });
    assert.equal(service.supportsReminders(), false);
    await service.initializeReminderHandler();
    assert.equal(await service.getReminderEnabled(), false);
    await assert.rejects(service.setReminderEnabled(true), /installed Bhakti/);
    await assert.rejects(service.setReminderEnabled(false), /installed Bhakti/);
    assert.deepEqual(service.calls, []);
  });
}

test('web startup and reminder settings do not load native notifications', async () => {
  const service = loadService({ platform: 'web' });
  assert.equal(service.supportsReminders(), false);
  await service.initializeReminderHandler();
  assert.equal(await service.getReminderEnabled(), false);
  await assert.rejects(service.setReminderEnabled(true), /installed Bhakti/);
  assert.deepEqual(service.calls, []);
});

for (const platform of ['android', 'ios']) {
  test(`${platform} development builds retain reminder initialization, scheduling and cancellation`, async () => {
    const service = loadService({ platform, executionEnvironment: 'storeClient' });
    assert.equal(service.supportsReminders(), true);
    await service.initializeReminderHandler();
    const handler = service.calls.find(([name]) => name === 'handler')[1];
    assert.equal((await handler.handleNotification()).shouldShowBanner, true);
    assert.equal(await service.getReminderEnabled(), false);
    assert.equal(await service.setReminderEnabled(true), true);
    assert.equal(await service.getReminderEnabled(), true);
    const request = service.calls.find(([name]) => name === 'schedule')[1];
    assert.equal(request.trigger.type, 'daily');
    assert.equal(request.trigger.hour, 9);
    assert.equal(request.trigger.minute, 0);
    assert.equal(request.trigger.channelId, platform === 'android' ? 'daily-panchang' : undefined);
    assert.equal(service.calls.some(([name]) => name === 'channel'), platform === 'android');
    assert.equal(await service.setReminderEnabled(false), false);
    assert.equal(await service.getReminderEnabled(), false);
    assert.equal(service.storage.size, 0);
    assert.ok(service.calls.some(([name, id]) => name === 'cancel' && id === 'daily-id'));
  });
}
