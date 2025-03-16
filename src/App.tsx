import React from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import ChinaMap from './components/ChinaMap';

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

function App() {
  return (
    <AppContainer>
      <Header />
      <MainContent>
        <ChinaMap />
      </MainContent>
    </AppContainer>
  );
}

export default App;
