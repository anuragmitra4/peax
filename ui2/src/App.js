import React from 'react';
import './App.css';
import { api } from './utils'

const baseUrl = 'http://localhost:5000/api/v1';
const seedUrl = baseUrl + '/seeds/?s=1';

function App() {
  return (
    <div>
      So excited to start this now!
      {seedUrl}
    </div>
  );
}

export default App;
