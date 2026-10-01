fetch('http://localhost:5000/api/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test_google@example.com', name: '', photoURL: '', googleId: '123' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
