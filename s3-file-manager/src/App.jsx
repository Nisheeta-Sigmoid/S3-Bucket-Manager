import React, { useState } from 'react'
import './App.css'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Mainview from './components/Mainview'
import { Routes, Route } from 'react-router-dom'
import BucketList from './components/BucketList'

function Layout(){
  return (
    <div></div>
  )
}

function App() {

  return (
    <div className="main-grid h-full">
      <div className="header">
        <Header />
      </div>

      <div className="sidebar">
        <Sidebar/>
      </div>

      <div className="main">
        <Routes>
          <Route path='/' element={<Layout/>} ></Route>
          <Route path='/bucketitems' element={<BucketList/>} />
          <Route path='/bucketManagement/:id' element={<Mainview/>} />
        </Routes>
      </div>
    </div>
  )
}

export default App
