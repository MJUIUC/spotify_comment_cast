import React, { useState } from "react";
import AxiosInstance from '../AxiosConfig';
import styled from "styled-components";
import { spotifyUser } from "../SpotifyCallbackHook";

import HistoryList from '../components/HistoryList';
import Account from '../components/Account';

const LandingPageBaseContainer = styled.div`
  width: 100vw;
  min-height: 100vh;
  background-color: black;
  padding-right: 20vw;
  padding-left: 20vw;
  padding-bottom: 20vh;
`;

const AccountSection = styled.div`
  display: flex;
  justify-content: center;
`;

const ListeningHistorySection = styled.div`
  display: flex;
  justify-content: center;
`;

const Landing = () => {
  const [statefulSpotifyUser, setSpotifyUser] = useState(spotifyUser);
  const [userLoading, setLoadingState] = useState(false);

  const loaderWait = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        return resolve('done');
      }, (Math.floor(Math.random() * 4) + 1) * 500);
    });
  };

  AxiosInstance.interceptors.request.use((config) => {
    if (config.url === "/logged_in_user") {
      setLoadingState(true);
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  });

  AxiosInstance.interceptors.response.use((response) => {
    setLoadingState(false);
    return response;
  }, (error) => {
    setLoadingState(false);
    return Promise.reject(error);
  });

  React.useEffect(() => {
    if (!statefulSpotifyUser) {
      (async()=>{
        try {
          const result = await AxiosInstance.get("/logged_in_user");
          setSpotifyUser(result.data.body);
        } catch (error) {
          console.log(error);
        }
      })()
    }
  }, [statefulSpotifyUser]);

  const removeUser = () => {
    setSpotifyUser(null);
  }

  return (
    <LandingPageBaseContainer>
      <AccountSection>
        <Account user={statefulSpotifyUser} userLoadingState={userLoading} removeUser={removeUser} />
      </AccountSection>
      <ListeningHistorySection>
        <HistoryList />
      </ListeningHistorySection>
    </LandingPageBaseContainer>
  );
};

export default Landing;
