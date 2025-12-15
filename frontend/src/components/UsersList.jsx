import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function UsersList({ refreshKey }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/users`);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const ct = res.headers.get('content-type') || '';
        let data;
        if (ct.includes('application/json')) {
          data = await res.json();
        } else {
          const text = await res.text();
          throw new Error(`Expected JSON response but got: ${text.slice(0, 200)}`);
        }
        setUsers(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [refreshKey]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className='error'>Error: {error}</div>;

  if (!users || users.length === 0) return <div>No users found.</div>;

  return (
    <ul className='users-list'>
      {users.map((u) => (
        <li key={u._id || u.id}>
          <strong>{(u.firstName || '') + (u.lastName ? ' ' + u.lastName : '') || u.name}</strong> — {u.email}
        </li>
      ))}
    </ul>
  );
}
