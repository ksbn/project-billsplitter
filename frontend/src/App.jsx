import React from 'react';
import { Routes, Route } from 'react-router-dom'
import GroupList from './pages/GroupList'
import Home from './pages/Home'
import Manage from './pages/Manage'
import Join from './pages/Join'
import Summary from './pages/Summary'
import Donate from './pages/Donate'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/groups" element={<GroupList />} />
      <Route path="/manage/:ownerToken" element={<Manage />} />
      <Route path="/join/:joinToken" element={<Join />} />
      <Route path="/summary/:ownerToken" element={<Summary />} />
      <Route path="/donate" element={<Donate />} />
    </Routes>
  );
}