{{ ... existing imports ... }}
import { FiUser, FiLogOut, FiSettings, FiHome, FiMessageSquare, FiUsers, FiFileText } from 'react-icons/fi';
{{ ... existing imports ... }}

const Navbar = () => {
  {{ ... existing state and hooks ... }}
  const { user, logout } = useAuth();
  {{ ... existing code ... }}

  const userMenuItems = [
    
    {
      label: 'Messages',
      icon: <FiMessageSquare />,
      onClick: () => navigate('/messages')
    },
    ...(user?.role === 'admin' ? [
      { 
        label: 'Admin Dashboard', 
        icon: <FiUsers />, 
        divider: true,
        onClick: () => navigate('/admin/dashboard') 
      }
    ] : []),
    { 
      label: 'Logout', 
      icon: <FiLogOut />, 
      onClick: handleLogout 
    }
  ];

  {{ ... rest of the component ... }}
};

export default Navbar;
