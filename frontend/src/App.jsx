import { useState } from 'react';
import UserForm from './components/UserForm';
import UsersList from './components/UsersList';

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className='app-container'>
      <h1>Users ++</h1>
      <UserForm onCreated={triggerRefresh} />
      <UsersList refreshKey={refreshKey} />
    </div>
  );
}
