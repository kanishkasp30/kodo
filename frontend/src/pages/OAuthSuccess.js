import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function OAuthSuccess() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const name = params.get('name');
    const email = params.get('email');
    const role = params.get('role');
    const id = params.get('id');

    if (token) {
      const user = { id, name, email, role };
      loginUser(user, token);
      toast.success(`Welcome, ${name.split(' ')[0]}`);

      fetch('https://kodo-1jlt.onrender.com/api/workspaces/my', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((workspaces) => {
          if (workspaces.length === 0) {
            navigate('/onboarding');
          } else {
            navigate('/app');
          }
        })
        .catch(() => navigate('/app'));
    } else {
      toast.error('Google sign-in failed');
      navigate('/login');
    }
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#1C1917',
        color: '#E8572A',
        fontSize: '18px',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      Signing you in...
    </div>
  );
}



