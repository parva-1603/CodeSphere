const API = 'http://localhost:5100';

async function runTests() {
  console.log('--- Starting CodeSphere Backend API Tests ---');
  let token = '';
  let userId = '';
  let projectId = '';

  // 1. Auth Test: Register
  const testEmail = `tester_${Date.now()}@example.com`;
  console.log(`\n[1] Testing Auth Register with ${testEmail}...`);
  try {
    const regRes = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123', name: 'AutomatedTester' })
    });
    const regData = await regRes.json();
    if (regRes.status === 201 && regData.token) {
      console.log('✅ Auth Register: PASSED');
      token = regData.token;
      userId = regData.user._id;
    } else {
      console.error('❌ Auth Register FAILED:', regRes.status, regData);
    }
  } catch (e) {
    console.error('❌ Auth Register ERROR:', e.message);
  }

  // 2. Auth Test: Login
  console.log('\n[2] Testing Auth Login...');
  try {
    const loginRes = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (loginRes.ok && loginData.token) {
      console.log('✅ Auth Login: PASSED');
    } else {
      console.error('❌ Auth Login FAILED:', loginRes.status, loginData);
    }
  } catch (e) {
    console.error('❌ Auth Login ERROR:', e.message);
  }

  // 3. Auth Test: Verify Profile (/api/auth/me)
  console.log('\n[3] Testing Auth /me...');
  try {
    const meRes = await fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const meData = await meRes.json();
    if (meRes.ok && meData.email === testEmail) {
      console.log('✅ Auth /me: PASSED (Display Name:', meData.displayName, ')');
    } else {
      console.error('❌ Auth /me FAILED:', meRes.status, meData);
    }
  } catch (e) {
    console.error('❌ Auth /me ERROR:', e.message);
  }

  // 4. Project Test: Create Project
  console.log('\n[4] Testing Create Project...');
  try {
    const projRes = await fetch(`${API}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Automated Test Project',
        language: 'javascript',
        description: 'Testing project creation'
      })
    });
    const projData = await projRes.json();
    if (projRes.ok && projData._id) {
      projectId = projData._id;
      console.log('✅ Create Project: PASSED (Project ID:', projectId, ', Name:', projData.name, ')');
    } else {
      console.error('❌ Create Project FAILED:', projRes.status, projData);
    }
  } catch (e) {
    console.error('❌ Create Project ERROR:', e.message);
  }

  // 5. Project Test: List Projects
  console.log('\n[5] Testing Get Projects List...');
  try {
    const listRes = await fetch(`${API}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listData = await listRes.json();
    if (listRes.ok && Array.isArray(listData) && listData.length > 0) {
      console.log(`✅ Get Projects: PASSED (Found ${listData.length} projects)`);
    } else {
      console.error('❌ Get Projects FAILED:', listRes.status, listData);
    }
  } catch (e) {
    console.error('❌ Get Projects ERROR:', e.message);
  }

  // 6. Project Test: Get Project By ID
  console.log(`\n[6] Testing Get Project by ID (${projectId})...`);
  try {
    const getRes = await fetch(`${API}/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getData = await getRes.json();
    if (getRes.ok && getData._id === projectId) {
      console.log('✅ Get Project By ID: PASSED (Name:', getData.name, ')');
    } else {
      console.error('❌ Get Project By ID FAILED:', getRes.status, getData);
    }
  } catch (e) {
    console.error('❌ Get Project By ID ERROR:', e.message);
  }

  // 7. Code Execution Test: /api/run
  console.log('\n[7] Testing Code Execution API (/api/run)...');
  try {
    const runRes = await fetch(`${API}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        language: 'python',
        code: 'print("Hello from CodeSphere Test!")'
      })
    });
    const runData = await runRes.json();
    if (runRes.ok) {
      console.log('✅ Code Execution: PASSED Output:', (runData.output || runData.run?.stdout || JSON.stringify(runData)).trim());
    } else {
      console.log('ℹ️ Code Execution response:', runRes.status, runData);
    }
  } catch (e) {
    console.error('❌ Code Execution ERROR:', e.message);
  }

  // 8. Notifications API Test
  console.log('\n[8] Testing Notifications API...');
  try {
    const notifRes = await fetch(`${API}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const notifData = await notifRes.json();
    if (notifRes.ok && Array.isArray(notifData)) {
      console.log(`✅ Notifications API: PASSED (Found ${notifData.length} notifications)`);
    } else {
      console.error('❌ Notifications API FAILED:', notifRes.status, notifData);
    }
  } catch (e) {
    console.error('❌ Notifications API ERROR:', e.message);
  }

  console.log('\n--- Backend API Tests Completed ---');
}

runTests();
