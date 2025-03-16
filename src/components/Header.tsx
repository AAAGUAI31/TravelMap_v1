import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  text-align: center;
  padding: 2rem 0;
  background-color: #1976d2;
  color: white;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin: 0;
  font-weight: bold;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  margin: 0.5rem 0 0;
  opacity: 0.9;
`;

const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <Title>我的旅行地图</Title>
      <Subtitle>点击省份记录你的足迹</Subtitle>
    </HeaderContainer>
  );
};

export default Header; 