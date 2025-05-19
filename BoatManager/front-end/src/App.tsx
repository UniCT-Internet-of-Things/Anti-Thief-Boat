import React, { useState } from "react";
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Links } from './constants'
import { ManagementPage, DeviceListPage, AlertPage, LoginPage, SignIn, Unauthorized } from './pages'


const App: React.FC = () => {

    return (
        <BrowserRouter>
            <Routes>
                <Route path={Links[0]} element={<LoginPage />}></Route >
                <Route path={Links[1]} element={<ManagementPage />}></Route >
                <Route path={Links[2]} element={<AlertPage />}></Route >
                <Route path={Links[3]} element={<SignIn />}></Route >
            </Routes>
        </BrowserRouter >
    )
};

export default App;

