import React from 'react';
import ServiceName from './ServiceName';

const Header: React.FC = () => {
  return (
    <header className="toolnamebar" role="banner">
      <ServiceName />
    </header>
  );
};

export default Header;