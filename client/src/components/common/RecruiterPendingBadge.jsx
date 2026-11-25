import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

// Simple badge component – you can replace with your own UI library if desired
export default function RecruiterPendingBadge() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const { data } = await axios.get('/api/officer/users', {
          params: { role: 'recruiter', isActive: false },
        });
        const count = data?.users?.length ?? 0;
        setPending(count);
        if (count > 0) {
          toast.info(`You have ${count} recruiter${count > 1 ? 's' : ''} awaiting approval`);
        }
      } catch (err) {
        console.error('Failed to fetch pending recruiters', err);
      }
    };
    fetchPending();
  }, []);

  if (!pending) return null;

  return (
    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-600 text-xs font-medium text-white">
      {pending}
    </span>
  );
};

