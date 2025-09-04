import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { FiUpload, FiDownload, FiEdit2, FiSave, FiX } from 'react-icons/fi';

// Ethiopian regions and sub-cities
const REGIONS = ['Addis Ababa', 'Amhara', 'Oromia', 'Tigray', 'SNNPR', 'Afar', 'Somali', 'Benishangul-Gumuz', 'Gambela', 'Harari', 'Dire Dawa', 'Sidama', 'South West Ethiopia', 'South Ethiopia'];

const ADDIS_ABABA_SUB_CITIES = [
  'Addis Ketema', 'Akaki Kaliti', 'Arada', 'Bole', 'Gulele', 
  'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto', 'Yeka'
];

const DOCUMENT_TYPES = {
  national_id: 'National ID',
  passport: 'Passport',
  driving_license: 'Driving License',
  other: 'Other'
};

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new profile page
    navigate('/dashboard/profile', { replace: true });
  }, [navigate]);

  // Optional: Show a loading state during redirect
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default Profile;
