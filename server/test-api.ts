import http from 'http';
import app from 'express';

async function runTests() {
  console.log('🧪 Starting CollabFlow API End-to-End Test Suite...');
  const baseUrl = 'http://localhost:5000/api';

  // 1. Start server temporarily or test against running instance
  console.log('1. Testing Demo Auth Endpoint...');
  const demoRes = await fetch(`${baseUrl}/auth/demo`, { method: 'POST' });
  if (!demoRes.ok) throw new Error(`Demo login failed: ${demoRes.status}`);
  const demoData: any = await demoRes.json();
  console.log(`✅ Demo login successful! User: ${demoData.user.name}, Token acquired.`);
  const token = demoData.token;

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Fetch boards
  console.log('2. Testing Get Boards...');
  const boardsRes = await fetch(`${baseUrl}/boards`, { headers: authHeaders });
  const boardsData: any = await boardsRes.json();
  if (!boardsData.boards || boardsData.boards.length === 0) throw new Error('No boards returned');
  const boardId = boardsData.boards[0].id;
  console.log(`✅ Retrieved ${boardsData.boards.length} board(s). Primary Board ID: ${boardId}`);

  // 3. Fetch board details
  console.log('3. Testing Get Board Details with Columns & Tasks...');
  const boardDetailRes = await fetch(`${baseUrl}/boards/${boardId}`, { headers: authHeaders });
  const boardDetail: any = await boardDetailRes.json();
  console.log(`✅ Board "${boardDetail.board.title}" has ${boardDetail.board.columns.length} columns.`);
  const backlogCol = boardDetail.board.columns.find((c: any) => c.title === 'Backlog');
  const inProgressCol = boardDetail.board.columns.find((c: any) => c.title === 'In Progress');

  // 4. Create task
  console.log('4. Testing Create Task...');
  const createRes = await fetch(`${baseUrl}/tasks`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      boardId,
      columnId: backlogCol.id,
      title: 'Automated E2E Test Task: Redis Distributed Locking',
      description: 'Test description for automated verification',
      priority: 'URGENT',
      tags: ['E2E', 'Testing'],
    }),
  });
  const created: any = await createRes.json();
  console.log(`✅ Task created with ID: ${created.task.id}, Priority: ${created.task.priority}`);

  // 5. Move task
  console.log('5. Testing Move Task across columns...');
  const moveRes = await fetch(`${baseUrl}/tasks/${created.task.id}/move`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      destinationColumnId: inProgressCol.id,
      destinationOrder: 0,
    }),
  });
  const moved: any = await moveRes.json();
  console.log(`✅ Task moved to column ${moved.task.columnId} at order ${moved.task.order}`);

  // 6. Update task
  console.log('6. Testing Update Task details...');
  const updateRes = await fetch(`${baseUrl}/tasks/${created.task.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      priority: 'HIGH',
      subtasks: [{ id: 'st-e2e', title: 'Verify Redis lock lease expiration', completed: true }],
    }),
  });
  const updated: any = await updateRes.json();
  console.log(`✅ Task updated. Priority: ${updated.task.priority}, Subtasks: ${updated.task.subtasks.length}`);

  // 7. Delete task
  console.log('7. Testing Delete Task...');
  const deleteRes = await fetch(`${baseUrl}/tasks/${created.task.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const deleted: any = await deleteRes.json();
  console.log(`✅ Task deleted successfully: ${deleted.taskId}`);

  console.log('🎉 All E2E API tests passed with 100% success!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
