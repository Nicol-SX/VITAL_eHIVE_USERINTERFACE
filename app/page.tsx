'use client';

import React from 'react';
import StatusMonitoring from './components/StatusMonitoring';
import Batch from './vision/components/Batch';
import { MantineProvider } from '@mantine/core';


export default function Home() {
  //return <StatusMonitoring defaultTab="Overview" />;
  
  return (
    <MantineProvider>
      <Batch defaultTab="Batch" />
    </MantineProvider>
  );
} 