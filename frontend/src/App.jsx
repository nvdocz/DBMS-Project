import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Sales from './pages/Sales';
import Rentals from './pages/Rentals';
import Service from './pages/Service';
import Contact from './pages/Contact';

import Login from './pages/Login';
import Register from './pages/Register';
import ClientProfile from './pages/ClientProfile';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCars from './pages/admin/ManageCars';
import ManageUsers from './pages/admin/ManageUsers';
import ManageInquiries from './pages/admin/ManageInquiries';
import ManageBookings from './pages/admin/ManageBookings';
import ManageServices from './pages/admin/ManageServices';
import InquiryChat from './pages/InquiryChat';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/service" element={<Service />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<ClientProfile />} />
          <Route path="/inquiries/:id" element={
            <ProtectedRoute reqRoles={['client', 'ceo', 'manager', 'marketing', 'delivery']}>
              <InquiryChat />
            </ProtectedRoute>
          } />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={
            <ProtectedRoute reqRoles={['ceo', 'manager', 'marketing', 'delivery']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="cars" element={
              <ProtectedRoute reqRoles={['ceo', 'manager', 'marketing']}>
                <ManageCars />
              </ProtectedRoute>
            } />
            <Route path="users" element={
              <ProtectedRoute reqRoles={['ceo', 'manager']}>
                <ManageUsers />
              </ProtectedRoute>
            } />
            <Route path="sales-inquiries" element={
              <ProtectedRoute reqRoles={['ceo', 'manager', 'marketing', 'delivery']}>
                <ManageInquiries type="sales" />
              </ProtectedRoute>
            } />
            <Route path="rent-inquiries" element={
              <ProtectedRoute reqRoles={['ceo', 'manager', 'marketing', 'delivery']}>
                <ManageInquiries type="rentals" />
              </ProtectedRoute>
            } />
            <Route path="bookings" element={
              <ProtectedRoute reqRoles={['ceo', 'manager', 'marketing', 'delivery']}>
                <ManageBookings />
              </ProtectedRoute>
            } />
            <Route path="services" element={
              <ProtectedRoute reqRoles={['ceo', 'manager', 'marketing', 'delivery']}>
                <ManageServices />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
