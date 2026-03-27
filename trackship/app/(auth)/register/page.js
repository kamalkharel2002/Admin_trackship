
import React from 'react';
import { redirect } from 'next/navigation';

export default function RegisterPage() {
  // Keep registration out of scope for now; avoid broken/empty route.
  redirect('/login');
}

