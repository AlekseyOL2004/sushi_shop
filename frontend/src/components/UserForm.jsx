import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function UserForm({ onCreated }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const trimmedEmail = email.trim();
      if (!trimmedFirst || !trimmedEmail) throw new Error('First name and email are required');

      const payload = { firstName: trimmedFirst, lastName: trimmedLast, email: trimmedEmail };
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const err = await res.json();
          // If backend provided field-level details, surface them
          if (err.details) {
            setFieldErrors(err.details);
            throw new Error(err.message || 'Validation failed');
          }
          throw new Error(err.message || 'Failed to create');
        }
        const text = await res.text();
        throw new Error(`Failed to create: ${text.slice(0, 200)}`);
      }
      setFirstName('');
      setLastName('');
      setEmail('');
      setFieldErrors(null);
      if (onCreated) onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ marginBottom: '1rem' }}>
      <div className='form-row'>
        <div className='form-field'>
          <label>First name</label>
          <input placeholder='First name' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          {fieldErrors && fieldErrors.firstName && <div className='error'>{fieldErrors.firstName}</div>}
        </div>
        <div className='form-field'>
          <label>Last name</label>
          <input placeholder='Last name' value={lastName} onChange={(e) => setLastName(e.target.value)} />
          {fieldErrors && fieldErrors.lastName && <div className='error'>{fieldErrors.lastName}</div>}
        </div>
        <div className='form-field'>
          <label>Email</label>
          <input placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} />
          {fieldErrors && fieldErrors.email && <div className='error'>{fieldErrors.email}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className='primary-btn' type='submit' disabled={loading}>
            {loading ? '...' : 'Add'}
          </button>
        </div>
      </div>
      {error && <div className='error'>{error}</div>}
      {fieldErrors && (
        <div className='error' style={{ marginTop: '0.5rem' }}>
          <strong>Details:</strong>
          <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem' }}>
            {Object.entries(fieldErrors).map(([field, msg]) => (
              <li key={field}>
                <strong>{field}:</strong> {msg}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
