// src/components/Navbar/Navbar.tsx
import * as React from 'react';
import { Navbar as BootstrapNavbar, Container } from 'react-bootstrap';
import '../../styles.css';


// eslint-disable-next-line @typescript-eslint/naming-convention
const Navbar: React.FunctionComponent = () => {
  return (
    <div className="Navbar">
      <BootstrapNavbar expand="lg">
        <Container>
          <BootstrapNavbar.Brand className="container-Navbar">
            <div className="navbar-Logo"></div>
          </BootstrapNavbar.Brand>
          
        </Container>
      </BootstrapNavbar>
    </div>
  );
};

export default Navbar;
