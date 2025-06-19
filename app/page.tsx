'use client';

import React from 'react';
import StatusMonitoring from './components/StatusMonitoring';
import Batch from './vision/components/Batch';

export default function Home() {
  //return <StatusMonitoring defaultTab="Overview" />;
  return <Batch defaultTab="Batch" />;
} 